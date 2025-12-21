// calculation.ts
// AI-READY SPEC MANUAL - calculation helpers
// (State-only utilities — no DB)

import { HOLIDAYS } from "./belts";

export type CompoundKey =
  | 'Nk-1'
  | 'Nk-2'
  | 'Nk-3'
  | 'Nk-4'
  | 'Nk-5'
  | 'Nk-6'
  | 'Nk-7'
  | 'Nk-8'
  | 'Nk-9'
  | 'Nk-10'
  | 'Nk-11'
  | 'Nk-12'
  | 'Nk-13';

export const DEFAULT_COMPOUND_SG: Record<CompoundKey, number> = {
  'Nk-1': 1.2,
  'Nk-2': 1.1,
  'Nk-3': 1.22,
  'Nk-4': 1.18,
  'Nk-5': 1.12,
  'Nk-6': 1.21,
  'Nk-7': 1.19,
  'Nk-8': 1.14,
  'Nk-9': 1.15,
  'Nk-10': 1.16,
  'Nk-11': 1.23,
  'Nk-12': 1.17,
  'Nk-13': 1.13,
};

/**
 * Parse number_of_plies from rating string.
 * Example rating formats:
 *  - "200/2" => returns 2
 *  - "250/3" => returns 3
 *  - "200" => returns 1 (fallback)
 */
