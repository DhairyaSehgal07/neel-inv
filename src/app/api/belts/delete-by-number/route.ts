import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import Belt from '@/model/Belt';
import BeltHistory from '@/model/BeltHistory';
import CompoundBatch from '@/model/CompoundBatch';
import CompoundHistory from '@/model/CompoundHistory';
import Fabric from '@/model/Fabric';

/**
 * Delete belt and all associated data by belt number
 */
async function deleteBeltByNumber(request: NextRequest) {
  let session: mongoose.ClientSession | undefined;
  try {
    await dbConnect();

    const body = await request.json();
    const { beltNumber } = body;

    // Validate belt number
    if (!beltNumber || typeof beltNumber !== 'string' || beltNumber.trim() === '') {
      const response: ApiResponse = {
        success: false,
        message: 'Belt number is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Find the belt by belt number
    const belt = await Belt.findOne({ beltNumber: beltNumber.trim() }).session(session);

    if (!belt) {
      await session.abortTransaction();
      const response: ApiResponse = {
        success: false,
        message: 'Belt not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const beltId = belt._id;

    // Collect all batch IDs from the belt (cover and skim batches)
    const batchIds = new Set<string>();

    if (belt.coverBatchesUsed && belt.coverBatchesUsed.length > 0) {
      belt.coverBatchesUsed.forEach((batch) => {
        const batchIdStr = typeof batch.batchId === 'string'
          ? batch.batchId
          : batch.batchId.toString();
        batchIds.add(batchIdStr);
      });
    }

    if (belt.skimBatchesUsed && belt.skimBatchesUsed.length > 0) {
      belt.skimBatchesUsed.forEach((batch) => {
        const batchIdStr = typeof batch.batchId === 'string'
          ? batch.batchId
          : batch.batchId.toString();
        batchIds.add(batchIdStr);
      });
    }

    // Find all BeltHistory records for this belt and collect their batch IDs
    const beltHistories = await BeltHistory.find({ beltId }).session(session);

    beltHistories.forEach((history) => {
      if (history.coverBatchesUsed && history.coverBatchesUsed.length > 0) {
        history.coverBatchesUsed.forEach((batch) => {
          const batchIdStr = typeof batch.batchId === 'string'
            ? batch.batchId
            : batch.batchId.toString();
          batchIds.add(batchIdStr);
        });
      }

      if (history.skimBatchesUsed && history.skimBatchesUsed.length > 0) {
        history.skimBatchesUsed.forEach((batch) => {
          const batchIdStr = typeof batch.batchId === 'string'
            ? batch.batchId
            : batch.batchId.toString();
          batchIds.add(batchIdStr);
        });
      }
    });

    // Convert batch IDs to ObjectId array
    const batchObjectIds = Array.from(batchIds).map((id) => new mongoose.Types.ObjectId(id));

    // 1. Delete BeltHistory records for this belt
    const beltHistoryDeleteResult = await BeltHistory.deleteMany({ beltId }).session(session);
    console.log(`Deleted ${beltHistoryDeleteResult.deletedCount} BeltHistory records`);

    // 2. Delete CompoundHistory records for batches used by this belt
    let compoundHistoryDeleteCount = 0;
    if (batchObjectIds.length > 0) {
      const compoundHistoryDeleteResult = await CompoundHistory.deleteMany({
        batchId: { $in: batchObjectIds },
      }).session(session);
      compoundHistoryDeleteCount = compoundHistoryDeleteResult.deletedCount;
      console.log(`Deleted ${compoundHistoryDeleteCount} CompoundHistory records`);
    }

    // 3. Delete CompoundBatch records used by this belt (only if not used by other belts)
    let compoundBatchDeleteCount = 0;
    if (batchObjectIds.length > 0) {
      // Check which batches are used by other belts
      const batchesToDelete: mongoose.Types.ObjectId[] = [];

      for (const batchId of batchObjectIds) {
        // Check if this batch is used by other belts
        const otherBeltsWithBatch = await Belt.countDocuments({
          $or: [
            { 'coverBatchesUsed.batchId': batchId },
            { 'skimBatchesUsed.batchId': batchId },
          ],
          _id: { $ne: beltId },
        }).session(session);

        // Check if this batch is used by other belt histories
        const otherBeltHistoriesWithBatch = await BeltHistory.countDocuments({
          $or: [
            { 'coverBatchesUsed.batchId': batchId },
            { 'skimBatchesUsed.batchId': batchId },
          ],
          beltId: { $ne: beltId },
        }).session(session);

        // Only delete if not used by other belts or belt histories
        if (otherBeltsWithBatch === 0 && otherBeltHistoriesWithBatch === 0) {
          batchesToDelete.push(batchId);
        }
      }

      if (batchesToDelete.length > 0) {
        const compoundBatchDeleteResult = await CompoundBatch.deleteMany({
          _id: { $in: batchesToDelete },
        }).session(session);
        compoundBatchDeleteCount = compoundBatchDeleteResult.deletedCount;
        console.log(`Deleted ${compoundBatchDeleteCount} CompoundBatch records`);
      }
    }

    // 4. Delete Fabric record if it exists
    let fabricDeleteCount = 0;
    if (belt.fabricId) {
      const fabricId = typeof belt.fabricId === 'string'
        ? new mongoose.Types.ObjectId(belt.fabricId)
        : belt.fabricId;

      // Check if this fabric is used by other belts
      const otherBeltsWithFabric = await Belt.countDocuments({
        fabricId,
        _id: { $ne: beltId },
      }).session(session);

      // Only delete fabric if it's not used by other belts
      if (otherBeltsWithFabric === 0) {
        // Also check BeltHistory for other belts using this fabric
        const otherBeltHistoriesWithFabric = await BeltHistory.countDocuments({
          fabricId,
          beltId: { $ne: beltId },
        }).session(session);

        if (otherBeltHistoriesWithFabric === 0) {
          const fabricDeleteResult = await Fabric.deleteOne({ _id: fabricId }).session(session);
          fabricDeleteCount = fabricDeleteResult.deletedCount;
          console.log(`Deleted ${fabricDeleteCount} Fabric record`);
        }
      }
    }

    // 5. Finally, delete the Belt itself
    const beltDeleteResult = await Belt.deleteOne({ _id: beltId }).session(session);

    if (beltDeleteResult.deletedCount === 0) {
      await session.abortTransaction();
      const response: ApiResponse = {
        success: false,
        message: 'Failed to delete belt',
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Commit transaction
    await session.commitTransaction();

    const response: ApiResponse = {
      success: true,
      message: 'Belt and all associated data deleted successfully',
      data: {
        beltNumber,
        deletedCounts: {
          belt: beltDeleteResult.deletedCount,
          beltHistory: beltHistoryDeleteResult.deletedCount,
          compoundHistory: compoundHistoryDeleteCount,
          compoundBatch: compoundBatchDeleteCount,
          fabric: fabricDeleteCount,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting belt:', error);

    // Rollback transaction on error
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete belt',
    };
    return NextResponse.json(response, { status: 500 });
  } finally {
    // End session
    if (session) {
      await session.endSession();
    }
  }
}

export const DELETE = (request: NextRequest) =>
  withRBAC(request, Permission.BELT_DELETE, deleteBeltByNumber);
