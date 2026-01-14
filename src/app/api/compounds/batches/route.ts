import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';
import CompoundMaster from '@/model/CompoundMaster';
import CompoundHistory from '@/model/CompoundHistory';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { addDaysToDate } from '@/lib/helpers/compound-utils';

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
    // Populate compoundMasterId with rawMaterials from CompoundMaster
    // materialsUsed is already included in the CompoundBatch document by default
    const batches = await CompoundBatch.find(query)
      .populate('compoundMasterId', 'rawMaterials')
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

    // Find the next available date (starting from today)
    // Date represents when the compound was consumed (created)
    // Since date must be unique, we find the next available date
    const today = new Date();
    let candidateDate = today.toISOString().split('T')[0];
    let attempts = 0;
    const maxAttempts = 365; // Prevent infinite loop

    while (attempts < maxAttempts) {
      const existingBatch = await CompoundBatch.findOne({ date: candidateDate });
      if (!existingBatch) {
        break; // Found an available date
      }
      candidateDate = addDaysToDate(candidateDate, 1);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      const response: ApiResponse = {
        success: false,
        message: 'Could not find an available date within reasonable range',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const date = candidateDate;

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
      date,
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