export function parseNumberOfPliesFromRating(rating?: string): number {
  if (!rating) return 1;
  const parts = rating.split('/');
  if (parts.length === 2) {
    const p = parseInt(parts[1], 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }
  return 1;
}

/**
 * Check if a date is a Sunday (0 = Sunday in JavaScript)
 */
function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * Check if a date is a holiday
 * @param date - Date to check
 * @returns true if date is a holiday
 */
function isHoliday(date: Date): boolean {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  return HOLIDAYS.includes(dateStr);
}

/**
 * Check if a date is a weekend or holiday
 */
export function isWeekendOrHoliday(date: Date): boolean {
  return isSunday(date) || isHoliday(date);
}

/**
 * Fabric Consumption
 * fabric_consumed = belt_length * number_of_plies * 1.02
 *
 * beltLength: meters
 */
export function fabric_consumed(beltLength: number | undefined, number_of_plies: number) {
  const L = beltLength || 0;
  return L * number_of_plies * 1.02;
}

/**
 * Cover Weight Formula (kg)
 *
 * cover_weight_kg =
 * thickness_mm
 * * specific_gravity
 * * 1.06
 * * 1.02
 * * belt_width_m
 * * belt_length_m
 *
 * thickness = (top + bottom) in mm, beltWidth in meters, beltLength in meters
 */
export function cover_weight_kg(
  topCoverMm: number | undefined,
  bottomCoverMm: number | undefined,
  specificGravity: number,
  beltWidthM: number | undefined,
  beltLengthM: number | undefined
) {
  const top = topCoverMm || 0;
  const bottom = bottomCoverMm || 0;
  const width = beltWidthM || 0;
  const length = beltLengthM || 0;
  const thickness = top + bottom;
  // formula: thickness_mm * SG * 1.06 * 1.02 * belt_width_m * belt_length_m
  return thickness * specificGravity * 1.06 * 1.02 * width * length;
}

/**
 * Skim Weight Formula (kg)
 *
 * skim_weight_kg =
 * thickness_mm
 * * specific_gravity
 * * 1.06
 * * 1.02
 * * belt_width_m
 * * belt_length_m
 *
 * thickness = (skim_thickness_mm_per_ply * number_of_plies), beltWidth in meters, beltLength in meters
 */
export function skim_weight_kg(
  skimThicknessMmPerPly: number,
  number_of_plies: number,
  specificGravity: number,
  beltWidthM: number | undefined,
  beltLengthM: number | undefined
) {
  const width = beltWidthM || 0;
  const length = beltLengthM || 0;
  const thickness = skimThicknessMmPerPly * number_of_plies;
  // formula: thickness_mm * SG * 1.06 * 1.02 * belt_width_m * belt_length_m
  return thickness * specificGravity * 1.06 * 1.02 * width * length;
}

/**
 * Batch rules
 */
export function cover_batches(coverWeightKg: number) {
  const BATCH_SIZE = 90;
  if (!coverWeightKg || coverWeightKg <= 0) return 0;
  return Math.ceil(coverWeightKg / BATCH_SIZE);
}

export function getSkimBatchSizeByCompound(compound?: CompoundKey) {
  if (!compound) return 90;
  if (compound === 'Nk-8' || compound === 'Nk-9' || compound === 'Nk-10') return 120;
  // for nk-2, nk-5 and others, default 90 (as mentioned)
  return 90;
}
export function skim_batches(skimWeightKg: number, compound?: CompoundKey) {
  const batchSize = getSkimBatchSizeByCompound(compound);
  if (!skimWeightKg || skimWeightKg <= 0) return 0;
  return Math.ceil(skimWeightKg / batchSize);
}

/**
 * Random range requirement
 * random_value = random_integer(100, 110)
 */
export function random_value_100_110() {
  return Math.floor(Math.random() * (110 - 100 + 1)) + 100;
}


/**
 * Machine breakdown:
 * Compounding machine fails once every 6 months.
 * Given a 'from' date, return next failure date (adds 6 months).
 */
export function next_compounding_failure(fromDate?: string | Date) {
  const d = fromDate ? new Date(fromDate) : new Date();
  const next = new Date(d);
  next.setMonth(next.getMonth() + 6);
  return next.toISOString();
}

/**
 * Skim thickness lookup table (mm per ply) — based on fabric strength
 * Reference: Step 3: Compound Tracking - Skim Thickness table
 */
export const SKIM_THICKNESS_BY_STRENGTH: Record<number, number> = {
  100: 1.0,
  125: 1.3,
  150: 1.5,
  160: 1.5,
  200: 1.6,
  250: 1.725,
  300: 2.0,
  315: 2.0,
  350: 2.0,
  400: 2.0,
};

/**
 * Get skim thickness per ply based on fabric strength
 * @param strength - Fabric strength value
 * @returns Skim thickness in mm per ply
 */
export function skim_thickness_from_strength(strength?: number): number {
  if (!strength || !Number.isFinite(strength)) return 1.5; // default fallback
  return SKIM_THICKNESS_BY_STRENGTH[strength] ?? 1.5; // default fallback
}

/**
 * @deprecated Use skim_thickness_from_strength instead
 * Get skim thickness per ply based on rating (legacy function)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function skim_thickness_from_rating(_rating?: string): number {
  // This function is kept for backward compatibility but should use strength instead
  return 1.5; // default fallback
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer between min and max
 */
export function randomBetween(min: number, max: number): number {
  if (min > max) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Process States (reverse-calculated) — given dispatch date (ISO string),
 * compute earlier dates using sequential pattern:
 *
 * 1. Dispatch Date (D) - input
 * 2. Packaging: D − 1 day
 * 3. PDI: D − 4 to D − 5 days (random in range)
 * 4. Internal Inspection: PDI − 4 to PDI − 10 days (random in range)
 * 5. Curing: Internal Inspection − 2 days (fixed)
 * 6. Green Belt: Curing − 1 day (fixed)
 * 7. Calendaring: Green Belt (same day) or Green Belt − 1 day (random)
 * 8. Compound: Calendaring − 2 to Calendaring − 7 days (random in range)
 *
 * All returned as ISO date strings (YYYY-MM-DD).
 */
/**
 * Convert a Date to YYYY-MM-DD format using local timezone (not UTC)
 */
function toISODateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse a date string (YYYY-MM-DD) as a local date (not UTC)
 * This prevents timezone shifts when parsing date-only strings
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date in local timezone (month is 0-indexed in Date constructor)
  return new Date(year, month - 1, day);
}

export type ProcessDatesResult = {
  dispatch_date: string;
  packaging_date: string;
  pdi_date: string;
  internal_inspection_date: string;
  curing_date: string;
  green_belt_date: string;
  calendaring_date: string;
  cover_compound_date: string;
  skim_compound_date: string;
};

export function process_dates_from_dispatch(dispatchDateIso?: string): ProcessDatesResult | Record<string, never> {
  if (!dispatchDateIso) {
    console.log('[Date Calculation] No dispatch date provided, returning empty object');
    return {};
  }

  console.log('[Date Calculation] Starting date calculation from dispatch date:', dispatchDateIso);
  const dispatch = parseLocalDate(dispatchDateIso);
  console.log('[Date Calculation] Parsed dispatch date:', toISODateOnly(dispatch));

  // Helper function to generate a date offset by days from a base date,
  // skipping Sundays and holidays (going backwards in time)
  const dateMinusDaysSkippingHolidaysAndSundays = (baseDate: Date, days: number, stepName?: string): Date => {
    const result = new Date(baseDate);
    let daysRemaining = days;
    let skippedDays = 0;

    console.log(`[Date Calculation] ${stepName || 'Helper'}: Starting from ${toISODateOnly(baseDate)}, going back ${days} working day(s)`);

    while (daysRemaining > 0) {
      result.setDate(result.getDate() - 1);
      if (!isWeekendOrHoliday(result)) {
        daysRemaining--;
      } else {
        skippedDays++;
        const reason = isSunday(result) ? 'Sunday' : 'Holiday';
        console.log(`[Date Calculation] ${stepName || 'Helper'}: Skipping ${toISODateOnly(result)} (${reason})`);
      }
    }

    if (skippedDays > 0) {
      console.log(`[Date Calculation] ${stepName || 'Helper'}: Skipped ${skippedDays} non-working day(s)`);
    }
    console.log(`[Date Calculation] ${stepName || 'Helper'}: Calculated date: ${toISODateOnly(result)}`);
    return result;
  };

  // 1. Dispatch Date (input)
  // dispatch is already set
  console.log('[Date Calculation] Step 1: Dispatch Date =', toISODateOnly(dispatch));

  // 2. Packaging: D − 1 day (fixed)
  const packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging');
  console.log('[Date Calculation] Step 2: Packaging Date =', toISODateOnly(packaging));

  // 3. PDI: D − 4 to D − 5 days (random in range)
  const pdiOffset = randomBetween(4, 5);
  console.log('[Date Calculation] Step 3: PDI - Random offset selected:', pdiOffset, 'working days');
  const pdi = dateMinusDaysSkippingHolidaysAndSundays(dispatch, pdiOffset, 'PDI');
  console.log('[Date Calculation] Step 3: PDI Date =', toISODateOnly(pdi));

  // 4. Internal Inspection: PDI − 4 to PDI − 10 days (random in range)
  const internalInspectionOffset = randomBetween(4, 10);
  console.log('[Date Calculation] Step 4: Internal Inspection - Random offset selected:', internalInspectionOffset, 'working days');
  const internalInspection = dateMinusDaysSkippingHolidaysAndSundays(pdi, internalInspectionOffset, 'Internal Inspection');
  console.log('[Date Calculation] Step 4: Internal Inspection Date =', toISODateOnly(internalInspection));

  // 5. Curing: Internal Inspection − 2 days (fixed)
  const curing = dateMinusDaysSkippingHolidaysAndSundays(internalInspection, 2, 'Curing');
  console.log('[Date Calculation] Step 5: Curing Date =', toISODateOnly(curing));

  // 6. Green Belt: Curing − 1 day (fixed)
  const greenBelt = dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt');
  console.log('[Date Calculation] Step 6: Green Belt Date =', toISODateOnly(greenBelt));

  // 7. Calendaring: Green Belt (same day) or Green Belt − 1 day (random)
  // Random: 0 or 1 day before green belt
  const calendaringOffset = randomBetween(0, 1);
  console.log('[Date Calculation] Step 7: Calendaring - Random offset selected:', calendaringOffset === 0 ? 'same day' : '1 day before');
  const calendaring =
    calendaringOffset === 0
      ? new Date(greenBelt) // Same day
      : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring'); // 1 day before
  console.log('[Date Calculation] Step 7: Calendaring Date =', toISODateOnly(calendaring));

  // 8. Cover Compound: Calendaring − 7 to Calendaring − 10 days (random in range)
  const coverCompoundOffset = randomBetween(7, 10);
  console.log('[Date Calculation] Step 8: Cover Compound - Random offset selected:', coverCompoundOffset, 'working days');
  const coverCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound');
  console.log('[Date Calculation] Step 8: Cover Compound Date =', toISODateOnly(coverCompound));

  // 9. Skim Compound: Calendaring − 7 to Calendaring − 10 days (random in range)
  // Must be on a different date than cover compound
  const skimCompoundOffset = randomBetween(7, 10);
  console.log('[Date Calculation] Step 9: Skim Compound - Initial random offset selected:', skimCompoundOffset, 'working days');
  let skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');

  // Ensure skim compound is on a different date than cover compound
  if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
    console.log('[Date Calculation] Step 9: Skim compound date matches cover compound date, adjusting...');
    // Move skim compound back by 1 working day
    skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
    console.log('[Date Calculation] Step 9: Skim Compound Date (adjusted) =', toISODateOnly(skimCompound));
  } else {
    console.log('[Date Calculation] Step 9: Skim Compound Date =', toISODateOnly(skimCompound));
  }

  const result = {
    dispatch_date: toISODateOnly(dispatch),
    packaging_date: toISODateOnly(packaging),
    pdi_date: toISODateOnly(pdi),
    internal_inspection_date: toISODateOnly(internalInspection),
    curing_date: toISODateOnly(curing),
    green_belt_date: toISODateOnly(greenBelt),
    calendaring_date: toISODateOnly(calendaring),
    cover_compound_date: toISODateOnly(coverCompound),
    skim_compound_date: toISODateOnly(skimCompound),
  };

  console.log('[Date Calculation] Final calculated dates:', result);
  return result;
}

