import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';
import CompoundMaster from '@/model/CompoundMaster';
import Belt from '@/model/Belt';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

interface MaterialUsed {
  materialName: string;
  materialCode: string;
}

interface CompoundMasterReportData {
  compoundCode: string;
  compoundName: string;
  producedOn: string | null;
  consumedOn: string | null;
  numberOfBatches: number;
  weightPerBatch: number;
  totalInventory: number;
  remaining: number;
  beltNumbers: string[];
  rawMaterials: string[];
  materialsUsed: MaterialUsed[];
}

async function getCompoundMasterReport() {
  try {
    await dbConnect();

    // Get all compound batches sorted by producedOn date (or date if no producedOn)
    const compoundBatches = await CompoundBatch.find()
      .sort({ coverCompoundProducedOn: 1, skimCompoundProducedOn: 1, date: 1 })
      .lean();

    // Get all compound masters to map rawMaterials
    const compoundMasters = await CompoundMaster.find({}).lean();
    const masterIdToRawMaterials = new Map<string, string[]>();
    compoundMasters.forEach((master) => {
      const masterIdStr = master._id?.toString() || '';
      masterIdToRawMaterials.set(masterIdStr, master.rawMaterials || []);
    });

    // Get all belts to find which ones used which batches
    const belts = await Belt.find({}).lean();

    // Create a map of batch ID to belt numbers
    const batchIdToBelts = new Map<string, Set<string>>();

    // Process all belts to find which batches they used
    belts.forEach((belt) => {
      // Check cover batches
      if (belt.coverBatchesUsed && belt.coverBatchesUsed.length > 0) {
        belt.coverBatchesUsed.forEach((batchUsage) => {
          const batchIdStr = batchUsage.batchId?.toString();
          if (batchIdStr) {
            if (!batchIdToBelts.has(batchIdStr)) {
              batchIdToBelts.set(batchIdStr, new Set());
            }
            batchIdToBelts.get(batchIdStr)!.add(belt.beltNumber);
          }
        });
      }

      // Check skim batches
      if (belt.skimBatchesUsed && belt.skimBatchesUsed.length > 0) {
        belt.skimBatchesUsed.forEach((batchUsage) => {
          const batchIdStr = batchUsage.batchId?.toString();
          if (batchIdStr) {
            if (!batchIdToBelts.has(batchIdStr)) {
              batchIdToBelts.set(batchIdStr, new Set());
            }
            batchIdToBelts.get(batchIdStr)!.add(belt.beltNumber);
          }
        });
      }
    });

    // Create report data - one row per batch
    const reportData: CompoundMasterReportData[] = compoundBatches.map((batch) => {
      const batchIdStr = batch._id?.toString() || '';
      const beltNumbersForBatch = batchIdToBelts.get(batchIdStr) || new Set<string>();

      // Extract rawMaterials from compoundMasterId using the map
      const compoundMasterIdStr = batch.compoundMasterId?.toString() || '';
      const rawMaterials = masterIdToRawMaterials.get(compoundMasterIdStr) || [];

      // Extract materialsUsed from batch (includes material codes)
      const materialsUsed = (batch.materialsUsed || []) as MaterialUsed[];

      return {
        compoundCode: batch.compoundCode,
        compoundName: batch.compoundName || '',
        producedOn: batch.coverCompoundProducedOn || batch.skimCompoundProducedOn || null,
        consumedOn: batch.date || null,
        numberOfBatches: batch.batches || 0,
        weightPerBatch: batch.weightPerBatch || 0,
        totalInventory: batch.totalInventory || 0,
        remaining: batch.inventoryRemaining || 0,
        beltNumbers: Array.from(beltNumbersForBatch).sort(),
        rawMaterials,
        materialsUsed,
      };
    });

    const response: ApiResponse<CompoundMasterReportData[]> = {
      success: true,
      message: 'Compound master report fetched successfully',
      data: reportData,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching compound master report:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch compound master report',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_MASTER_VIEW, () => getCompoundMasterReport());
