// src/lib/belt-code-utils.ts
import { Belt, CompoundType } from './data';
import { formatDateString, parseDateString } from './date-utils';

/**
 * Generate a base belt code from date and compound type
 * Format: YYYYMMDD-COMPOUNDTYPE
 * Example: 20250212-M-24
 */
function generateBaseBeltCode(date: string, compoundType: CompoundType): string {
  const dateObj = parseDateString(date);
  const dateStr = formatDateString(dateObj).replace(/-/g, '');
  // Normalize compound type: replace spaces with underscores, keep hyphens and alphanumeric
  // Examples: "M-24" -> "M-24", "SHR T1" -> "SHR_T1", "SKIM_N" -> "SKIM_N"
  const normalizedType = compoundType.replace(/\s+/g, '_').replace(/[^A-Z0-9_-]/gi, '');
  return `${dateStr}-${normalizedType}`;
}

/**
 * Get all existing belt codes from a list of belts
 */
function getAllExistingBeltCodes(belts: Belt[], excludeBeltId?: string): Set<string> {
  const codes = new Set<string>();
  belts.forEach((belt) => {
    // Skip the current belt if we're updating
    if (excludeBeltId && belt.id === excludeBeltId) {
      return;
    }
    if (belt.compound?.coverBeltCode) {
      codes.add(belt.compound.coverBeltCode);
    }
    if (belt.compound?.skimBeltCode) {
      codes.add(belt.compound.skimBeltCode);
    }
  });
  return codes;
}

/**
 * Generate a unique belt code by appending a suffix if needed
 * Ensures no two codes are ever the same
 */
function generateUniqueBeltCode(
  baseCode: string,
  existingCodes: Set<string>,
  maxAttempts: number = 1000
): string {
  if (!existingCodes.has(baseCode)) {
    return baseCode;
  }

  // Try with suffix -001, -002, etc.
  for (let i = 1; i <= maxAttempts; i++) {
    const suffix = String(i).padStart(3, '0');
    const candidateCode = `${baseCode}-${suffix}`;
    if (!existingCodes.has(candidateCode)) {
      return candidateCode;
    }
  }

  // Fallback: use timestamp if we somehow exhaust all attempts
  return `${baseCode}-${Date.now()}`;
}

/**
 * Generate unique belt codes for cover and skim compounds
 * @param coverDate - Date string for cover compound production
 * @param coverType - Cover compound type
 * @param skimDate - Date string for skim compound production
 * @param skimType - Skim compound type
 * @param existingBelts - All existing belts to check for uniqueness
 * @param excludeBeltId - Optional belt ID to exclude from uniqueness check (for updates)
 * @returns Object with coverBeltCode and skimBeltCode
 */
export function generateBeltCodes(
  coverDate: string | undefined,
  coverType: CompoundType | undefined,
  skimDate: string | undefined,
  skimType: CompoundType | undefined,
  existingBelts: Belt[] = [],
  excludeBeltId?: string
): { coverBeltCode?: string; skimBeltCode?: string } {
  const existingCodes = getAllExistingBeltCodes(existingBelts, excludeBeltId);
  const result: { coverBeltCode?: string; skimBeltCode?: string } = {};

  // Generate cover belt code
  if (coverDate && coverType) {
    const baseCoverCode = generateBaseBeltCode(coverDate, coverType);
    result.coverBeltCode = generateUniqueBeltCode(baseCoverCode, existingCodes);
    // Add the generated code to existing codes to ensure cover and skim codes don't conflict
    existingCodes.add(result.coverBeltCode);
  }

  // Generate skim belt code
  if (skimDate && skimType) {
    const baseSkimCode = generateBaseBeltCode(skimDate, skimType);
    result.skimBeltCode = generateUniqueBeltCode(baseSkimCode, existingCodes);
    // Add to existing codes to prevent future conflicts
    existingCodes.add(result.skimBeltCode);
  }

  return result;
}
