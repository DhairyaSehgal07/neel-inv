// src/lib/date-utils.ts
import { HOLIDAYS } from './data';

/**
 * Check if a date is a Sunday (0) or a holiday
 */
export function isHolidayOrSunday(date: Date): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return true; // Sunday

  const dateStr = date.toISOString().split('T')[0];
  return HOLIDAYS.includes(dateStr);
}

/**
 * Get the next working day (skips Sundays and holidays)
 */
export function getNextWorkingDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  while (isHolidayOrSunday(next)) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Get the previous working day (skips Sundays and holidays)
 */
export function getPreviousWorkingDay(date: Date): Date {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);

  while (isHolidayOrSunday(prev)) {
    prev.setDate(prev.getDate() - 1);
  }

  return prev;
}

/**
 * Add working days to a date (excluding Sundays and holidays)
 */
export function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = Math.abs(days);
  const direction = days > 0 ? 1 : -1;

  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    if (!isHolidayOrSunday(result)) {
      remaining--;
    }
  }

  return result;
}

/**
 * Calculate process dates based on calendaring date (forward)
 */
export function calculateForwardDates(calendaringDate: string): {
  compoundProducedOn: string;
  curingDate: string;
  inspectionDate: string;
} {
  const calDate = new Date(calendaringDate);

  // Compound Production: -7 days from calendaring
  const compoundDate = addWorkingDays(calDate, -7);

  // Press (Curing): +1 day from calendaring
  const curingDate = addWorkingDays(calDate, 1);

  // Internal Inspection: +4 days from calendaring
  const inspectionDate = addWorkingDays(calDate, 4);

  return {
    compoundProducedOn: compoundDate.toISOString().split('T')[0],
    curingDate: curingDate.toISOString().split('T')[0],
    inspectionDate: inspectionDate.toISOString().split('T')[0],
  };
}

/**
 * Calculate process dates backward from latest known stage (Auto Mode - backward only)
 * This function calculates ONLY backward, never forward
 */
export function calculateBackwardDates(
  latestStage: 'calendaringDate' | 'greenBeltDate' | 'curingDate' | 'inspectionDate',
  latestDate: string
): Partial<{
  calendaringDate: string;
  greenBeltDate: string;
  compoundProducedOn: string;
  compoundUsedOn: string;
  curingDate: string;
  inspectionDate: string;
}> {
  const latest = new Date(latestDate);
  const result: Partial<{
    calendaringDate: string;
    greenBeltDate: string;
    compoundProducedOn: string;
    compoundUsedOn: string;
    curingDate: string;
    inspectionDate: string;
  }> = {};

  switch (latestStage) {
    case 'calendaringDate':
      // Calendaring is the base, calculate backward only
      result.calendaringDate = latestDate;
      result.greenBeltDate = latestDate; // Same day
      result.compoundProducedOn = addWorkingDays(latest, -7).toISOString().split('T')[0];
      result.compoundUsedOn = latestDate;
      break;

    case 'greenBeltDate':
      // Green Belt is same as calendaring, so calculate from that
      result.greenBeltDate = latestDate;
      result.calendaringDate = latestDate;
      result.compoundProducedOn = addWorkingDays(latest, -7).toISOString().split('T')[0];
      result.compoundUsedOn = latestDate;
      break;

    case 'curingDate':
      // Curing is +1 from calendaring, so calendaring is -1 from curing
      const calFromCuring = addWorkingDays(latest, -1);
      result.curingDate = latestDate;
      result.calendaringDate = calFromCuring.toISOString().split('T')[0];
      result.greenBeltDate = calFromCuring.toISOString().split('T')[0];
      result.compoundProducedOn = addWorkingDays(calFromCuring, -7).toISOString().split('T')[0];
      result.compoundUsedOn = calFromCuring.toISOString().split('T')[0];
      break;

    case 'inspectionDate':
      // Inspection is +4 from calendaring, so calendaring is -4 from inspection
      const calFromInspection = addWorkingDays(latest, -4);
      result.inspectionDate = latestDate;
      result.calendaringDate = calFromInspection.toISOString().split('T')[0];
      result.greenBeltDate = calFromInspection.toISOString().split('T')[0];
      result.compoundProducedOn = addWorkingDays(calFromInspection, -7).toISOString().split('T')[0];
      result.compoundUsedOn = calFromInspection.toISOString().split('T')[0];
      result.curingDate = addWorkingDays(calFromInspection, 1).toISOString().split('T')[0];
      break;
  }

  return result;
}

/**
 * Calculate process dates based on latest known stage (reverse) - DEPRECATED
 * Use calculateBackwardDates for Auto Mode
 */
export function calculateReverseDates(
  latestStage: 'curingDate' | 'inspectionDate' | 'pidDate' | 'packagingDate' | 'dispatchDate',
  latestDate: string
): Partial<{
  calendaringDate: string;
  compoundProducedOn: string;
  curingDate: string;
  inspectionDate: string;
}> {
  const latest = new Date(latestDate);
  const result: Partial<{
    calendaringDate: string;
    compoundProducedOn: string;
    curingDate: string;
    inspectionDate: string;
  }> = {};

  switch (latestStage) {
    case 'curingDate':
      // Curing is +1 from calendaring, so calendaring is -1 from curing
      const calFromCuring = addWorkingDays(latest, -1);
      result.calendaringDate = calFromCuring.toISOString().split('T')[0];
      result.compoundProducedOn = addWorkingDays(calFromCuring, -7).toISOString().split('T')[0];
      result.curingDate = latestDate;
      result.inspectionDate = addWorkingDays(calFromCuring, 4).toISOString().split('T')[0];
      break;

    case 'inspectionDate':
      // Inspection is +4 from calendaring, so calendaring is -4 from inspection
      const calFromInspection = addWorkingDays(latest, -4);
      result.calendaringDate = calFromInspection.toISOString().split('T')[0];
      result.compoundProducedOn = addWorkingDays(calFromInspection, -7).toISOString().split('T')[0];
      result.curingDate = addWorkingDays(calFromInspection, 1).toISOString().split('T')[0];
      result.inspectionDate = latestDate;
      break;

    default:
      // For later stages, we can't reverse calculate accurately without more info
      // Return empty for now
      break;
  }

  return result;
}

/**
 * Format date for display
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object in local timezone
 * This prevents timezone issues when converting between strings and Date objects
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * This prevents timezone issues when converting Date to string
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
