import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundBatch from '@/model/CompoundBatch';
import { parseLocalDate, toISODateOnly, getPreviousWorkingDay } from '@/lib/helpers/calculations';

/**
 * Find an available compound date between 3-30 working days from calendaring date
 * POST /api/compounds/find-available-date
 * Body: { calendaringDate: string, excludeDate?: string }
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { calendaringDate, excludeDate } = body;

    if (!calendaringDate) {
      return NextResponse.json(
        { success: false, message: 'Calendaring date is required' },
        { status: 400 }
      );
    }

    const calendaring = parseLocalDate(calendaringDate);
    const maxAttempts = 100; // Try up to 100 different dates
    let attempts = 0;

    // Generate a list of potential dates between 3-30 working days before calendaring
    const potentialDates: Date[] = [];
    let currentDate = new Date(calendaring);
    let workingDaysCount = 0;

    // Go backwards from calendaring date, collecting dates that are 3-30 working days away
    while (workingDaysCount < 30 && attempts < maxAttempts) {
      currentDate = getPreviousWorkingDay(currentDate);
      workingDaysCount++;

      if (workingDaysCount >= 3) {
        potentialDates.push(new Date(currentDate));
      }
      attempts++;
    }

    // Shuffle the dates to randomize selection
    const shuffledDates = potentialDates.sort(() => Math.random() - 0.5);

    // Find the first available date
    for (const candidateDate of shuffledDates) {
      const dateStr = toISODateOnly(candidateDate);

      // Skip if this is the date we're excluding
      if (excludeDate && dateStr === excludeDate) {
        continue;
      }

      // Check if date is already used
      const existingCover = await CompoundBatch.findOne({
        coverCompoundProducedOn: dateStr,
      }).lean();

      const existingSkim = await CompoundBatch.findOne({
        skimCompoundProducedOn: dateStr,
      }).lean();

      // If date is not used, return it
      if (!existingCover && !existingSkim) {
        return NextResponse.json({
          success: true,
          availableDate: dateStr,
        });
      }
    }

    // If no available date found, try to find any date in the range
    // by going through systematically
    for (let offset = 3; offset <= 30; offset++) {
      let testDate = new Date(calendaring);
      let workingDays = 0;

      while (workingDays < offset) {
        testDate = getPreviousWorkingDay(testDate);
        workingDays++;
      }

      const dateStr = toISODateOnly(testDate);

      if (excludeDate && dateStr === excludeDate) {
        continue;
      }

      const existingCover = await CompoundBatch.findOne({
        coverCompoundProducedOn: dateStr,
      }).lean();

      const existingSkim = await CompoundBatch.findOne({
        skimCompoundProducedOn: dateStr,
      }).lean();

      if (!existingCover && !existingSkim) {
        return NextResponse.json({
          success: true,
          availableDate: dateStr,
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: 'No available date found in the 3-30 working days range',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error finding available date:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to find available date',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
