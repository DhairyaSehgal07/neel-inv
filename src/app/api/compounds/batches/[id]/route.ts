import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';
import { roundTo2Decimals } from '@/lib/utils';
import { revertCompoundConsumption, findBeltsUsingBatch, consumeCompound } from '@/lib/services/compound-service';
import Belt, { BeltDoc } from '@/model/Belt';
import { formatLocalDate } from '@/lib/helpers/compound-utils';

/**
 * Update compound batch handler
 */
async function updateCompoundBatchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  let session: mongoose.ClientSession | undefined;
  try {
    await dbConnect();

    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Validate MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid compound batch ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body = await request.json();

    // Check if batch exists
    const existingBatch = await CompoundBatch.findById(id);
    if (!existingBatch) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound batch not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Validate input fields
    const updateData: Partial<typeof existingBatch> = {};

    if (body.compoundCode !== undefined) {
      updateData.compoundCode = body.compoundCode;
    }

    if (body.compoundName !== undefined) {
      updateData.compoundName = body.compoundName;
    }

    if (body.date !== undefined) {
      // Check if date is being changed and if it already exists
      if (body.date !== existingBatch.date) {
        const batchWithSameDate = await CompoundBatch.findOne({
          date: body.date,
          _id: { $ne: id },
        });
        if (batchWithSameDate) {
          const response: ApiResponse = {
            success: false,
            message: 'A batch with this date already exists',
          };
          return NextResponse.json(response, { status: 400 });
        }
      }
      updateData.date = body.date;
    }

    if (body.batches !== undefined) {
      const batches = typeof body.batches === 'number' ? body.batches : parseFloat(body.batches);
      if (isNaN(batches) || batches <= 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Batches must be a positive number',
        };
        return NextResponse.json(response, { status: 400 });
      }
      updateData.batches = batches;
    }

    if (body.weightPerBatch !== undefined) {
      const weightPerBatch =
        typeof body.weightPerBatch === 'number' ? body.weightPerBatch : parseFloat(body.weightPerBatch);
      if (isNaN(weightPerBatch) || weightPerBatch <= 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Weight per batch must be a positive number',
        };
        return NextResponse.json(response, { status: 400 });
      }
      updateData.weightPerBatch = roundTo2Decimals(weightPerBatch);
    }

    if (body.skimCompoundProducedOn !== undefined) {
      // Allow empty string to clear the field, or validate date format
      if (body.skimCompoundProducedOn === '' || body.skimCompoundProducedOn === null) {
        updateData.skimCompoundProducedOn = undefined;
      } else {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(body.skimCompoundProducedOn)) {
          const response: ApiResponse = {
            success: false,
            message: 'Skim compound produced on date must be in YYYY-MM-DD format',
          };
          return NextResponse.json(response, { status: 400 });
        }
        updateData.skimCompoundProducedOn = body.skimCompoundProducedOn;
      }
    }

    if (body.coverCompoundProducedOn !== undefined) {
      // Allow empty string to clear the field, or validate date format
      if (body.coverCompoundProducedOn === '' || body.coverCompoundProducedOn === null) {
        updateData.coverCompoundProducedOn = undefined;
      } else {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(body.coverCompoundProducedOn)) {
          const response: ApiResponse = {
            success: false,
            message: 'Cover compound produced on date must be in YYYY-MM-DD format',
          };
          return NextResponse.json(response, { status: 400 });
        }
        updateData.coverCompoundProducedOn = body.coverCompoundProducedOn;
      }
    }

    // Check if inventory-related fields are changing
    const inventoryChanging = body.batches !== undefined || body.weightPerBatch !== undefined;
    const needsStockRecalculation = inventoryChanging;

    // Start transaction if inventory is changing
    if (needsStockRecalculation) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    // Recalculate totalInventory if batches or weightPerBatch changed
    if (body.batches !== undefined || body.weightPerBatch !== undefined) {
      const batches = body.batches !== undefined
        ? (typeof body.batches === 'number' ? body.batches : parseFloat(body.batches))
        : existingBatch.batches;
      const weightPerBatch = body.weightPerBatch !== undefined
        ? (typeof body.weightPerBatch === 'number' ? body.weightPerBatch : parseFloat(body.weightPerBatch))
        : existingBatch.weightPerBatch;

      const newTotalInventory = roundTo2Decimals(batches * weightPerBatch);
      updateData.totalInventory = newTotalInventory;

      // Adjust inventoryRemaining proportionally if totalInventory changed
      if (existingBatch.totalInventory > 0) {
        const ratio = newTotalInventory / existingBatch.totalInventory;
        const newInventoryRemaining = roundTo2Decimals(Math.max(0, existingBatch.inventoryRemaining * ratio));
        const newConsumed = roundTo2Decimals(newTotalInventory - newInventoryRemaining);

        // If existing consumed exceeds new total inventory (inventory would go negative), we need to recalculate affected belts
        if (existingBatch.consumed > newTotalInventory || newInventoryRemaining < 0) {
          // First, update the batch with new totalInventory and adjust inventoryRemaining proportionally
          // This ensures the batch has the correct total before we recalculate
          const tempUpdateQuery = CompoundBatch.findByIdAndUpdate(
            id,
            {
              $set: {
                totalInventory: newTotalInventory,
                inventoryRemaining: roundTo2Decimals(Math.max(0, newInventoryRemaining)),
                consumed: roundTo2Decimals(Math.min(existingBatch.consumed, newTotalInventory)),
              },
            },
            { new: true }
          );

          if (session) {
            tempUpdateQuery.session(session);
          }

          await tempUpdateQuery.exec();

          // Find all belts using this batch
          const beltsUsingBatch = await findBeltsUsingBatch(new mongoose.Types.ObjectId(id), session);

          if (beltsUsingBatch.length > 0) {
            // Group by belt and compound type
            const beltMap = new Map<string, {
              belt: BeltDoc;
              coverUsage?: { batchId: mongoose.Types.ObjectId; consumedKg: number };
              skimUsage?: { batchId: mongoose.Types.ObjectId; consumedKg: number };
            }>();

            for (const item of beltsUsingBatch) {
              const beltId = (item.belt._id as mongoose.Types.ObjectId).toString();
              if (!beltMap.has(beltId)) {
                beltMap.set(beltId, { belt: item.belt });
              }
              const beltData = beltMap.get(beltId)!;
              if (item.isCover) {
                beltData.coverUsage = item.batchUsage;
              } else {
                beltData.skimUsage = item.batchUsage;
              }
            }

            // Revert consumption from this batch for all affected belts
            for (const [, beltData] of beltMap) {
              const batchesToRevert: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }> = [];
              if (beltData.coverUsage) {
                batchesToRevert.push(beltData.coverUsage);
              }
              if (beltData.skimUsage) {
                batchesToRevert.push(beltData.skimUsage);
              }

              if (batchesToRevert.length > 0) {
                await revertCompoundConsumption(batchesToRevert, session);
              }
            }

            // Re-consume for affected belts using FIFO
            for (const [, beltData] of beltMap) {
              const belt = beltData.belt;
              const preferredDate = belt.process?.calendaringDate
                ? formatLocalDate(new Date(belt.process.calendaringDate))
                : formatLocalDate(new Date());

              let newCoverBatches = belt.coverBatchesUsed || [];
              let newSkimBatches = belt.skimBatchesUsed || [];

              // Remove the batch we're updating from the list
              newCoverBatches = newCoverBatches.filter(
                (b: { batchId: mongoose.Types.ObjectId | string; consumedKg: number }) => b.batchId.toString() !== id
              );
              newSkimBatches = newSkimBatches.filter(
                (b: { batchId: mongoose.Types.ObjectId | string; consumedKg: number }) => b.batchId.toString() !== id
              );

              // Re-consume cover if needed
              if (beltData.coverUsage && beltData.coverUsage.consumedKg > 0) {
                const coverBatch = await CompoundBatch.findById(id).session(session || null);
                if (coverBatch) {
                  const coverUsage = await consumeCompound(
                    coverBatch.compoundCode,
                    beltData.coverUsage.consumedKg,
                    preferredDate,
                    session,
                    belt.process?.coverCompoundProducedOn,
                    'cover'
                  );
                  newCoverBatches = [...newCoverBatches, ...coverUsage.batchesUsed.map(b => ({
                    batchId: b.batchId,
                    consumedKg: b.consumedKg,
                  }))];
                }
              }

              // Re-consume skim if needed
              if (beltData.skimUsage && beltData.skimUsage.consumedKg > 0) {
                const skimBatch = await CompoundBatch.findById(id).session(session || null);
                if (skimBatch) {
                  const skimUsage = await consumeCompound(
                    skimBatch.compoundCode,
                    beltData.skimUsage.consumedKg,
                    preferredDate,
                    session,
                    belt.process?.skimCompoundProducedOn,
                    'skim'
                  );
                  newSkimBatches = [...newSkimBatches, ...skimUsage.batchesUsed.map(b => ({
                    batchId: b.batchId,
                    consumedKg: b.consumedKg,
                  }))];
                }
              }

              // Update belt with new batch usage
              const updateBeltQuery = Belt.findByIdAndUpdate(
                belt._id,
                {
                  $set: {
                    coverBatchesUsed: newCoverBatches,
                    skimBatchesUsed: newSkimBatches,
                  },
                },
                { new: true }
              );

              if (session) {
                updateBeltQuery.session(session);
              }

              await updateBeltQuery.exec();
            }
          }

          // After recalculation, fetch the updated batch to get the correct consumed and inventoryRemaining values
          const recalculatedBatch = await CompoundBatch.findById(id).session(session || null);
          if (recalculatedBatch) {
            updateData.inventoryRemaining = recalculatedBatch.inventoryRemaining;
            updateData.consumed = recalculatedBatch.consumed;
          }
        } else {
          updateData.inventoryRemaining = newInventoryRemaining;
          updateData.consumed = newConsumed;
        }
      } else {
        updateData.inventoryRemaining = newTotalInventory;
        updateData.consumed = 0;
      }
    }

    // Update compound batch
    const updateQuery = CompoundBatch.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (session) {
      updateQuery.session(session);
    }

    const updatedBatch = await updateQuery.exec();

    if (!updatedBatch) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound batch not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Commit transaction if started
    if (session && session.inTransaction()) {
      await session.commitTransaction();
    }

    const response: ApiResponse = {
      success: true,
      message: 'Compound batch updated successfully',
      data: updatedBatch,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating compound batch:', error);

    // Rollback transaction on error
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    // Handle duplicate key errors (MongoDB duplicate key error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'A batch with this date already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update compound batch',
    };
    return NextResponse.json(response, { status: 500 });
  } finally {
    // End session
    if (session) {
      await session.endSession();
    }
  }
}

