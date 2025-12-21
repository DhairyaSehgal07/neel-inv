/**
 * Compound utility functions for batch management
 */

import { addDays, format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { random_value_100_110 } from './calculations';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format a Date object to YYYY-MM-DD string in India timezone
 */
export function formatLocalDate(date: Date): string {
  const zonedDate = toZonedTime(date, IST_TIMEZONE);
  return format(zonedDate, 'yyyy-MM-dd');
}

/**
 * Add days to a date string (YYYY-MM-DD) and return YYYY-MM-DD
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const date = parseISO(dateStr + 'T00:00:00');
  const newDate = addDays(date, days);
  return format(newDate, 'yyyy-MM-dd');
}

/**
 * Check if error is MongoDB duplicate key error (E11000)
 */
export function isDuplicateKeyError(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: number }).code === 11000
  );
}

/**
 * Check if duplicate key error is for a specific field
 */
export function isDuplicateKeyErrorForField(err: unknown, field: string): boolean {
  if (!isDuplicateKeyError(err)) return false;
  const error = err as { keyPattern?: Record<string, number> };
  return error.keyPattern?.[field] !== undefined;
}

/**
 * Get random batch count between 80 and 90
 */
export function getRandomBatchCount(): number {
  return random_value_100_110();
}

/**
 * Convert CompoundType name (e.g., "Nk-5") to compoundCode (e.g., "nk5")
 * Handles various formats: "Nk-5" -> "nk5", "NK-8" -> "nk8", "nk1" -> "nk1"
 */
export function compoundNameToCode(name: string): string {
  if (!name) return '';
  // Remove hyphens and convert to lowercase
  return name.replace(/-/g, '').toLowerCase();
}

/**
 * Sleep utility for retry logic
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
