import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';

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
      updateData.weightPerBatch = weightPerBatch;
    }

    // Recalculate totalInventory if batches or weightPerBatch changed
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
  }
}

export const PUT = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_BATCH_UPDATE, updateCompoundBatchHandler);