/**
 * Get separate compound dates ensuring one compound per day policy.
 * Returns cover and skim compound dates that are on different working days.
 * @param baseCompoundDate - Base compound date (ISO string)
 * @returns Object with cover_compound_date and skim_compound_date (both ISO strings)
 */
export function getSeparateCompoundDates(baseCompoundDate?: string): {
  cover_compound_date?: string;
  skim_compound_date?: string;
} {
  if (!baseCompoundDate) {
    console.log('[Separate Compound Dates] No base compound date provided, returning empty object');
    return {};
  }

  console.log('[Separate Compound Dates] Starting calculation from base compound date:', baseCompoundDate);
  const baseDate = parseLocalDate(baseCompoundDate);
  const coverDate = new Date(baseDate);
  console.log('[Separate Compound Dates] Cover compound date (same as base):', toISODateOnly(coverDate));

  // Get the previous working day for skim compound (ensuring different day)
  const skimDate = new Date(baseDate);
  skimDate.setDate(skimDate.getDate() - 1);
  console.log('[Separate Compound Dates] Initial skim date (1 day before):', toISODateOnly(skimDate));

  // Skip weekends and holidays to find the previous working day
  let skippedCount = 0;
  while (isWeekendOrHoliday(skimDate)) {
    const reason = isSunday(skimDate) ? 'Sunday' : 'Holiday';
    console.log(`[Separate Compound Dates] Skipping ${toISODateOnly(skimDate)} (${reason}), going back one more day`);
    skimDate.setDate(skimDate.getDate() - 1);
    skippedCount++;
  }

  if (skippedCount > 0) {
    console.log(`[Separate Compound Dates] Skipped ${skippedCount} non-working day(s) for skim compound`);
  }

  const result = {
    cover_compound_date: toISODateOnly(coverDate),
    skim_compound_date: toISODateOnly(skimDate),
  };

  console.log('[Separate Compound Dates] Final dates:', result);
  return result;
}

/**
 * Count working days (excluding Sundays and holidays) between two dates.
 * Returns the number of working days in the gap between startDate and endDate.
 * If endDate is after startDate, counts forward; if before, counts backward.
 * The count excludes both start and end dates (counts the gap).
 */
export function countWorkingDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Normalize to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  console.log('[Count Working Days] Counting between', toISODateOnly(start), 'and', toISODateOnly(end));

  if (start.getTime() === end.getTime()) {
    console.log('[Count Working Days] Same date, returning 0');
    return 0;
  }

  let count = 0;
  const current = new Date(start);
  const direction = end >= start ? 1 : -1;
  const directionStr = direction === 1 ? 'forward' : 'backward';
  console.log('[Count Working Days] Direction:', directionStr);

  // Move to the next/previous day first
  current.setDate(current.getDate() + direction);

  // Count working days until we reach the end date
  while (current.getTime() !== end.getTime()) {
    if (!isWeekendOrHoliday(current)) {
      count++;
    } else {
      const reason = isSunday(current) ? 'Sunday' : 'Holiday';
      console.log(`[Count Working Days] Skipping ${toISODateOnly(current)} (${reason})`);
    }
    current.setDate(current.getDate() + direction);
  }

  console.log('[Count Working Days] Total working days:', count);
  return count;
}

/**
 * Get the previous working day (skipping Sundays and holidays)
 */
export function getPreviousWorkingDay(date: Date): Date {
  console.log('[Get Previous Working Day] Starting from:', toISODateOnly(date));
  const result = new Date(date);
  result.setDate(result.getDate() - 1);
  let skippedCount = 0;

  while (isWeekendOrHoliday(result)) {
    const reason = isSunday(result) ? 'Sunday' : 'Holiday';
    console.log(`[Get Previous Working Day] Skipping ${toISODateOnly(result)} (${reason})`);
    result.setDate(result.getDate() - 1);
    skippedCount++;
  }

  if (skippedCount > 0) {
    console.log(`[Get Previous Working Day] Skipped ${skippedCount} non-working day(s)`);
  }
  console.log('[Get Previous Working Day] Result:', toISODateOnly(result));
  return result;
}

/**
 * Get the next working day (skipping Sundays and holidays)
 */
