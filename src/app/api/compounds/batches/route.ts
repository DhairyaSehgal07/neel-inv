import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';
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

export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_BATCH_VIEW, getCompoundBatches);
