import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';
import CompoundMaster from '@/model/CompoundMaster';
import CompoundHistory from '@/model/CompoundHistory';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

async function getCompoundBatches(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const compoundCode = searchParams.get('compoundCode');
    const date = searchParams.get('date');

    const query: {
      compoundCode?: string;
      date?: string;
    } = {};

    if (compoundCode) query.compoundCode = compoundCode;
    if (date) query.date = date;

    // Default sorting: newest first
    // Use lean() for better performance and select only needed fields
    // Populate compoundMasterId with rawMaterials from CompoundMaster
    // materialsUsed is already included in the CompoundBatch document by default
    const batches = await CompoundBatch.find(query)
      .populate('compoundMasterId', 'rawMaterials')
      .select('compoundCode compoundName date batches weightPerBatch totalInventory inventoryRemaining consumed materialsUsed compoundMasterId coverCompoundProducedOn skimCompoundProducedOn createdAt updatedAt')
      .lean()
      .sort({ date: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Compound batches fetched successfully',
      data: batches,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching compound batches:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch compound batches',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

async function createCompoundBatch(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      compoundCode,
      compoundName,
      batches,
      weightPerBatch,
      coverCompoundProducedOn,
      skimCompoundProducedOn,
    } = body;

    // Validate required fields
    if (!compoundCode || !batches || !weightPerBatch) {
      const response: ApiResponse = {
        success: false,
        message: 'compoundCode, batches, and weightPerBatch are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Date represents when the compound was consumed
    // When creating a new batch, the compound is just produced and not consumed yet
    // So we set date to empty string - it will be set when the compound is actually consumed
    const date: string = '';

    // Validate numeric fields
    const batchesNum = Number(batches);
    const weightPerBatchNum = Number(weightPerBatch);

    if (isNaN(batchesNum) || batchesNum <= 0) {
      const response: ApiResponse = {
        success: false,
        message: 'batches must be a positive number',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (isNaN(weightPerBatchNum) || weightPerBatchNum <= 0) {
      const response: ApiResponse = {
        success: false,
        message: 'weightPerBatch must be a positive number',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate production dates if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (coverCompoundProducedOn && !dateRegex.test(coverCompoundProducedOn)) {
      const response: ApiResponse = {
        success: false,
        message: 'coverCompoundProducedOn must be in YYYY-MM-DD format',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (skimCompoundProducedOn && !dateRegex.test(skimCompoundProducedOn)) {
      const response: ApiResponse = {
        success: false,
        message: 'skimCompoundProducedOn must be in YYYY-MM-DD format',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if production dates conflict
    if (coverCompoundProducedOn) {
      const conflict = await CompoundBatch.findOne({
        skimCompoundProducedOn: coverCompoundProducedOn,
      });
      if (conflict) {
        const response: ApiResponse = {
          success: false,
          message: `Date ${coverCompoundProducedOn} already used in skimCompoundProducedOn`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    if (skimCompoundProducedOn) {
      const conflict = await CompoundBatch.findOne({
        coverCompoundProducedOn: skimCompoundProducedOn,
      });
      if (conflict) {
        const response: ApiResponse = {
          success: false,
          message: `Date ${skimCompoundProducedOn} already used in coverCompoundProducedOn`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Find compound master by compoundCode
    const master = await CompoundMaster.findOne({ compoundCode });
    if (!master) {
      const response: ApiResponse = {
        success: false,
        message: `CompoundMaster not found for code: ${compoundCode}`,
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Calculate total inventory
    const totalInventory = batchesNum * weightPerBatchNum;

    // Create batch
    const batchData = {
      compoundCode,
      compoundName: compoundName || master.compoundName,
      date,
      batches: batchesNum,
      weightPerBatch: weightPerBatchNum,
      totalInventory,
      inventoryRemaining: totalInventory,
      consumed: 0,
      compoundMasterId: master._id,
      ...(coverCompoundProducedOn && { coverCompoundProducedOn }),
      ...(skimCompoundProducedOn && { skimCompoundProducedOn }),
    };

    const created = await CompoundBatch.create([batchData]);
    const batch = created[0];

    // Create CompoundHistory snapshot
    const historyData = {
      batchId: batch._id,
      compoundCode,
      compoundName: batch.compoundName,
      // Only include date if it's not empty, otherwise let default handle it
      ...(date && date.length > 0 ? { date } : {}),
      batches: batchesNum,
      weightPerBatch: weightPerBatchNum,
      totalInventory,
      closingBalance: totalInventory, // At creation, closingBalance = totalInventory
      coverCompoundProducedOn: batch.coverCompoundProducedOn,
      skimCompoundProducedOn: batch.skimCompoundProducedOn,
    };

    await CompoundHistory.create([historyData]);

    const response: ApiResponse = {
      success: true,
      message: 'Compound batch created successfully',
      data: batch,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating compound batch:', error);

    // Handle duplicate key errors (MongoDB duplicate key error)
    // This can happen if there's a race condition or unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'A batch with this date or production date already exists. Please try again.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Handle validation errors (e.g., from CompoundHistory)
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      const validationError = error as { errors?: Record<string, { message?: string }>; message?: string };
      const errorMessages = validationError.errors
        ? Object.values(validationError.errors)
            .map((err) => err.message)
            .filter(Boolean)
            .join(', ')
        : validationError.message || 'Validation failed';

      const response: ApiResponse = {
        success: false,
        message: errorMessages,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create compound batch',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_BATCH_VIEW, getCompoundBatches);

export const POST = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_BATCH_CREATE, createCompoundBatch);
