import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';
import CompoundMaster from '@/model/CompoundMaster';

/**
 * Update compound batch handler
 */
async function updateCompoundBatchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

      // Look up CompoundMaster by compoundCode and update compoundMasterId
      const master = await CompoundMaster.findOne({ compoundCode: body.compoundCode });
      if (!master) {
        const response: ApiResponse = {
          success: false,
          message: `CompoundMaster not found for code: ${body.compoundCode}`,
        };
        return NextResponse.json(response, { status: 400 });
      }
      updateData.compoundMasterId = master._id;

      // Also update compoundName if not explicitly provided
      if (body.compoundName === undefined) {
        updateData.compoundName = master.compoundName;
      }
    }

    if (body.compoundName !== undefined) {
      updateData.compoundName = body.compoundName;
    }

    // Date should not be updated - it represents when the compound was consumed
    // Only validate if explicitly provided (shouldn't happen in normal flow)
    if (body.date !== undefined && body.date !== null && body.date !== '') {
      // Check if date is being changed and if it already exists
      if (body.date !== existingBatch.date) {
        const batchWithSameDate = await CompoundBatch.findOne({
          date: body.date,
          _id: { $ne: id },
        });
        if (batchWithSameDate) {
          const response: ApiResponse = {
            success: false,
            message: `A batch already exists for date ${body.date}`,
          };
          return NextResponse.json(response, { status: 400 });
        }
      }
      updateData.date = body.date;
    }
    // If date is not provided, we don't update it (preserve existing date)

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
      updateData.weightPerBatch = weightPerBatch;
    }

    // Handle inventory reduction if reducedQty is provided
    if (body.reducedQty !== undefined && body.reducedQty !== null && body.reducedQty !== '') {
      const reducedQty = typeof body.reducedQty === 'number' ? body.reducedQty : parseFloat(body.reducedQty);

      if (isNaN(reducedQty) || reducedQty < 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Reduced quantity must be a non-negative number',
        };
        return NextResponse.json(response, { status: 400 });
      }

      if (reducedQty > existingBatch.inventoryRemaining) {
        const response: ApiResponse = {
          success: false,
          message: 'Reduced quantity cannot exceed remaining inventory',
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Calculate new inventory remaining based on formula:
      // actual qty produced - (reduced qty/batch weight) = desired qty level
      const weightPerBatch = body.weightPerBatch !== undefined
        ? (typeof body.weightPerBatch === 'number' ? body.weightPerBatch : parseFloat(body.weightPerBatch))
        : existingBatch.weightPerBatch;

      if (weightPerBatch <= 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Weight per batch must be a positive number',
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Calculate batches to reduce: reducedQty / weightPerBatch
      const batchesToReduce = reducedQty / weightPerBatch;

      // Calculate new desired quantity level based on formula:
      // actual qty produced - (reduced qty/batch weight) = desired qty level
      // Where: actual qty produced = totalInventory
      //        reduced qty/batch weight = reducedQty / weightPerBatch (this gives batches to reduce)
      //        desired qty level = new inventoryRemaining
      // So: totalInventory - (reducedQty / weightPerBatch) = new inventoryRemaining
      // But since (reducedQty / weightPerBatch) is in batches, we need to convert to kg:
      // totalInventory - reducedQty = new inventoryRemaining
      // And auto reduce batches: batches - (reducedQty / weightPerBatch) = new batches

      // Calculate new inventory remaining: reduce from current remaining
      const newInventoryRemaining = existingBatch.inventoryRemaining - reducedQty;

      // Ensure new inventory remaining is not negative
      if (newInventoryRemaining < 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Reduced quantity cannot exceed remaining inventory',
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Auto reduce number of batches
      const newBatches = existingBatch.batches - batchesToReduce;

      if (newBatches < 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Reduced quantity would result in negative number of batches',
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Update batches and recalculate totalInventory
      updateData.batches = Math.max(0, Math.round(newBatches * 100) / 100); // Round to 2 decimal places
      const newTotalInventory = updateData.batches * weightPerBatch;
      updateData.totalInventory = Math.round(newTotalInventory * 100) / 100;

      // Set new inventory remaining and consumed
      // The desired qty level from formula: totalInventory - (reducedQty / weightPerBatch)
      // But we're reducing from remaining, so use the calculated newInventoryRemaining
      updateData.inventoryRemaining = Math.max(0, Math.round(newInventoryRemaining * 100) / 100);
      updateData.consumed = Math.max(0, Math.round((updateData.totalInventory - updateData.inventoryRemaining) * 100) / 100);
    } else {
      // Recalculate totalInventory if batches or weightPerBatch changed (but no reduction)
      if (body.batches !== undefined || body.weightPerBatch !== undefined) {
        const batches = body.batches !== undefined
          ? (typeof body.batches === 'number' ? body.batches : parseFloat(body.batches))
          : existingBatch.batches;
        const weightPerBatch = body.weightPerBatch !== undefined
          ? (typeof body.weightPerBatch === 'number' ? body.weightPerBatch : parseFloat(body.weightPerBatch))
          : existingBatch.weightPerBatch;

        const newTotalInventory = batches * weightPerBatch;
        updateData.totalInventory = newTotalInventory;

        // Adjust inventoryRemaining proportionally if totalInventory changed
        if (existingBatch.totalInventory > 0) {
          const ratio = newTotalInventory / existingBatch.totalInventory;
          updateData.inventoryRemaining = Math.max(0, Math.round(existingBatch.inventoryRemaining * ratio));
          updateData.consumed = newTotalInventory - updateData.inventoryRemaining;
        } else {
          updateData.inventoryRemaining = newTotalInventory;
          updateData.consumed = 0;
        }
      }
    }

    // Update compound batch
    const updatedBatch = await CompoundBatch.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBatch) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound batch not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Compound batch updated successfully',
      data: updatedBatch,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating compound batch:', error);

    // Handle duplicate key errors (MongoDB duplicate key error)
    // This should not occur if date is not being updated, but handle it gracefully
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'A batch with this date already exists. Date cannot be changed as it represents when the compound was consumed.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update compound batch',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export const PUT = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_BATCH_UPDATE, updateCompoundBatchHandler);