export const PUT = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_BATCH_UPDATE, updateCompoundBatchHandler);

/**
 * Delete compound batch handler
 */
async function deleteCompoundBatchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  let session: mongoose.ClientSession | undefined;
  try {
    await dbConnect();

    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Validate MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid compound batch ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if batch exists
    const existingBatch = await CompoundBatch.findById(id);
    if (!existingBatch) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound batch not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if batch has been consumed
    if (existingBatch.consumed > 0) {
      // Start transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // Find all belts using this batch
      const beltsUsingBatch = await findBeltsUsingBatch(new mongoose.Types.ObjectId(id), session);

      if (beltsUsingBatch.length > 0) {
        // Group by belt and compound type
        const beltMap = new Map<string, {
          belt: BeltDoc;
          coverUsage?: { batchId: mongoose.Types.ObjectId; consumedKg: number };
          skimUsage?: { batchId: mongoose.Types.ObjectId; consumedKg: number };
        }>();

        for (const item of beltsUsingBatch) {
          const beltId = (item.belt._id as mongoose.Types.ObjectId).toString();
          if (!beltMap.has(beltId)) {
            beltMap.set(beltId, { belt: item.belt });
          }
          const beltData = beltMap.get(beltId)!;
          if (item.isCover) {
            beltData.coverUsage = item.batchUsage;
          } else {
            beltData.skimUsage = item.batchUsage;
          }
        }

        // Revert consumption from this batch for all affected belts
        for (const [, beltData] of beltMap) {
          const batchesToRevert: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }> = [];
          if (beltData.coverUsage) {
            batchesToRevert.push(beltData.coverUsage);
          }
          if (beltData.skimUsage) {
            batchesToRevert.push(beltData.skimUsage);
          }

          if (batchesToRevert.length > 0) {
            await revertCompoundConsumption(batchesToRevert, session);
          }
        }

        // Re-consume for affected belts using FIFO from other batches
        for (const [, beltData] of beltMap) {
          const belt = beltData.belt;
          const preferredDate = belt.process?.calendaringDate
            ? formatLocalDate(new Date(belt.process.calendaringDate))
            : formatLocalDate(new Date());

          let newCoverBatches = belt.coverBatchesUsed || [];
          let newSkimBatches = belt.skimBatchesUsed || [];

          // Remove the batch we're deleting from the list
          newCoverBatches = newCoverBatches.filter(
            (b: { batchId: mongoose.Types.ObjectId | string; consumedKg: number }) => b.batchId.toString() !== id
          );
          newSkimBatches = newSkimBatches.filter(
            (b: { batchId: mongoose.Types.ObjectId | string; consumedKg: number }) => b.batchId.toString() !== id
          );

          // Re-consume cover if needed
          if (beltData.coverUsage && beltData.coverUsage.consumedKg > 0) {
            const coverUsage = await consumeCompound(
              existingBatch.compoundCode,
              beltData.coverUsage.consumedKg,
              preferredDate,
              session,
              belt.process?.coverCompoundProducedOn,
              'cover'
            );
            newCoverBatches = [...newCoverBatches, ...coverUsage.batchesUsed.map(b => ({
              batchId: b.batchId,
              consumedKg: b.consumedKg,
            }))];
          }

          // Re-consume skim if needed
          if (beltData.skimUsage && beltData.skimUsage.consumedKg > 0) {
            const skimUsage = await consumeCompound(
              existingBatch.compoundCode,
              beltData.skimUsage.consumedKg,
              preferredDate,
              session,
              belt.process?.skimCompoundProducedOn,
              'skim'
            );
            newSkimBatches = [...newSkimBatches, ...skimUsage.batchesUsed.map(b => ({
              batchId: b.batchId,
              consumedKg: b.consumedKg,
            }))];
          }

          // Update belt with new batch usage
          const updateBeltQuery = Belt.findByIdAndUpdate(
            belt._id,
            {
              $set: {
                coverBatchesUsed: newCoverBatches,
                skimBatchesUsed: newSkimBatches,
              },
            },
            { new: true }
          );

          if (session) {
            updateBeltQuery.session(session);
          }

          await updateBeltQuery.exec();
        }
      }

      // Delete the batch
      const deleteQuery = CompoundBatch.findByIdAndDelete(id);
      if (session) {
        deleteQuery.session(session);
      }

      const deletedBatch = await deleteQuery.exec();

      if (!deletedBatch) {
        throw new Error('Failed to delete compound batch');
      }

      // Commit transaction
      await session.commitTransaction();
    } else {
      // No consumption, safe to delete directly
      const deletedBatch = await CompoundBatch.findByIdAndDelete(id);
      if (!deletedBatch) {
        throw new Error('Failed to delete compound batch');
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Compound batch deleted successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting compound batch:', error);

    // Rollback transaction on error
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete compound batch',
    };
    return NextResponse.json(response, { status: 500 });
  } finally {
    // End session
    if (session) {
      await session.endSession();
    }
  }
}

export const DELETE = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_BATCH_DELETE, deleteCompoundBatchHandler);
