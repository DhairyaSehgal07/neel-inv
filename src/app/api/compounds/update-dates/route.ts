import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import Belt from '@/model/Belt';
import CompoundBatch from '@/model/CompoundBatch';
import CompoundHistory from '@/model/CompoundHistory';

/**
 * Compare two date strings (YYYY-MM-DD format) and return the latest one
 */
function getLatestDate(date1: string | undefined, date2: string | undefined): string | undefined {
  if (!date1) return date2;
  if (!date2) return date1;
  return date1 > date2 ? date1 : date2;
}

/**
 * Update compound batch and history dates based on belt calendaring dates
 *
 * Logic:
 * 1. Go through all belts
 * 2. Get calendaring date from each belt
 * 3. For each belt, collect batchIds from coverBatchesUsed and skimBatchesUsed
 * 4. Group by batchId and find the latest calendaringDate for each batchId
 * 5. Update CompoundBatch and CompoundHistory documents with the latest calendaringDate
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateCompoundDatesHandler(_request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all belts
    const belts = await Belt.find({}).lean();

    // Map to store batchId -> latest calendaringDate
    const batchDateMap = new Map<string, string>();

    // Process each belt
    let beltsWithCalendaringDate = 0;

    for (const belt of belts) {
      const calendaringDate = belt.process?.calendaringDate;

      if (!calendaringDate) {
        continue;
      }

      beltsWithCalendaringDate++;
      const batchIds: mongoose.Types.ObjectId[] = [];

      // Collect batchIds from coverBatchesUsed
      if (belt.coverBatchesUsed && belt.coverBatchesUsed.length > 0) {
        for (const batchUsage of belt.coverBatchesUsed) {
          if (batchUsage.batchId) {
            batchIds.push(
              typeof batchUsage.batchId === 'string'
                ? new mongoose.Types.ObjectId(batchUsage.batchId)
                : batchUsage.batchId
            );
          }
        }
      }

      // Collect batchIds from skimBatchesUsed
      if (belt.skimBatchesUsed && belt.skimBatchesUsed.length > 0) {
        for (const batchUsage of belt.skimBatchesUsed) {
          if (batchUsage.batchId) {
            batchIds.push(
              typeof batchUsage.batchId === 'string'
                ? new mongoose.Types.ObjectId(batchUsage.batchId)
                : batchUsage.batchId
            );
          }
        }
      }

      // Update the map with the latest calendaringDate for each batchId
      for (const batchId of batchIds) {
        const batchIdStr = batchId.toString();
        const existingDate = batchDateMap.get(batchIdStr);
        const latestDate = getLatestDate(calendaringDate, existingDate);
        if (latestDate) {
          batchDateMap.set(batchIdStr, latestDate);
        }
      }
    }

    if (batchDateMap.size === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: 'No batches found to update',
          data: {
            beltsProcessed: belts.length,
            beltsWithCalendaringDate: 0,
            uniqueBatchIds: 0,
            updatedBatches: 0,
            updatedHistoryRecords: 0,
          },
        },
        { status: 200 }
      );
    }

    // Update CompoundBatch documents
    let updatedBatches = 0;
    let updatedHistoryRecords = 0;
    let skippedBatches = 0;
    const skippedBatchDetails: Array<{ batchId: string; reason: string }> = [];

    for (const [batchIdStr, calendaringDate] of batchDateMap.entries()) {
      try {
        const batchId = new mongoose.Types.ObjectId(batchIdStr);

        // Check if batch exists
        const existingBatch = await CompoundBatch.findById(batchId);
        if (!existingBatch) {
          skippedBatches++;
          skippedBatchDetails.push({
            batchId: batchIdStr,
            reason: 'Batch not found',
          });
          continue;
        }

        // Check if the date is already the same (no update needed)
        if (existingBatch.date === calendaringDate) {
          // Still update history records even if batch date is already correct
          const historyResult = await CompoundHistory.updateMany(
            { batchId: batchId },
            { $set: { date: calendaringDate } }
          );

          if (historyResult.modifiedCount > 0) {
            updatedHistoryRecords += historyResult.modifiedCount;
          }
          continue;
        }

        // Check if another batch already has this date (unique constraint)
        const batchWithSameDate = await CompoundBatch.findOne({
          date: calendaringDate,
          _id: { $ne: batchId },
        });

        if (batchWithSameDate) {
          skippedBatches++;
          const existingBatchId = batchWithSameDate._id
            ? batchWithSameDate._id.toString()
            : 'unknown';
          skippedBatchDetails.push({
            batchId: batchIdStr,
            reason: `Date ${calendaringDate} already exists for batch ${existingBatchId}`,
          });
          // Still update history records
          const historyResult = await CompoundHistory.updateMany(
            { batchId: batchId },
            { $set: { date: calendaringDate } }
          );

          if (historyResult.modifiedCount > 0) {
            updatedHistoryRecords += historyResult.modifiedCount;
          }
          continue;
        }

        // Safe to update - no duplicate date conflict
        const batchResult = await CompoundBatch.updateOne(
          { _id: batchId },
          { $set: { date: calendaringDate } }
        );

        if (batchResult.modifiedCount > 0) {
          updatedBatches++;
        }

        // Update all CompoundHistory documents with this batchId
        const historyResult = await CompoundHistory.updateMany(
          { batchId: batchId },
          { $set: { date: calendaringDate } }
        );

        if (historyResult.modifiedCount > 0) {
          updatedHistoryRecords += historyResult.modifiedCount;
        }
      } catch (error) {
        // Handle duplicate key error or other errors for this specific batch
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
          skippedBatches++;
          skippedBatchDetails.push({
            batchId: batchIdStr,
            reason: `Duplicate date constraint: ${calendaringDate} already exists`,
          });
        } else {
          // Log unexpected errors but continue with other batches
          console.error(`Error updating batch ${batchIdStr}:`, error);
          skippedBatches++;
          skippedBatchDetails.push({
            batchId: batchIdStr,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Still try to update history records even if batch update failed
        try {
          const batchId = new mongoose.Types.ObjectId(batchIdStr);
          const historyResult = await CompoundHistory.updateMany(
            { batchId: batchId },
            { $set: { date: calendaringDate } }
          );

          if (historyResult.modifiedCount > 0) {
            updatedHistoryRecords += historyResult.modifiedCount;
          }
        } catch (historyError) {
          console.error(`Error updating history for batch ${batchIdStr}:`, historyError);
        }
      }
    }

    const hasSkippedBatches = skippedBatches > 0;
    const message = hasSkippedBatches
      ? `Compound dates updated with ${skippedBatches} batch(es) skipped due to duplicate date constraints`
      : 'Compound dates updated successfully';

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message,
        data: {
          beltsProcessed: belts.length,
          beltsWithCalendaringDate,
          uniqueBatchIds: batchDateMap.size,
          updatedBatches,
          updatedHistoryRecords,
          skippedBatches,
          skippedBatchDetails: skippedBatchDetails.length > 0 ? skippedBatchDetails : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating compound dates:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: `Failed to update compound dates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_BATCH_UPDATE, updateCompoundDatesHandler);
