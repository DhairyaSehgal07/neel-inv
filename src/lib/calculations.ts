// calculation.ts
// AI-READY SPEC MANUAL - calculation helpers
// (State-only utilities — no DB)

import { HOLIDAYS } from './data';

export type CompoundKey =
  | 'nk-1'
  | 'nk-2'
  | 'nk-3'
  | 'nk-4'
  | 'nk-5'
  | 'nk-6'
  | 'nk-7'
  | 'nk-8'
  | 'nk-9'
  | 'nk-10'
  | 'nk-11'
  | 'nk-12'
  | 'nk-13';

export const DEFAULT_COMPOUND_SG: Record<CompoundKey, number> = {
  'nk-1': 1.2,
  'nk-2': 1.1,
  'nk-3': 1.22,
  'nk-4': 1.18,
  'nk-5': 1.12,
  'nk-6': 1.21,
  'nk-7': 1.19,
  'nk-8': 1.14,
  'nk-9': 1.15,
  'nk-10': 1.16,
  'nk-11': 1.23,
  'nk-12': 1.17,
  'nk-13': 1.13,
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
function isWeekendOrHoliday(date: Date): boolean {
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
  if (compound === 'nk-8' || compound === 'nk-9' || compound === 'nk-10') return 120;
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
 * compute earlier dates using the specified ranges:
 *
 * Given a Dispatch Date (D):
 * - Packaging: D − 1
 * - PDI: D − 5 to D − 4 (random in range)
 * - Internal Inspection: D − 15 to D − 8 (random in range)
 * - Curing: D − 17 to D − 10 (random in range)
 * - Green Belt: D − 18 to D − 11 (random in range)
 * - Calendaring: D − 19 to D − 11 (random in range)
 * - Compound Production: D − 26 to D − 13 (random in range)
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
  // skipping Sundays and holidays
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

  // 1. Packaging: D − 1 (fixed)
  const packaging = dateMinusDaysSkippingHolidaysAndSundays(dispatch, 1);

  // 2. PDI: D − 5 to D − 4 (random in range)
  const pdiOffset = randomBetween(4, 5);
  const pdi = dateMinusDaysSkippingHolidaysAndSundays(dispatch, pdiOffset);

  // 3. Internal Inspection: D − 15 to D − 8 (random in range)
  const internalInspectionOffset = randomBetween(8, 15);
  const internalInspection = dateMinusDaysSkippingHolidaysAndSundays(
    dispatch,
    internalInspectionOffset
  );

  // 4. Curing: D − 17 to D − 10 (random in range)
  const curingOffset = randomBetween(10, 17);
  const curing = dateMinusDaysSkippingHolidaysAndSundays(dispatch, curingOffset);

  // 5. Green Belt: D − 18 to D − 11 (random in range)
  const greenBeltOffset = randomBetween(11, 18);
  const greenBelt = dateMinusDaysSkippingHolidaysAndSundays(dispatch, greenBeltOffset);

  // 6. Calendaring: D − 19 to D − 11 (random in range)
  const calendaringOffset = randomBetween(11, 19);
  const calendaring = dateMinusDaysSkippingHolidaysAndSundays(dispatch, calendaringOffset);

  // 7. Compound Production: D − 26 to D − 13 (random in range)
  const compoundOffset = randomBetween(13, 26);
  const compound = dateMinusDaysSkippingHolidaysAndSundays(dispatch, compoundOffset);

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