export function getNextWorkingDay(date: Date): Date {
  console.log('[Get Next Working Day] Starting from:', toISODateOnly(date));
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  let skippedCount = 0;

  while (isWeekendOrHoliday(result)) {
    const reason = isSunday(result) ? 'Sunday' : 'Holiday';
    console.log(`[Get Next Working Day] Skipping ${toISODateOnly(result)} (${reason})`);
    result.setDate(result.getDate() + 1);
    skippedCount++;
  }

  if (skippedCount > 0) {
    console.log(`[Get Next Working Day] Skipped ${skippedCount} non-working day(s)`);
  }
  console.log('[Get Next Working Day] Result:', toISODateOnly(result));
  return result;
}

/**
 * Helper function to generate a date offset by days from a base date,
 * skipping Sundays and holidays (going forward in time)
 */
function datePlusDaysSkippingHolidaysAndSundays(baseDate: Date, days: number, stepName?: string): Date {
  const result = new Date(baseDate);
  let daysRemaining = days;
  let skippedDays = 0;

  console.log(`[Date Calculation] ${stepName || 'Helper'}: Starting from ${toISODateOnly(baseDate)}, going forward ${days} working day(s)`);

  while (daysRemaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekendOrHoliday(result)) {
      daysRemaining--;
    } else {
      skippedDays++;
      const reason = isSunday(result) ? 'Sunday' : 'Holiday';
      console.log(`[Date Calculation] ${stepName || 'Helper'}: Skipping ${toISODateOnly(result)} (${reason})`);
    }
  }

  if (skippedDays > 0) {
    console.log(`[Date Calculation] ${stepName || 'Helper'}: Skipped ${skippedDays} non-working day(s)`);
  }
  console.log(`[Date Calculation] ${stepName || 'Helper'}: Calculated date: ${toISODateOnly(result)}`);
  return result;
}

/**
 * Calculate all process dates from a given date field.
 * This function detects which date was changed and recalculates all other dates accordingly.
 * @param changedDateField - The field name that was changed (e.g., 'pdiDate', 'dispatchDate')
 * @param changedDateValue - The new date value (ISO string or Date)
 * @returns ProcessDatesResult with all calculated dates
 */
