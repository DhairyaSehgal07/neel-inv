import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import RawMaterial from '@/model/RawMaterial';

/**
 * GET /api/raw-materials/material-codes
 * Returns distinct material codes (sorted) for dropdowns (e.g. compound batch creation).
 */
async function getMaterialCodes(request: NextRequest) {
  void request;
  try {
    await dbConnect();

    const codes = await RawMaterial.distinct('materialCode');
    const sorted = (codes as string[])
      .filter((c) => typeof c === 'string' && c.trim().length > 0)
      .map((c) => c.trim())
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    const response: ApiResponse<string[]> = {
      success: true,
      message: 'Material codes fetched successfully',
      data: sorted,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching material codes:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch material codes',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_BATCH_VIEW, getMaterialCodes);
