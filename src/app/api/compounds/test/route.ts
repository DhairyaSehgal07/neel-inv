import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import Belt from '@/model/Belt';

/**
 * Test route to analyze calendaring dates across all belts
 * Groups belts by their calendaring dates and shows which belts share the same date
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function testCalendaringDatesHandler(_request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all belts
    const belts = await Belt.find({}).lean();

    // Map to store calendaringDate -> array of belt numbers
    const dateToBeltsMap = new Map<string, string[]>();

    // Process each belt
    for (const belt of belts) {
      const calendaringDate = belt.process?.calendaringDate;

      if (!calendaringDate) {
        continue;
      }

      // Get existing belts for this date or create new array
      const existingBelts = dateToBeltsMap.get(calendaringDate) || [];
      existingBelts.push(belt.beltNumber);
      dateToBeltsMap.set(calendaringDate, existingBelts);
    }

    // Convert map to array format for response
    const dateGroups = Array.from(dateToBeltsMap.entries())
      .map(([date, beltNumbers]) => ({
        calendaringDate: date,
        beltCount: beltNumbers.length,
        beltNumbers: beltNumbers.sort(), // Sort for consistent output
      }))
      .sort((a, b) => {
        // Sort by date (newest first) or by count (most belts first)
        if (a.beltCount !== b.beltCount) {
          return b.beltCount - a.beltCount;
        }
        return b.calendaringDate.localeCompare(a.calendaringDate);
      });

    // Calculate statistics
    const totalBelts = belts.length;
    const beltsWithCalendaringDate = Array.from(dateToBeltsMap.values()).reduce(
      (sum, belts) => sum + belts.length,
      0
    );
    const uniqueCalendaringDates = dateToBeltsMap.size;
    const beltsWithMultipleSameDate = dateGroups.filter((group) => group.beltCount > 1);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Calendaring dates analysis completed',
        data: {
          statistics: {
            totalBelts,
            beltsWithCalendaringDate,
            beltsWithoutCalendaringDate: totalBelts - beltsWithCalendaringDate,
            uniqueCalendaringDates,
            datesWithMultipleBelts: beltsWithMultipleSameDate.length,
            totalBeltsWithSharedDates: beltsWithMultipleSameDate.reduce(
              (sum, group) => sum + group.beltCount,
              0
            ),
          },
          dateGroups,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error analyzing calendaring dates:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: `Failed to analyze calendaring dates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_BATCH_VIEW, testCalendaringDatesHandler);