export function process_dates_from_any_date(
  changedDateField: string,
  changedDateValue: string | Date | undefined
): ProcessDatesResult | Record<string, never> {
  if (!changedDateValue) {
    console.log('[Date Calculation] No date value provided, returning empty object');
    return {};
  }

  const baseDate = changedDateValue instanceof Date
    ? changedDateValue
    : parseLocalDate(changedDateValue);

  console.log('[Date Calculation] Starting calculation from', changedDateField, ':', toISODateOnly(baseDate));

  // Helper function for going backward (same as in process_dates_from_dispatch)
  const dateMinusDaysSkippingHolidaysAndSundays = (baseDate: Date, days: number, stepName?: string): Date => {
    const result = new Date(baseDate);
    let daysRemaining = days;
    let skippedDays = 0;

    console.log(`[Date Calculation] ${stepName || 'Helper'}: Starting from ${toISODateOnly(baseDate)}, going back ${days} working day(s)`);

    while (daysRemaining > 0) {
      result.setDate(result.getDate() - 1);
      if (!isWeekendOrHoliday(result)) {
        daysRemaining--;
      } else {
        skippedDays++;
        const reason = isSunday(result) ? 'Sunday' : 'Holiday';
        console.log(`[Date Calculation] ${stepName || 'Helper'}: Skipping ${toISODateOnly(result)} (${reason})`);
      }
    }

    if (skippedDays > 0) {
      console.log(`[Date Calculation] ${stepName || 'Helper'}: Skipped ${skippedDays} non-working day(s)`);
    }
    console.log(`[Date Calculation] ${stepName || 'Helper'}: Calculated date: ${toISODateOnly(result)}`);
    return result;
  };

  let dispatch: Date;
  let packaging: Date;
  let pdi: Date;
  let internalInspection: Date;
  let curing: Date;
  let greenBelt: Date;
  let calendaring: Date;
  let coverCompound: Date;
  let skimCompound: Date;

  // Calculate dates based on which field was changed
  switch (changedDateField) {
    case 'dispatchDate': {
      dispatch = baseDate;
      packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging');
      const pdiOffset = randomBetween(4, 5);
      pdi = dateMinusDaysSkippingHolidaysAndSundays(dispatch, pdiOffset, 'PDI');
      const inspectionOffset = randomBetween(4, 10);
      internalInspection = dateMinusDaysSkippingHolidaysAndSundays(pdi, inspectionOffset, 'Internal Inspection');
      curing = dateMinusDaysSkippingHolidaysAndSundays(internalInspection, 2, 'Curing');
      greenBelt = dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt');
      const calendaringOffset = randomBetween(0, 1);
      calendaring = calendaringOffset === 0
        ? new Date(greenBelt)
        : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring');
      const coverCompoundOffset = randomBetween(7, 10);
      coverCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound');
      const skimCompoundOffset = randomBetween(7, 10);
      skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      break;
    }

    case 'packagingDate': {
      packaging = baseDate;
      dispatch = datePlusDaysSkippingHolidaysAndSundays(packaging, 1, 'Dispatch');
      const pdiOffset = randomBetween(4, 5);
      pdi = dateMinusDaysSkippingHolidaysAndSundays(dispatch, pdiOffset, 'PDI');
      const inspectionOffset = randomBetween(4, 10);
      internalInspection = dateMinusDaysSkippingHolidaysAndSundays(pdi, inspectionOffset, 'Internal Inspection');
      curing = dateMinusDaysSkippingHolidaysAndSundays(internalInspection, 2, 'Curing');
      greenBelt = dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt');
      const calendaringOffset = randomBetween(0, 1);
      calendaring = calendaringOffset === 0
        ? new Date(greenBelt)
        : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring');
      const coverCompoundOffset = randomBetween(7, 10);
      coverCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound');
      const skimCompoundOffset = randomBetween(7, 10);
      skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      break;
    }

    case 'pdiDate': {
      pdi = baseDate;
      const pdiOffset = randomBetween(4, 5);
      dispatch = datePlusDaysSkippingHolidaysAndSundays(pdi, pdiOffset, 'Dispatch');
      packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging');
      const inspectionOffset = randomBetween(4, 10);
      internalInspection = dateMinusDaysSkippingHolidaysAndSundays(pdi, inspectionOffset, 'Internal Inspection');
      curing = dateMinusDaysSkippingHolidaysAndSundays(internalInspection, 2, 'Curing');
      greenBelt = dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt');
      const calendaringOffset = randomBetween(0, 1);
      calendaring = calendaringOffset === 0
        ? new Date(greenBelt)
        : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring');
      const coverCompoundOffset = randomBetween(7, 10);
      coverCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound');
      const skimCompoundOffset = randomBetween(7, 10);
      skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      break;
    }

    case 'inspectionDate': {
      internalInspection = baseDate;
      const inspectionOffset = randomBetween(4, 10);
      pdi = datePlusDaysSkippingHolidaysAndSundays(internalInspection, inspectionOffset, 'PDI');
      const pdiOffset = randomBetween(4, 5);
      dispatch = datePlusDaysSkippingHolidaysAndSundays(pdi, pdiOffset, 'Dispatch');
      packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging');
      curing = dateMinusDaysSkippingHolidaysAndSundays(internalInspection, 2, 'Curing');
      greenBelt = dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt');
      const calendaringOffset = randomBetween(0, 1);
      calendaring = calendaringOffset === 0
        ? new Date(greenBelt)
        : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring');
      const coverCompoundOffset = randomBetween(7, 10);
      coverCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound');
      const skimCompoundOffset = randomBetween(7, 10);
      skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      break;
    }

    case 'curingDate': {
      curing = baseDate;
      internalInspection = datePlusDaysSkippingHolidaysAndSundays(curing, 2, 'Internal Inspection');
      const inspectionOffset = randomBetween(4, 10);
      pdi = datePlusDaysSkippingHolidaysAndSundays(internalInspection, inspectionOffset, 'PDI');
      const pdiOffset = randomBetween(4, 5);
      dispatch = datePlusDaysSkippingHolidaysAndSundays(pdi, pdiOffset, 'Dispatch');
      packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging');
      greenBelt = dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt');
      const calendaringOffset = randomBetween(0, 1);
      calendaring = calendaringOffset === 0
        ? new Date(greenBelt)
        : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring');
      const coverCompoundOffset = randomBetween(7, 10);
      coverCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound');
      const skimCompoundOffset = randomBetween(7, 10);
      skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      break;
    }

    case 'greenBeltDate': {
      greenBelt = baseDate;
      curing = datePlusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Curing');
      internalInspection = datePlusDaysSkippingHolidaysAndSundays(curing, 2, 'Internal Inspection');
      const inspectionOffset = randomBetween(4, 10);
      pdi = datePlusDaysSkippingHolidaysAndSundays(internalInspection, inspectionOffset, 'PDI');
      const pdiOffset = randomBetween(4, 5);
      dispatch = datePlusDaysSkippingHolidaysAndSundays(pdi, pdiOffset, 'Dispatch');
      packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging');
      const calendaringOffset = randomBetween(0, 1);
      calendaring = calendaringOffset === 0
        ? new Date(greenBelt)
        : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring');
      const coverCompoundOffset = randomBetween(7, 10);
      coverCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound');
      const skimCompoundOffset = randomBetween(7, 10);
      skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      break;
    }

    case 'calendaringDate': {
      calendaring = baseDate;
      // Calendaring can be same day or 1 day before green belt
      // If calendaring is set, green belt can be same day or 1 day after
      const greenBeltOffset = randomBetween(0, 1);
      greenBelt = greenBeltOffset === 0
        ? new Date(calendaring)
        : datePlusDaysSkippingHolidaysAndSundays(calendaring, 1, 'Green Belt');
      curing = datePlusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Curing');
      internalInspection = datePlusDaysSkippingHolidaysAndSundays(curing, 2, 'Internal Inspection');
      const inspectionOffset = randomBetween(4, 10);
      pdi = datePlusDaysSkippingHolidaysAndSundays(internalInspection, inspectionOffset, 'PDI');
      const pdiOffset = randomBetween(4, 5);
      dispatch = datePlusDaysSkippingHolidaysAndSundays(pdi, pdiOffset, 'Dispatch');
      packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging');
      const coverCompoundOffset = randomBetween(7, 10);
      coverCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound');
      const skimCompoundOffset = randomBetween(7, 10);
      skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      break;
    }

    case 'coverCompoundProducedOn': {
      coverCompound = baseDate;
      const coverCompoundOffset = randomBetween(7, 10);
      calendaring = datePlusDaysSkippingHolidaysAndSundays(coverCompound, coverCompoundOffset, 'Calendaring');
      const greenBeltOffset = randomBetween(0, 1);
      greenBelt = greenBeltOffset === 0
        ? new Date(calendaring)
        : datePlusDaysSkippingHolidaysAndSundays(calendaring, 1, 'Green Belt');
      curing = datePlusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Curing');
      internalInspection = datePlusDaysSkippingHolidaysAndSundays(curing, 2, 'Internal Inspection');
      const inspectionOffset = randomBetween(4, 10);
      pdi = datePlusDaysSkippingHolidaysAndSundays(internalInspection, inspectionOffset, 'PDI');
      const pdiOffset = randomBetween(4, 5);
      dispatch = datePlusDaysSkippingHolidaysAndSundays(pdi, pdiOffset, 'Dispatch');
      packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging');
      const skimCompoundOffset = randomBetween(7, 10);
      skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      break;
    }

    case 'skimCompoundProducedOn': {
      skimCompound = baseDate;
      // For skim compound, we need to ensure it's different from cover compound
      // Calculate cover compound first, then adjust if needed
      let coverCompoundOffset = randomBetween(7, 10);
      calendaring = datePlusDaysSkippingHolidaysAndSundays(skimCompound, coverCompoundOffset, 'Calendaring');
      // Recalculate cover compound from calendaring
      coverCompoundOffset = randomBetween(7, 10);
      coverCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound');
      // If they're the same, adjust
      if (toISODateOnly(skimCompound) === toISODateOnly(coverCompound)) {
        coverCompound = dateMinusDaysSkippingHolidaysAndSundays(skimCompound, 1, 'Cover Compound (adjusted)');
        // Recalculate calendaring from adjusted cover compound
        coverCompoundOffset = randomBetween(7, 10);
        calendaring = datePlusDaysSkippingHolidaysAndSundays(coverCompound, coverCompoundOffset, 'Calendaring');
      }
      const greenBeltOffset = randomBetween(0, 1);
      greenBelt = greenBeltOffset === 0
        ? new Date(calendaring)
        : datePlusDaysSkippingHolidaysAndSundays(calendaring, 1, 'Green Belt');
      curing = datePlusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Curing');
      internalInspection = datePlusDaysSkippingHolidaysAndSundays(curing, 2, 'Internal Inspection');
      const inspectionOffset = randomBetween(4, 10);
      pdi = datePlusDaysSkippingHolidaysAndSundays(internalInspection, inspectionOffset, 'PDI');
      const pdiOffset = randomBetween(4, 5);
      dispatch = datePlusDaysSkippingHolidaysAndSundays(pdi, pdiOffset, 'Dispatch');
      packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging');
      break;
    }

    default:
      console.log('[Date Calculation] Unknown date field:', changedDateField);
      return {};
  }

  const result = {
    dispatch_date: toISODateOnly(dispatch),
    packaging_date: toISODateOnly(packaging),
    pdi_date: toISODateOnly(pdi),
    internal_inspection_date: toISODateOnly(internalInspection),
    curing_date: toISODateOnly(curing),
    green_belt_date: toISODateOnly(greenBelt),
    calendaring_date: toISODateOnly(calendaring),
    cover_compound_date: toISODateOnly(coverCompound),
    skim_compound_date: toISODateOnly(skimCompound),
  };

  console.log('[Date Calculation] Final calculated dates from', changedDateField, ':', result);
  return result;
}

