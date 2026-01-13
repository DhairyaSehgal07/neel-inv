import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import { createBeltRequestSchema } from '@/schemas/create-belt-schema';
import Belt from '@/model/Belt';
import { BeltFormData } from '@/types/belt';
import { createManualBelt } from '@/lib/services/belt-service';

export async function createManualBeltHandler(req: Request) {
  let session: mongoose.ClientSession | undefined;
  try {
    await dbConnect();

    const body = await req.json();

    // Validate incoming data
    const parsed = createBeltRequestSchema.safeParse(body);
    if (!parsed.success) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        data: parsed.error.flatten(),
      };
      return NextResponse.json(response, { status: 400 });
    }
    const formData: BeltFormData = body.formData;

    // Validate required fields
    if (!formData.beltNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Belt number is required',
        },
        { status: 400 }
      );
    }

    // Check if belt number already exists
    const existingBelt = await Belt.findOne({ beltNumber: formData.beltNumber });
    if (existingBelt) {
      return NextResponse.json(
        {
          success: false,
          message: 'Belt number already exists',
        },
        { status: 400 }
      );
    }

    // Validate compound consumption values
    const coverConsumedKg =
      typeof formData.coverCompoundConsumed === 'number'
        ? formData.coverCompoundConsumed
        : typeof formData.coverCompoundConsumed === 'string'
          ? parseFloat(formData.coverCompoundConsumed)
          : 0;

    const skimConsumedKg =
      typeof formData.skimCompoundConsumed === 'number'
        ? formData.skimCompoundConsumed
        : typeof formData.skimCompoundConsumed === 'string'
          ? parseFloat(formData.skimCompoundConsumed)
          : 0;

    // At least one compound must be provided
    if (coverConsumedKg <= 0 && skimConsumedKg <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide at least one compound (cover or skim)',
        },
        { status: 400 }
      );
    }

    // Validate cover compound batches if cover is provided
    if (coverConsumedKg > 0) {
      if (!body.coverBatches || !Array.isArray(body.coverBatches) || body.coverBatches.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'At least one cover compound batch is required',
          },
          { status: 400 }
        );
      }

      // Validate batch structure
      for (const batch of body.coverBatches) {
        if (!batch.batchId || typeof batch.consumedKg !== 'number' || batch.consumedKg <= 0) {
          return NextResponse.json(
            {
              success: false,
              message: 'Invalid cover batch data. Each batch must have batchId and consumedKg > 0',
            },
            { status: 400 }
          );
        }
      }
    } else {
      // If cover is not provided, ensure cover batches are empty
      if (body.coverBatches && Array.isArray(body.coverBatches) && body.coverBatches.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Cover batches should not be provided when cover compound consumed is 0',
          },
          { status: 400 }
        );
      }
    }

    // Validate skim compound batches if skim is provided
    if (skimConsumedKg > 0) {
      if (!body.skimBatches || !Array.isArray(body.skimBatches) || body.skimBatches.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'At least one skim compound batch is required',
          },
          { status: 400 }
        );
      }

      // Validate batch structure
      for (const batch of body.skimBatches) {
        if (!batch.batchId || typeof batch.consumedKg !== 'number' || batch.consumedKg <= 0) {
          return NextResponse.json(
            {
              success: false,
              message: 'Invalid skim batch data. Each batch must have batchId and consumedKg > 0',
            },
            { status: 400 }
          );
        }
      }
    } else {
      // If skim is not provided, ensure skim batches are empty
      if (body.skimBatches && Array.isArray(body.skimBatches) && body.skimBatches.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Skim batches should not be provided when skim compound consumed is 0',
          },
          { status: 400 }
        );
      }
    }

    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Create belt with selected batches
    await createManualBelt(
      {
        formData,
        coverBatches: body.coverBatches,
        skimBatches: body.skimBatches,
      },
      session
    );

    // Commit transaction
    await session.commitTransaction();

    return NextResponse.json(
      {
        success: true,
        message: 'Belt created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating manual belt:', error);

    // Rollback transaction on error
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    // Handle specific error messages
    if (error instanceof Error) {
      // Check if it's an inventory error
      if (error.message.includes('Not enough inventory') || error.message.includes('not enough inventory')) {
        const response: ApiResponse = {
          success: false,
          message: 'Not enough inventory',
          error: error.message,
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Handle duplicate key errors (MongoDB duplicate key error)
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        const response: ApiResponse = {
          success: false,
          message: 'Belt with this code already exists',
        };
        return NextResponse.json(response, { status: 400 });
      }

      const response: ApiResponse = {
        success: false,
        message: error.message || 'Failed to create belt',
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ApiResponse = {
      success: false,
      message: 'Failed to create belt',
    };
    return NextResponse.json(response, { status: 500 });
  } finally {
    // End session
    if (session) {
      await session.endSession();
    }
  }
}

export const POST = (request: NextRequest) =>
  withRBAC(request, Permission.BELT_CREATE, createManualBeltHandler);
