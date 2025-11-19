// calculation.ts
// AI-READY SPEC MANUAL - calculation helpers
// (State-only utilities — no DB)

import { HOLIDAYS } from './data';

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
 * random_value = random_integer(80, 90)
 */
export function random_value_80_90() {
  return Math.floor(Math.random() * (90 - 80 + 1)) + 80;
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
function toISODateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function process_dates_from_dispatch(dispatchDateIso?: string) {
  if (!dispatchDateIso) return {};
  const dispatch = new Date(dispatchDateIso);

  // Helper function to generate a date offset by days from a base date,
  // skipping Sundays and holidays (going backwards in time)
  const dateMinusDaysSkippingHolidaysAndSundays = (baseDate: Date, days: number): Date => {
    const result = new Date(baseDate);
    let daysRemaining = days;

    while (daysRemaining > 0) {
      result.setDate(result.getDate() - 1);
      if (!isWeekendOrHoliday(result)) {
        daysRemaining--;
      }
    }

    return result;
  };

  // 1. Dispatch Date (input)
  // dispatch is already set

  // 2. Packaging: D − 1 day (fixed)
  const packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1);

  // 3. PDI: D − 4 to D − 5 days (random in range)
  const pdiOffset = randomBetween(4, 5);
  const pdi = dateMinusDaysSkippingHolidaysAndSundays(dispatch, pdiOffset);

  // 4. Internal Inspection: PDI − 4 to PDI − 10 days (random in range)
  const internalInspectionOffset = randomBetween(4, 10);
  const internalInspection = dateMinusDaysSkippingHolidaysAndSundays(pdi, internalInspectionOffset);

  // 5. Curing: Internal Inspection − 2 days (fixed)
  const curing = dateMinusDaysSkippingHolidaysAndSundays(internalInspection, 2);

  // 6. Green Belt: Curing − 1 day (fixed)
  const greenBelt = dateMinusDaysSkippingHolidaysAndSundays(curing, 1);

  // 7. Calendaring: Green Belt (same day) or Green Belt − 1 day (random)
  // Random: 0 or 1 day before green belt
  const calendaringOffset = randomBetween(0, 1);
  const calendaring =
    calendaringOffset === 0
      ? new Date(greenBelt) // Same day
      : dateMinusDaysSkippingHolidaysAndSundays(greenBelt, 1); // 1 day before

  // 8. Compound: Calendaring − 2 to Calendaring − 7 days (random in range)
  const compoundOffset = randomBetween(2, 7);
  const compound = dateMinusDaysSkippingHolidaysAndSundays(calendaring, compoundOffset);

  return {
    dispatch_date: toISODateOnly(dispatch),
    packaging_date: toISODateOnly(packaging),
    pdi_date: toISODateOnly(pdi),
    internal_inspection_date: toISODateOnly(internalInspection),
    curing_date: toISODateOnly(curing),
    green_belt_date: toISODateOnly(greenBelt),
    calendaring_date: toISODateOnly(calendaring),
    compound_date: toISODateOnly(compound),
  };
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
  if (!baseCompoundDate) return {};

  const baseDate = new Date(baseCompoundDate);
  const coverDate = new Date(baseDate);

  // Get the previous working day for skim compound (ensuring different day)
  const skimDate = new Date(baseDate);
  skimDate.setDate(skimDate.getDate() - 1);

  // Skip weekends and holidays to find the previous working day
  while (isWeekendOrHoliday(skimDate)) {
    skimDate.setDate(skimDate.getDate() - 1);
  }

  return {
    cover_compound_date: toISODateOnly(coverDate),
    skim_compound_date: toISODateOnly(skimDate),
  };
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

  if (start.getTime() === end.getTime()) return 0;

  let count = 0;
  const current = new Date(start);
  const direction = end >= start ? 1 : -1;

  // Move to the next/previous day first
  current.setDate(current.getDate() + direction);

  // Count working days until we reach the end date
  while (current.getTime() !== end.getTime()) {
    if (!isWeekendOrHoliday(current)) {
      count++;
    }
    current.setDate(current.getDate() + direction);
  }

  return count;
}

/**
 * Get the previous working day (skipping Sundays and holidays)
 */
export function getPreviousWorkingDay(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);
  while (isWeekendOrHoliday(result)) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}

/**
 * Get the next working day (skipping Sundays and holidays)
 */
export function getNextWorkingDay(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  while (isWeekendOrHoliday(result)) {
    result.setDate(result.getDate() + 1);
  }
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

  // Validate Compound dates: cover and skim must be 2-7 working days before calendaring
  if (coverCompound && calendaring) {
    if (isWeekendOrHoliday(coverCompound)) {
      errors.coverCompoundProducedOn = 'Cover compound date must be a working day';
    } else {
      const days = countWorkingDays(coverCompound, calendaring);
      if (days < 2 || days > 7) {
        errors.coverCompoundProducedOn = 'Cover compound must be 2-7 working days before calendaring';
      }
    }
  }

  if (skimCompound && coverCompound) {
    if (isWeekendOrHoliday(skimCompound)) {
      errors.skimCompoundProducedOn = 'Skim compound date must be a working day';
    } else {
      // Skim should be 1 working day before cover compound
      const days = countWorkingDays(skimCompound, coverCompound);
      if (days !== 1) {
        errors.skimCompoundProducedOn = 'Skim compound must be 1 working day before cover compound';
      }
    }
  }

  return errors;
}