/**
 * Calculate only dates that come BEFORE a given date field in the process flow.
 * This function only recalculates dates backward from the changed date and does not
 * modify dates that come after it in the process.
 *
 * Process order (earliest to latest):
 * 1. Cover Compound Produced On
 * 2. Skim Compound Produced On
 * 3. Calendaring Date
 * 4. Green Belt Date
 * 5. Curing Date
 * 6. Inspection Date
 * 7. PDI Date
 * 8. Packaging Date
 * 9. Dispatch Date
 *
 * @param changedDateField - The field name that was changed
 * @param changedDateValue - The new date value (ISO string or Date)
 * @returns Partial ProcessDatesResult with only dates that come before the changed date
 */
export function process_dates_backward_only(
  changedDateField: string,
  changedDateValue: string | Date | undefined
): Partial<ProcessDatesResult> {
  if (!changedDateValue) {
    console.log('[Date Calculation] No date value provided, returning empty object');
    return {};
  }

  const baseDate = changedDateValue instanceof Date
    ? changedDateValue
    : parseLocalDate(changedDateValue);

  console.log('[Date Calculation] Starting backward-only calculation from', changedDateField, ':', toISODateOnly(baseDate));

  // Helper function for going backward
  const dateMinusDaysSkippingHolidaysAndSundays = (baseDate: Date, days: number, stepName?: string): Date => {
    const result = new Date(baseDate);
    let daysRemaining = days;
    let skippedDays = 0;

    console.log(`[Date Calculation] ${stepName || 'Helper'}: Starting from ${toISODateOnly(baseDate)}, going back ${days} working day(s)`);

    while (daysRemaining > 0) {
      result.setDate(result.getDate() - 1);
      if (!isWeekendOrHoliday(result)) {
        daysRemaining--;
      } else {
        skippedDays++;
        const reason = isSunday(result) ? 'Sunday' : 'Holiday';
        console.log(`[Date Calculation] ${stepName || 'Helper'}: Skipping ${toISODateOnly(result)} (${reason})`);
      }
    }

    if (skippedDays > 0) {
      console.log(`[Date Calculation] ${stepName || 'Helper'}: Skipped ${skippedDays} non-working day(s)`);
    }
    console.log(`[Date Calculation] ${stepName || 'Helper'}: Calculated date: ${toISODateOnly(result)}`);
    return result;
  };

  const result: Partial<ProcessDatesResult> = {};

  // Calculate dates backward based on which field was changed
  switch (changedDateField) {
    case 'dispatchDate': {
      // Calculate all dates backward from dispatch
      const dispatch = baseDate;
      result.dispatch_date = toISODateOnly(dispatch);
      result.packaging_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1, 'Packaging'));
      const pdiOffset = randomBetween(4, 5);
      result.pdi_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(dispatch, pdiOffset, 'PDI'));
      const inspectionOffset = randomBetween(4, 10);
      const pdi = parseLocalDate(result.pdi_date);
      result.internal_inspection_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(pdi, inspectionOffset, 'Internal Inspection'));
      const inspection = parseLocalDate(result.internal_inspection_date);
      result.curing_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(inspection, 2, 'Curing'));
      const curing = parseLocalDate(result.curing_date);
      result.green_belt_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt'));
      const greenBelt = parseLocalDate(result.green_belt_date);
      const calendaringOffset = randomBetween(0, 1);
      result.calendaring_date = toISODateOnly(
        calendaringOffset === 0
          ? greenBelt
          : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring')
      );
      const calendaring = parseLocalDate(result.calendaring_date);
      const coverCompoundOffset = randomBetween(7, 10);
      result.cover_compound_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound'));
      const coverCompound = parseLocalDate(result.cover_compound_date);
      const skimCompoundOffset = randomBetween(7, 10);
      let skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === result.cover_compound_date) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      result.skim_compound_date = toISODateOnly(skimCompound);
      break;
    }

    case 'packagingDate': {
      // Calculate dates backward from packaging (but not dispatch)
      const packaging = baseDate;
      result.packaging_date = toISODateOnly(packaging);
      const pdiOffset = randomBetween(4, 5);
      // Calculate PDI backward from packaging + 1 (which would be dispatch)
      const estimatedDispatch = datePlusDaysSkippingHolidaysAndSundays(packaging, 1, 'Estimated Dispatch');
      result.pdi_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(estimatedDispatch, pdiOffset, 'PDI'));
      const pdi = parseLocalDate(result.pdi_date);
      const inspectionOffset = randomBetween(4, 10);
      result.internal_inspection_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(pdi, inspectionOffset, 'Internal Inspection'));
      const inspection = parseLocalDate(result.internal_inspection_date);
      result.curing_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(inspection, 2, 'Curing'));
      const curing = parseLocalDate(result.curing_date);
      result.green_belt_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt'));
      const greenBelt = parseLocalDate(result.green_belt_date);
      const calendaringOffset = randomBetween(0, 1);
      result.calendaring_date = toISODateOnly(
        calendaringOffset === 0
          ? greenBelt
          : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring')
      );
      const calendaring = parseLocalDate(result.calendaring_date);
      const coverCompoundOffset = randomBetween(7, 10);
      result.cover_compound_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound'));
      const coverCompound = parseLocalDate(result.cover_compound_date);
      const skimCompoundOffset = randomBetween(7, 10);
      let skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === result.cover_compound_date) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      result.skim_compound_date = toISODateOnly(skimCompound);
      break;
    }

    case 'pdiDate': {
      // Calculate dates backward from PDI (but not packaging or dispatch)
      const pdi = baseDate;
      result.pdi_date = toISODateOnly(pdi);
      const inspectionOffset = randomBetween(4, 10);
      result.internal_inspection_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(pdi, inspectionOffset, 'Internal Inspection'));
      const inspection = parseLocalDate(result.internal_inspection_date);
      result.curing_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(inspection, 2, 'Curing'));
      const curing = parseLocalDate(result.curing_date);
      result.green_belt_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt'));
      const greenBelt = parseLocalDate(result.green_belt_date);
      const calendaringOffset = randomBetween(0, 1);
      result.calendaring_date = toISODateOnly(
        calendaringOffset === 0
          ? greenBelt
          : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring')
      );
      const calendaring = parseLocalDate(result.calendaring_date);
      const coverCompoundOffset = randomBetween(7, 10);
      result.cover_compound_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound'));
      const coverCompound = parseLocalDate(result.cover_compound_date);
      const skimCompoundOffset = randomBetween(7, 10);
      let skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === result.cover_compound_date) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      result.skim_compound_date = toISODateOnly(skimCompound);
      break;
    }

    case 'inspectionDate': {
      // Calculate dates backward from inspection (but not PDI, packaging, or dispatch)
      const inspection = baseDate;
      result.internal_inspection_date = toISODateOnly(inspection);
      result.curing_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(inspection, 2, 'Curing'));
      const curing = parseLocalDate(result.curing_date);
      result.green_belt_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt'));
      const greenBelt = parseLocalDate(result.green_belt_date);
      const calendaringOffset = randomBetween(0, 1);
      result.calendaring_date = toISODateOnly(
        calendaringOffset === 0
          ? greenBelt
          : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring')
      );
      const calendaring = parseLocalDate(result.calendaring_date);
      const coverCompoundOffset = randomBetween(7, 10);
      result.cover_compound_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound'));
      const coverCompound = parseLocalDate(result.cover_compound_date);
      const skimCompoundOffset = randomBetween(7, 10);
      let skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === result.cover_compound_date) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      result.skim_compound_date = toISODateOnly(skimCompound);
      break;
    }

    case 'curingDate': {
      // Calculate dates backward from curing
      const curing = baseDate;
      result.curing_date = toISODateOnly(curing);
      result.green_belt_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(curing, 1, 'Green Belt'));
      const greenBelt = parseLocalDate(result.green_belt_date);
      const calendaringOffset = randomBetween(0, 1);
      result.calendaring_date = toISODateOnly(
        calendaringOffset === 0
          ? greenBelt
          : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring')
      );
      const calendaring = parseLocalDate(result.calendaring_date);
      const coverCompoundOffset = randomBetween(7, 10);
      result.cover_compound_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound'));
      const coverCompound = parseLocalDate(result.cover_compound_date);
      const skimCompoundOffset = randomBetween(7, 10);
      let skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === result.cover_compound_date) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      result.skim_compound_date = toISODateOnly(skimCompound);
      break;
    }

    case 'greenBeltDate': {
      // Calculate dates backward from green belt
      const greenBelt = baseDate;
      result.green_belt_date = toISODateOnly(greenBelt);
      const calendaringOffset = randomBetween(0, 1);
      result.calendaring_date = toISODateOnly(
        calendaringOffset === 0
          ? greenBelt
          : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1, 'Calendaring')
      );
      const calendaring = parseLocalDate(result.calendaring_date);
      const coverCompoundOffset = randomBetween(7, 10);
      result.cover_compound_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound'));
      const coverCompound = parseLocalDate(result.cover_compound_date);
      const skimCompoundOffset = randomBetween(7, 10);
      let skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === result.cover_compound_date) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      result.skim_compound_date = toISODateOnly(skimCompound);
      break;
    }

    case 'calendaringDate': {
      // Calculate dates backward from calendaring
      const calendaring = baseDate;
      result.calendaring_date = toISODateOnly(calendaring);
      const coverCompoundOffset = randomBetween(7, 10);
      result.cover_compound_date = toISODateOnly(dateMinusDaysSkippingHolidaysAndSundays(calendaring, coverCompoundOffset, 'Cover Compound'));
      const coverCompound = parseLocalDate(result.cover_compound_date);
      const skimCompoundOffset = randomBetween(7, 10);
      let skimCompound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, skimCompoundOffset, 'Skim Compound');
      if (toISODateOnly(skimCompound) === result.cover_compound_date) {
        skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound (adjusted)');
      }
      result.skim_compound_date = toISODateOnly(skimCompound);
      break;
    }

    case 'coverCompoundProducedOn': {
      // Only calculate skim compound (must be different date)
      const coverCompound = baseDate;
      result.cover_compound_date = toISODateOnly(coverCompound);
      // Skim compound should be on a different date, typically 1 working day before
      const skimCompound = dateMinusDaysSkippingHolidaysAndSundays(coverCompound, 1, 'Skim Compound');
      result.skim_compound_date = toISODateOnly(skimCompound);
      break;
    }

    case 'skimCompoundProducedOn': {
      // Only calculate cover compound (must be different date)
      const skimCompound = baseDate;
      result.skim_compound_date = toISODateOnly(skimCompound);
      // Cover compound should be on a different date, typically 1 working day after or before
      // Since we're going backward, we'll put cover compound 1 working day before skim
      const coverCompound = dateMinusDaysSkippingHolidaysAndSundays(skimCompound, 1, 'Cover Compound');
      result.cover_compound_date = toISODateOnly(coverCompound);
      break;
    }

    default:
      console.log('[Date Calculation] Unknown date field for backward calculation:', changedDateField);
      return {};
  }

  console.log('[Date Calculation] Backward-only calculated dates from', changedDateField, ':', result);
  return result;
}

