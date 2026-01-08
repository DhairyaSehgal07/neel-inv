import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAvailableCompounds(_request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all compound batches where inventoryRemaining > 0
    const batches = await CompoundBatch.find({
      inventoryRemaining: { $gt: 0 },
    })
      .populate('compoundMasterId', 'rawMaterials')
      .sort({ date: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Available compounds fetched successfully',
      data: batches,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching available compounds:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch available compounds',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_BATCH_VIEW, getAvailableCompounds);
