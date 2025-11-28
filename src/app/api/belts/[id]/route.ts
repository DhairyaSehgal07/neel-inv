import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import { updateBeltRequestSchema } from '@/schemas/create-belt-schema';
import Belt from '@/model/Belt';
import { BeltFormData } from '@/types/belt';
import { formatLocalDate } from '@/lib/helpers/compound-utils';
import Fabric from '@/model/Fabric';
import CompoundBatch from '@/model/CompoundBatch';
import CompoundHistory from '@/model/CompoundHistory';
import BeltHistory from '@/model/BeltHistory';

/**
 * Update belt handler
 */
async function updateBeltHandler(
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
        message: 'Invalid belt ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body = await request.json();

    // Validate incoming data
    const parsed = updateBeltRequestSchema.safeParse(body);
    if (!parsed.success) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        data: parsed.error.flatten(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const formData: Partial<BeltFormData> = body.formData || {};

    // Check if belt exists
    const existingBelt = await Belt.findById(id);
    if (!existingBelt) {
      const response: ApiResponse = {
        success: false,
        message: 'Belt not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if belt number is being changed and if it already exists
    if (formData.beltNumber && formData.beltNumber !== existingBelt.beltNumber) {
      const beltWithSameNumber = await Belt.findOne({
        beltNumber: formData.beltNumber,
        _id: { $ne: id },
      });
      if (beltWithSameNumber) {
        const response: ApiResponse = {
          success: false,
          message: 'Belt number already exists',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Helper function to parse number from string or number
    const parseNumber = (value: number | string | undefined): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };

    // Handle fabric update if fabric data is provided
    let fabricId = existingBelt.fabricId;
    if (formData.fabricType || formData.rollNumber) {
      const fabricConsumedMeters =
        typeof formData.fabricConsumed === 'number'
          ? formData.fabricConsumed
          : typeof formData.fabricConsumed === 'string'
            ? parseFloat(formData.fabricConsumed)
            : undefined;

      // Try to find existing fabric by rollNumber if provided
      if (formData.rollNumber) {
        const existingFabric = await Fabric.findOne({ rollNumber: formData.rollNumber }).session(session);
        if (existingFabric) {
          // Update consumed meters if provided
          if (fabricConsumedMeters !== undefined && !isNaN(fabricConsumedMeters)) {
            await Fabric.findByIdAndUpdate(
              existingFabric._id,
              { $inc: { consumedMeters: fabricConsumedMeters } },
              { new: true, session }
            );
          }
          fabricId = existingFabric._id as mongoose.Types.ObjectId;
        } else {
          // Create new fabric
          const fabricPayload = {
            type: formData.fabricType as 'EP' | 'NN' | 'EE' | 'Other',
            rating: formData.rating,
            strength: typeof formData.beltStrength === 'number' ? formData.beltStrength : undefined,
            supplier: formData.fabricSupplier,
            rollNumber: formData.rollNumber,
            consumedMeters: fabricConsumedMeters !== undefined && !isNaN(fabricConsumedMeters) ? fabricConsumedMeters : 0,
          };
          const created = await Fabric.create([fabricPayload], { session });
          fabricId = created[0]._id as mongoose.Types.ObjectId;
        }
      } else if (formData.fabricType) {
        // Create new fabric without rollNumber
        const fabricPayload = {
          type: formData.fabricType as 'EP' | 'NN' | 'EE' | 'Other',
          rating: formData.rating,
          strength: typeof formData.beltStrength === 'number' ? formData.beltStrength : undefined,
          supplier: formData.fabricSupplier,
          consumedMeters: fabricConsumedMeters !== undefined && !isNaN(fabricConsumedMeters) ? fabricConsumedMeters : 0,
        };
        const created = await Fabric.create([fabricPayload], { session });
        fabricId = created[0]._id as mongoose.Types.ObjectId;
      }
    }

    // Prepare update data
    const updateData: Partial<typeof existingBelt> = {};

    if (formData.beltNumber !== undefined) updateData.beltNumber = formData.beltNumber;
    if (formData.rating !== undefined) updateData.rating = formData.rating;
    if (fabricId !== undefined) updateData.fabricId = fabricId;
    if (formData.topCover !== undefined) updateData.topCoverMm = parseNumber(formData.topCover);
    if (formData.bottomCover !== undefined) updateData.bottomCoverMm = parseNumber(formData.bottomCover);
    if (formData.beltLength !== undefined) updateData.beltLengthM = parseNumber(formData.beltLength);
    if (formData.beltWidth !== undefined) updateData.beltWidthMm = parseNumber(formData.beltWidth);
    if (formData.edge !== undefined) updateData.edge = formData.edge as 'Cut' | 'Moulded';
    if (formData.breakerPly !== undefined) updateData.breakerPly = formData.breakerPly;
    if (formData.breakerPlyRemarks !== undefined) updateData.breakerPlyRemarks = formData.breakerPlyRemarks;
    if (formData.carcass !== undefined) updateData.carcassMm = parseNumber(formData.carcass);
    if (formData.coverGrade !== undefined) updateData.coverGrade = formData.coverGrade;
    if (formData.orderNumber !== undefined) updateData.orderNumber = formData.orderNumber;
    if (formData.buyerName !== undefined) updateData.buyerName = formData.buyerName;
    if (formData.orderDate !== undefined) {
      updateData.orderDate = formData.orderDate
        ? formatLocalDate(formData.orderDate instanceof Date ? formData.orderDate : new Date(formData.orderDate))
        : undefined;
    }
    if (formData.deliveryDeadline !== undefined) {
      updateData.deliveryDeadline = formData.deliveryDeadline
        ? formatLocalDate(formData.deliveryDeadline instanceof Date ? formData.deliveryDeadline : new Date(formData.deliveryDeadline))
        : undefined;
    }
    if (formData.status !== undefined) {
      updateData.status = formData.status as 'Dispatched' | 'In Production';
    }

    // Update process dates
    if (
      formData.calendaringDate !== undefined ||
      formData.calendaringStation !== undefined ||
      formData.greenBeltDate !== undefined ||
      formData.greenBeltStation !== undefined ||
      formData.curingDate !== undefined ||
      formData.pressStation !== undefined ||
      formData.inspectionDate !== undefined ||
      formData.inspectionStation !== undefined ||
      formData.pdiDate !== undefined ||
      formData.packagingDate !== undefined ||
      formData.dispatchDate !== undefined ||
      formData.coverCompoundProducedOn !== undefined ||
      formData.skimCompoundProducedOn !== undefined
    ) {
      updateData.process = {
        ...existingBelt.process,
        ...(formData.calendaringDate !== undefined && {
          calendaringDate: formData.calendaringDate
            ? formatLocalDate(formData.calendaringDate instanceof Date ? formData.calendaringDate : new Date(formData.calendaringDate))
            : undefined,
        }),
        ...(formData.calendaringStation !== undefined && { calendaringMachine: formData.calendaringStation }),
        ...(formData.greenBeltDate !== undefined && {
          greenBeltDate: formData.greenBeltDate
            ? formatLocalDate(formData.greenBeltDate instanceof Date ? formData.greenBeltDate : new Date(formData.greenBeltDate))
            : undefined,
        }),
        ...(formData.greenBeltStation !== undefined && { greenBeltMachine: formData.greenBeltStation }),
        ...(formData.curingDate !== undefined && {
          curingDate: formData.curingDate
            ? formatLocalDate(formData.curingDate instanceof Date ? formData.curingDate : new Date(formData.curingDate))
            : undefined,
        }),
        ...(formData.pressStation !== undefined && { curingMachine: formData.pressStation }),
        ...(formData.inspectionDate !== undefined && {
          inspectionDate: formData.inspectionDate
            ? formatLocalDate(formData.inspectionDate instanceof Date ? formData.inspectionDate : new Date(formData.inspectionDate))
            : undefined,
        }),
        ...(formData.inspectionStation !== undefined && { inspectionMachine: formData.inspectionStation }),
        ...(formData.pdiDate !== undefined && {
          pidDate: formData.pdiDate
            ? formatLocalDate(formData.pdiDate instanceof Date ? formData.pdiDate : new Date(formData.pdiDate))
            : undefined,
        }),
        ...(formData.packagingDate !== undefined && {
          packagingDate: formData.packagingDate
            ? formatLocalDate(formData.packagingDate instanceof Date ? formData.packagingDate : new Date(formData.packagingDate))
            : undefined,
        }),
        ...(formData.dispatchDate !== undefined && {
          dispatchDate: formData.dispatchDate
            ? formatLocalDate(formData.dispatchDate instanceof Date ? formData.dispatchDate : new Date(formData.dispatchDate))
            : undefined,
        }),
        ...(formData.coverCompoundProducedOn !== undefined && {
          coverCompoundProducedOn: formData.coverCompoundProducedOn
            ? formatLocalDate(formData.coverCompoundProducedOn instanceof Date ? formData.coverCompoundProducedOn : new Date(formData.coverCompoundProducedOn))
            : undefined,
        }),
        ...(formData.skimCompoundProducedOn !== undefined && {
          skimCompoundProducedOn: formData.skimCompoundProducedOn
            ? formatLocalDate(formData.skimCompoundProducedOn instanceof Date ? formData.skimCompoundProducedOn : new Date(formData.skimCompoundProducedOn))
            : undefined,
        }),
      };
    }

    // Update belt
    const updatedBelt = await Belt.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true, session });

    if (!updatedBelt) {
      const response: ApiResponse = {
        success: false,
        message: 'Belt not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Handle date updates in related models
    const coverProducedOnDate = formData.coverCompoundProducedOn !== undefined
      ? (formData.coverCompoundProducedOn
          ? formatLocalDate(formData.coverCompoundProducedOn instanceof Date ? formData.coverCompoundProducedOn : new Date(formData.coverCompoundProducedOn))
          : undefined)
      : undefined;

    const skimProducedOnDate = formData.skimCompoundProducedOn !== undefined
      ? (formData.skimCompoundProducedOn
          ? formatLocalDate(formData.skimCompoundProducedOn instanceof Date ? formData.skimCompoundProducedOn : new Date(formData.skimCompoundProducedOn))
          : undefined)
      : undefined;

    // Update CompoundBatch and CompoundHistory if dates are being updated
    if (coverProducedOnDate !== undefined || skimProducedOnDate !== undefined) {
      // Collect batch IDs separately for cover and skim batches
      const coverBatchIds: mongoose.Types.ObjectId[] = [];
      const skimBatchIds: mongoose.Types.ObjectId[] = [];

      if (coverProducedOnDate !== undefined && updatedBelt.coverBatchesUsed && updatedBelt.coverBatchesUsed.length > 0) {
        updatedBelt.coverBatchesUsed.forEach((batch) => {
          if (batch.batchId) {
            coverBatchIds.push(batch.batchId as mongoose.Types.ObjectId);
          }
        });
      }

      if (skimProducedOnDate !== undefined && updatedBelt.skimBatchesUsed && updatedBelt.skimBatchesUsed.length > 0) {
        updatedBelt.skimBatchesUsed.forEach((batch) => {
          if (batch.batchId) {
            skimBatchIds.push(batch.batchId as mongoose.Types.ObjectId);
          }
        });
      }

      // Update cover batches if coverCompoundProducedOn is being updated
      if (coverProducedOnDate !== undefined && coverBatchIds.length > 0) {
        const coverBatchUpdate = {
          $set: {
            coverCompoundProducedOn: coverProducedOnDate,
          },
        };

        // Update CompoundBatch records
        await CompoundBatch.updateMany(
          { _id: { $in: coverBatchIds } },
          coverBatchUpdate,
          { session }
        );

        // Update CompoundHistory records for these batches
        await CompoundHistory.updateMany(
          { batchId: { $in: coverBatchIds } },
          coverBatchUpdate,
          { session }
        );
      }

      // Update skim batches if skimCompoundProducedOn is being updated
      if (skimProducedOnDate !== undefined && skimBatchIds.length > 0) {
        const skimBatchUpdate = {
          $set: {
            skimCompoundProducedOn: skimProducedOnDate,
          },
        };

        // Update CompoundBatch records
        await CompoundBatch.updateMany(
          { _id: { $in: skimBatchIds } },
          skimBatchUpdate,
          { session }
        );

        // Update CompoundHistory records for these batches
        await CompoundHistory.updateMany(
          { batchId: { $in: skimBatchIds } },
          skimBatchUpdate,
          { session }
        );
      }

      // Update BatchUsage arrays in the belt if dates are provided
      if (coverProducedOnDate !== undefined && updatedBelt.coverBatchesUsed) {
        updatedBelt.coverBatchesUsed = updatedBelt.coverBatchesUsed.map((batch) => ({
          ...batch,
          coverCompoundProducedOn: coverProducedOnDate,
        }));
      }

      if (skimProducedOnDate !== undefined && updatedBelt.skimBatchesUsed) {
        updatedBelt.skimBatchesUsed = updatedBelt.skimBatchesUsed.map((batch) => ({
          ...batch,
          skimCompoundProducedOn: skimProducedOnDate,
        }));
      }

      // Update the belt with the modified BatchUsage arrays
      if (coverProducedOnDate !== undefined || skimProducedOnDate !== undefined) {
        const batchUsageUpdate: {
          coverBatchesUsed?: typeof updatedBelt.coverBatchesUsed;
          skimBatchesUsed?: typeof updatedBelt.skimBatchesUsed;
        } = {};

        if (coverProducedOnDate !== undefined && updatedBelt.coverBatchesUsed) {
          batchUsageUpdate.coverBatchesUsed = updatedBelt.coverBatchesUsed;
        }

        if (skimProducedOnDate !== undefined && updatedBelt.skimBatchesUsed) {
          batchUsageUpdate.skimBatchesUsed = updatedBelt.skimBatchesUsed;
        }

        if (Object.keys(batchUsageUpdate).length > 0) {
          const beltAfterBatchUpdate = await Belt.findByIdAndUpdate(
            id,
            { $set: batchUsageUpdate },
            { new: true, session }
          );

          // Update the reference to use the latest belt data
          if (beltAfterBatchUpdate) {
            updatedBelt.coverBatchesUsed = beltAfterBatchUpdate.coverBatchesUsed;
            updatedBelt.skimBatchesUsed = beltAfterBatchUpdate.skimBatchesUsed;
          }
        }
      }
    }

    // Refetch the belt to get the latest data including any BatchUsage updates
    const finalBelt = await Belt.findById(id).session(session);

    // Create BeltHistory snapshot for this update
    if (finalBelt) {
      const historyData = {
        beltId: finalBelt._id,
        beltNumber: finalBelt.beltNumber,
        rating: finalBelt.rating,
        fabricId: finalBelt.fabricId,
        coverBatchesUsed: finalBelt.coverBatchesUsed || [],
        skimBatchesUsed: finalBelt.skimBatchesUsed || [],
      };

      await BeltHistory.create([historyData], { session });
    }

    // Commit transaction
    await session.commitTransaction();

    const response: ApiResponse = {
      success: true,
      message: 'Belt updated successfully',
      data: finalBelt || updatedBelt,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating belt:', error);

    // Rollback transaction on error
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    // Handle duplicate key errors (MongoDB duplicate key error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'Belt with this number already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update belt',
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
) => withRBACParams(request, context.params, Permission.BELT_UPDATE, updateBeltHandler);
