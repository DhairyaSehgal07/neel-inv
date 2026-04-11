/**
 * Compound utility functions for batch management
 */

import { addDays, format, parseISO, subMonths } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import RawMaterial from '@/model/RawMaterial';
import { random_value_100_110 } from './calculations';

export interface MaterialUsedResolved {
  materialName: string;
  materialCode: string;
}

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
 * Get random batch count between 110 and 120
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

/**
 * Calculate date range for material code lookup
 * @param productionDate - Production date in YYYY-MM-DD format
 * @param monthsBack - Number of months to look back from production date (default: 3)
 * @returns { startDate, endDate } in YYYY-MM-DD format
 */
export function getMaterialCodeDateRange(productionDate: string, monthsBack: number = 3): { startDate: string; endDate: string } {
  const prodDate = parseISO(productionDate + 'T00:00:00');

  // monthsBack months before (start of range)
  const startDate = subMonths(prodDate, monthsBack);
  // Production date (end of range - inclusive)
  const endDate = prodDate;

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  };
}

/** Number of months to look back from production date for material code matching (3–4 months). */
const MATERIAL_LOOKBACK_MONTHS = 4;

/**
 * Resolve material codes for a list of raw material names using DB-level $sample.
 * Window: 4 months before producedOn (single query per material for performance).
 * Used by CompoundBatch pre-save and by the randomize-materials API.
 * @param rawMaterials - Material names from CompoundMaster
 * @param productionDate - YYYY-MM-DD (coverCompoundProducedOn, skimCompoundProducedOn, or date)
 * @returns Array of { materialName, materialCode }
 */
export async function resolveMaterialsUsed(
  rawMaterials: string[],
  productionDate: string
): Promise<MaterialUsedResolved[]> {
  const materialsUsed: MaterialUsedResolved[] = [];
  const { startDate, endDate } = getMaterialCodeDateRange(productionDate, MATERIAL_LOOKBACK_MONTHS);

  for (const materialName of rawMaterials) {
    const normalizedName = materialName.trim().toLowerCase();
    const regexEscaped = materialName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexExact = new RegExp(`^${regexEscaped}$`, 'i');

    const nameMatch = {
      $or: [
        { rawMaterialNormalized: normalizedName },
        { rawMaterial: { $regex: regexExact.source, $options: 'i' } },
      ],
    };

    // Single window: 4 months before producedOn
    const sampled = await RawMaterial.aggregate<{ materialCode: string }>([
      {
        $match: {
          ...nameMatch,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $sample: { size: 1 } },
      { $project: { materialCode: 1, _id: 0 } },
    ]);

    let materialCode = sampled.length > 0 ? (sampled[0].materialCode || '') : '';

    if (!materialCode) {
      const fallback = await RawMaterial.aggregate<{ materialCode: string }>([
        { $match: nameMatch },
        { $sample: { size: 1 } },
        { $project: { materialCode: 1, _id: 0 } },
      ]);
      materialCode = fallback.length > 0 ? (fallback[0].materialCode || '') : '';
    }

    materialsUsed.push({
      materialName,
      materialCode,
    });
  }

  return materialsUsed;
}

/**
 * Validates explicit materialsUsed rows from API payloads (create/update compound batch).
 * Stored as in MongoDB: `{ materialName, materialCode }` per item only (no catalog lookup).
 */
export function validateMaterialsUsedPayload(
  entries: unknown
): { ok: true; materialsUsed: MaterialUsedResolved[] } | { ok: false; message: string } {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { ok: false, message: 'materialsUsed must be a non-empty array' };
  }
  const materialsUsed: MaterialUsedResolved[] = [];
  for (const item of entries) {
    if (!item || typeof item !== 'object') {
      return { ok: false, message: 'Each material entry must be an object' };
    }
    const rec = item as { materialName?: unknown; materialCode?: unknown };
    const materialName = String(rec.materialName ?? '').trim();
    const materialCode = String(rec.materialCode ?? '').trim();
    if (!materialName || !materialCode) {
      return { ok: false, message: 'Each material entry must include materialName and materialCode' };
    }
    materialsUsed.push({ materialName, materialCode });
  }
  return { ok: true, materialsUsed };
}
