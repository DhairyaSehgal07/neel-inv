import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import dbConnect from '@/lib/dbConnect';
import Belt from '@/model/Belt';
import CompoundBatch from '@/model/CompoundBatch';

/**
 * Populates batchId with compoundCode, compoundName, and type
 */
async function populateBatchData(
  batchesUsed?: Array<{ batchId: mongoose.Types.ObjectId | string; consumedKg: number }>
): Promise<
  Array<{
    batchId: string;
    consumedKg: number;
    compoundCode?: string;
    compoundName?: string;
    type?: 'cover' | 'skim';
  }>
> {
  if (!batchesUsed || batchesUsed.length === 0) {
    return [];
  }

  // Collect all batch IDs and convert to ObjectId if needed
  const batchIds = batchesUsed.map((batch) => {
    if (typeof batch.batchId === 'string') {
      return new mongoose.Types.ObjectId(batch.batchId);
    }
    return batch.batchId;
  });

  // Fetch all compound batches
  const compoundBatches = await CompoundBatch.find({
    _id: { $in: batchIds },
  }).lean();

  // Create a map for quick lookup
  const batchMap = new Map<
    string,
    {
      compoundCode: string;
      compoundName: string;
      coverCompoundProducedOn?: string;
      skimCompoundProducedOn?: string;
    }
  >();

  compoundBatches.forEach((batch) => {
    if (batch._id && batch.compoundCode) {
      const batchIdStr = typeof batch._id === 'string' ? batch._id : batch._id.toString();
      batchMap.set(batchIdStr, {
        compoundCode: batch.compoundCode,
        compoundName: batch.compoundName || '',
        coverCompoundProducedOn: batch.coverCompoundProducedOn,
        skimCompoundProducedOn: batch.skimCompoundProducedOn,
      });
    }
  });

  // Enrich the batch data with compoundCode, compoundName, and type
  return batchesUsed.map((batch) => {
    const batchIdStr =
      typeof batch.batchId === 'string' ? batch.batchId : batch.batchId.toString();
    const compoundBatch = batchMap.get(batchIdStr);

    // Determine type based on coverCompoundProducedOn or skimCompoundProducedOn
    let type: 'cover' | 'skim' | undefined;
    if (compoundBatch?.coverCompoundProducedOn) {
      type = 'cover';
    } else if (compoundBatch?.skimCompoundProducedOn) {
      type = 'skim';
    }

    return {
      batchId: batchIdStr,
      consumedKg: batch.consumedKg,
      compoundCode: compoundBatch?.compoundCode,
      compoundName: compoundBatch?.compoundName,
      type,
    };
  });
}

async function getPopulatedBelts(request: NextRequest) {
  try {
    await dbConnect();

    // Get all belts
    const belts = await Belt.find({}).sort({ createdAt: -1 }).lean();

    // Populate batch data for all belts
    const populatedBelts = await Promise.all(
      belts.map(async (belt) => {
        const coverBatchesUsed = await populateBatchData(belt.coverBatchesUsed);
        const skimBatchesUsed = await populateBatchData(belt.skimBatchesUsed);

        return {
          ...belt,
          coverBatchesUsed,
          skimBatchesUsed,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: populatedBelts,
        count: populatedBelts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching populated belts:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch populated belts';
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch populated belts',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.BELT_VIEW, getPopulatedBelts);