/**
 * Validate date relationships according to the calculation rules.
 * Returns an object with validation errors for each date field.
 */
export function validateDateRelationships(dates: {
  dispatchDate?: Date | string;
  packagingDate?: Date | string;
  pdiDate?: Date | string;
  inspectionDate?: Date | string;
  curingDate?: Date | string;
  greenBeltDate?: Date | string;
  calendaringDate?: Date | string;
  coverCompoundProducedOn?: Date | string;
  skimCompoundProducedOn?: Date | string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  const toDate = (d: Date | string | undefined): Date | null => {
    if (!d) return null;
    return d instanceof Date ? d : new Date(d);
  };

  const dispatch = toDate(dates.dispatchDate);
  const packaging = toDate(dates.packagingDate);
  const pdi = toDate(dates.pdiDate);
  const inspection = toDate(dates.inspectionDate);
  const curing = toDate(dates.curingDate);
  const greenBelt = toDate(dates.greenBeltDate);
  const calendaring = toDate(dates.calendaringDate);
  const coverCompound = toDate(dates.coverCompoundProducedOn);
  const skimCompound = toDate(dates.skimCompoundProducedOn);

  if (!dispatch) return errors;

  // Validate Packaging: must be exactly 1 working day before dispatch
  if (packaging) {
    if (isWeekendOrHoliday(packaging)) {
      errors.packagingDate = 'Packaging date must be a working day';
    } else if (dispatch) {
      const days = countWorkingDays(packaging, dispatch);
      if (days !== 1) {
        errors.packagingDate = 'Packaging must be exactly 1 working day before dispatch';
      }
    }
  }

  // Validate PDI: must be 4-5 working days before dispatch
  if (pdi) {
    if (isWeekendOrHoliday(pdi)) {
      errors.pdiDate = 'PDI date must be a working day';
    } else if (dispatch) {
      const days = countWorkingDays(pdi, dispatch);
      if (days < 4 || days > 5) {
        errors.pdiDate = 'PDI must be 4-5 working days before dispatch';
      }
    }
  }

  // Validate Internal Inspection: must be 4-10 working days before PDI
  if (inspection && pdi) {
    if (isWeekendOrHoliday(inspection)) {
      errors.inspectionDate = 'Inspection date must be a working day';
    } else {
      const days = countWorkingDays(inspection, pdi);
      if (days < 4 || days > 10) {
        errors.inspectionDate = 'Inspection must be 4-10 working days before PDI';
      }
    }
  }

  // Validate Curing: must be exactly 2 working days before inspection
  if (curing && inspection) {
    if (isWeekendOrHoliday(curing)) {
      errors.curingDate = 'Curing date must be a working day';
    } else {
      const days = countWorkingDays(curing, inspection);
      if (days !== 2) {
        errors.curingDate = 'Curing must be exactly 2 working days before inspection';
      }
    }
  }

  // Validate Green Belt: must be exactly 1 working day before curing
  if (greenBelt && curing) {
    if (isWeekendOrHoliday(greenBelt)) {
      errors.greenBeltDate = 'Green Belt date must be a working day';
    } else {
      const days = countWorkingDays(greenBelt, curing);
      if (days !== 1) {
        errors.greenBeltDate = 'Green Belt must be exactly 1 working day before curing';
      }
    }
  }

  // Validate Calendaring: must be same day or 1 working day before green belt
  if (calendaring && greenBelt) {
    if (isWeekendOrHoliday(calendaring)) {
      errors.calendaringDate = 'Calendaring date must be a working day';
    } else {
      const days = countWorkingDays(calendaring, greenBelt);
      // Same day means 0 working days gap, or 1 working day before
      if (days < 0 || days > 1) {
        errors.calendaringDate = 'Calendaring must be same day or 1 working day before green belt';
      }
    }
  }

  // Validate Compound dates: cover and skim must be 7-10 working days before calendaring
  if (coverCompound && calendaring) {
    if (isWeekendOrHoliday(coverCompound)) {
      errors.coverCompoundProducedOn = 'Cover compound date must be a working day';
    } else {
      const days = countWorkingDays(coverCompound, calendaring);
      if (days < 7 || days > 10) {
        errors.coverCompoundProducedOn =
          'Cover compound must be 7-10 working days before calendaring';
      }
    }
  }

  if (skimCompound && calendaring) {
    if (isWeekendOrHoliday(skimCompound)) {
      errors.skimCompoundProducedOn = 'Skim compound date must be a working day';
    } else {
      // Skim should be 7-10 working days before calendaring
      const days = countWorkingDays(skimCompound, calendaring);
      if (days < 7 || days > 10) {
        errors.skimCompoundProducedOn = 'Skim compound must be 7-10 working days before calendaring';
      }
    }
  }

  // Validate that cover and skim compounds are on different dates
  if (coverCompound && skimCompound) {
    const coverDateStr = toISODateOnly(coverCompound);
    const skimDateStr = toISODateOnly(skimCompound);
    if (coverDateStr === skimDateStr) {
      errors.skimCompoundProducedOn = 'Skim compound must be produced on a different date than cover compound';
    }
  }

  return errors;
}
