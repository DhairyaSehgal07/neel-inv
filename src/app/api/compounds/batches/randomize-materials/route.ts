import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';
// Required so Mongoose can resolve .populate('compoundMasterId')
import CompoundMaster from '@/model/CompoundMaster';
void CompoundMaster;
import { resolveMaterialsUsed } from '@/lib/helpers/compound-utils';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

const BATCH_CONCURRENCY = 10;

/**
 * POST /api/compounds/batches/randomize-materials
 *
 * Re-resolves and randomizes material codes for existing compound batches.
 * Uses a single 4-month window before producedOn (coverCompoundProducedOn or skimCompoundProducedOn).
 * Processes batches in parallel (concurrency limit) for speed.
 *
 * Body (optional):
 *   - batchIds: string[] — if provided, only these batch IDs are updated; otherwise all batches.
 *
 * Returns: { success, data: { updatedCount }, message }
 */
async function randomizeMaterialsHandler(request: NextRequest) {
  try {
    await dbConnect();

    let batchIds: mongoose.Types.ObjectId[] | undefined;
    try {
      const body = await request.json().catch(() => ({}));
      const ids = body?.batchIds;
      if (ids != null) {
        if (!Array.isArray(ids)) {
          const response: ApiResponse = {
            success: false,
            message: 'batchIds must be an array of batch IDs',
          };
          return NextResponse.json(response, { status: 400 });
        }
        batchIds = ids
          .filter((id: unknown) => typeof id === 'string' && id)
          .map((id: string) => new mongoose.Types.ObjectId(id));
        if (batchIds.length === 0) {
          const response: ApiResponse = {
            success: true,
            data: { updatedCount: 0 },
            message: 'No valid batch IDs provided',
          };
          return NextResponse.json(response, { status: 200 });
        }
      }
    } catch {
      // No body or invalid JSON: treat as "update all"
    }

    const query = batchIds?.length
      ? { _id: { $in: batchIds } }
      : {};

    const batches = await CompoundBatch.find(query)
      .populate('compoundMasterId', 'rawMaterials')
      .select('_id compoundCode coverCompoundProducedOn skimCompoundProducedOn date compoundMasterId')
      .lean();

    const toUpdate: typeof batches = [];
    for (const batch of batches) {
      const master = batch.compoundMasterId as { _id: mongoose.Types.ObjectId; rawMaterials?: string[] } | null;
      const rawMaterials = master?.rawMaterials;
      if (!rawMaterials || rawMaterials.length === 0) continue;

      const productionDate =
        (batch.coverCompoundProducedOn as string | undefined) ||
        (batch.skimCompoundProducedOn as string | undefined) ||
        (batch.date as string) ||
        '';
      if (!productionDate) continue;

      toUpdate.push(batch);
    }

    let updatedCount = 0;

    for (let i = 0; i < toUpdate.length; i += BATCH_CONCURRENCY) {
      const chunk = toUpdate.slice(i, i + BATCH_CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (batch) => {
          const master = batch.compoundMasterId as { rawMaterials?: string[] };
          const productionDate =
            (batch.coverCompoundProducedOn as string | undefined) ||
            (batch.skimCompoundProducedOn as string | undefined) ||
            (batch.date as string) ||
            '';
          const materialsUsed = await resolveMaterialsUsed(master.rawMaterials!, productionDate);
          await CompoundBatch.updateOne(
            { _id: batch._id },
            { $set: { materialsUsed } }
          );
          return 1;
        })
      );
      updatedCount += results.length;
    }

    const response: ApiResponse = {
      success: true,
      data: { updatedCount },
      message:
        updatedCount === 0
          ? 'No compound batches were updated (none had production date and raw materials)'
          : `Randomized material codes for ${updatedCount} compound batch(es)`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error randomizing compound batch materials:', error);
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to randomize material codes',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export const POST = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_BATCH_UPDATE, randomizeMaterialsHandler);
