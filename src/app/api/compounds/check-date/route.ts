import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';

/**
 * Check if a compound date is already used
 * GET /api/compounds/check-date?date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { success: false, message: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Check if date is used in either coverCompoundProducedOn or skimCompoundProducedOn
    const existingCover = await CompoundBatch.findOne({
      coverCompoundProducedOn: date,
    }).lean();

    const existingSkim = await CompoundBatch.findOne({
      skimCompoundProducedOn: date,
    }).lean();

    const isUsed = !!(existingCover || existingSkim);
    const usedIn = existingCover
      ? 'cover'
      : existingSkim
        ? 'skim'
        : null;

    return NextResponse.json({
      success: true,
      isUsed,
      usedIn,
    });
  } catch (error) {
    console.error('Error checking date:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check date',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
