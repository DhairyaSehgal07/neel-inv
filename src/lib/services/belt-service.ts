/**
 * Belt Service - Orchestrates belt creation with compound consumption
 */

import mongoose, { ClientSession } from 'mongoose';
import Belt, { BeltDoc } from '@/model/Belt';
import BeltHistory from '@/model/BeltHistory';
import Fabric, { FabricDoc } from '@/model/Fabric';
import CompoundMaster from '@/model/CompoundMaster';
import { consumeCompound, revertCompoundConsumption } from './compound-service';
import { compoundNameToCode, formatLocalDate } from '@/lib/helpers/compound-utils';
import { BeltFormData } from '@/types/belt';
import CompoundBatch from '@/model/CompoundBatch';
import { roundTo2Decimals } from '@/lib/utils';
import { getPreviousWorkingDay, getNextWorkingDay, isWeekendOrHoliday } from '@/lib/helpers/calculations';

export interface CreateBeltPayload {
  formData: BeltFormData;
  coverCompoundCode?: string;
  skimCompoundCode?: string;
  coverConsumedKg: number;
  skimConsumedKg: number;
  calendaringDate?: string;
}

/**
 * Ensure fabric record exists or create a new one
 */
async function ensureFabric(
  fabricData: {
    type: string;
    rating?: string;
    strength?: number;
    supplier?: string;
    rollNumber?: string;
    consumedMeters?: number;
  },
  session?: ClientSession
): Promise<mongoose.Types.ObjectId> {
  if (!fabricData.type) {
    throw new Error('Fabric type is required');
  }

  // Try to find existing fabric by rollNumber if provided
  if (fabricData.rollNumber) {
    const findQuery = Fabric.findOne({ rollNumber: fabricData.rollNumber });
    if (session) {
      findQuery.session(session);
    }
    const existing = await findQuery.exec();

    if (existing) {
      // Update consumed meters if provided
      if (fabricData.consumedMeters !== undefined) {
        const updateQuery = Fabric.findByIdAndUpdate(
          existing._id,
          { $inc: { consumedMeters: fabricData.consumedMeters } },
          { new: true }
        );
        if (session) {
          updateQuery.session(session);
        }
        await updateQuery.exec();
      }
      return existing._id as mongoose.Types.ObjectId;
    }
  }

  // Create new fabric
  const fabricPayload: Partial<FabricDoc> = {
    type: fabricData.type as 'EP' | 'NN' | 'EE' | 'Other',
    rating: fabricData.rating,
    strength: fabricData.strength,
    supplier: fabricData.supplier,
    rollNumber: fabricData.rollNumber,
    consumedMeters: fabricData.consumedMeters || 0,
  };

  const createOptions = session ? { session } : {};
  const created = await Fabric.create([fabricPayload], createOptions);
  return created[0]._id as mongoose.Types.ObjectId;
}

/**
 * Get compound code from CompoundMaster name
 * First tries to find CompoundMaster, then returns its compoundCode
 */
async function getCompoundCode(compoundTypeName: string, session?: ClientSession): Promise<string> {
  if (!compoundTypeName) {
    throw new Error('Compound name is required');
  }

  // Try to find CompoundMaster by compoundName
  const findQuery = CompoundMaster.findOne({ compoundName: compoundTypeName });
  if (session) {
    findQuery.session(session);
  }
  const compoundMaster = await findQuery.exec();

  if (compoundMaster) {
    // Return the compoundCode directly from CompoundMaster
    return compoundMaster.compoundCode;
  }

  // Fallback: convert the provided name directly to code (e.g., "Nk-5" -> "nk5")
  return compoundNameToCode(compoundTypeName);
}

/**
 * Check if a compound production date is already used by any other belt
 * @param date - Date string in YYYY-MM-DD format
 * @param excludeBeltId - Optional belt ID to exclude from the check (for updates)
 * @param session - Optional MongoDB session
 * @returns true if the date is already used, false otherwise
 */
async function isCompoundDateUsed(
  date: string,
  excludeBeltId?: mongoose.Types.ObjectId,
  session?: ClientSession
): Promise<boolean> {
  if (!date) return false;

  const query: mongoose.FilterQuery<BeltDoc> = {
    $or: [
      { 'process.coverCompoundProducedOn': date },
      { 'process.skimCompoundProducedOn': date },
    ],
  };

  if (excludeBeltId) {
    query._id = { $ne: excludeBeltId };
  }

  const findQuery = Belt.findOne(query);
  if (session) {
    findQuery.session(session);
  }

  const existingBelt = await findQuery.exec();
  return !!existingBelt;
}

/**
 * Find the next available working day for a compound that doesn't conflict with existing belts
 * @param preferredDate - Preferred date string in YYYY-MM-DD format
 * @param excludeBeltId - Optional belt ID to exclude from the check (for updates)
 * @param session - Optional MongoDB session
 * @returns Available date string in YYYY-MM-DD format
 */
async function findAvailableCompoundDate(
  preferredDate: string,
  excludeBeltId?: mongoose.Types.ObjectId,
  session?: ClientSession
): Promise<string> {
  let candidateDate = new Date(preferredDate);
  let attempts = 0;
  const maxAttempts = 365; // Prevent infinite loop

  while (attempts < maxAttempts) {
    // Ensure it's a working day
    while (isWeekendOrHoliday(candidateDate)) {
      candidateDate = getNextWorkingDay(candidateDate);
    }

    const dateStr = formatLocalDate(candidateDate);
    const isUsed = await isCompoundDateUsed(dateStr, excludeBeltId, session);

    if (!isUsed) {
      return dateStr;
    }

    // Try next working day
    candidateDate = getNextWorkingDay(candidateDate);
    attempts++;
  }

  throw new Error('Could not find available compound production date within reasonable range');
}

/**
 * Ensure cover and skim compound dates are on separate working days
 * If dates conflict with existing belts or each other, automatically assign separate dates
 * @param coverDate - Cover compound date string in YYYY-MM-DD format (can be undefined)
 * @param skimDate - Skim compound date string in YYYY-MM-DD format (can be undefined)
 * @param excludeBeltId - Optional belt ID to exclude from the check (for updates)
 * @param session - Optional MongoDB session
 * @returns Object with adjusted coverDate and skimDate
 */
export async function ensureSeparateCompoundDates(
  coverDate: string | undefined,
  skimDate: string | undefined,
  excludeBeltId?: mongoose.Types.ObjectId,
  session?: ClientSession
): Promise<{ coverDate: string | undefined; skimDate: string | undefined }> {
  // If neither date is provided, return undefined
  if (!coverDate && !skimDate) {
    return { coverDate: undefined, skimDate: undefined };
  }

  // If only one date is provided, ensure it's available and is a working day
  if (coverDate && !skimDate) {
    // Ensure it's a working day
    let coverDateObj = new Date(coverDate);
    while (isWeekendOrHoliday(coverDateObj)) {
      coverDateObj = getNextWorkingDay(coverDateObj);
    }
    coverDate = formatLocalDate(coverDateObj);

    const isCoverUsed = await isCompoundDateUsed(coverDate, excludeBeltId, session);
    if (isCoverUsed) {
      coverDate = await findAvailableCompoundDate(coverDate, excludeBeltId, session);
    }
    return { coverDate, skimDate: undefined };
  }

  if (skimDate && !coverDate) {
    // Ensure it's a working day
    let skimDateObj = new Date(skimDate);
    while (isWeekendOrHoliday(skimDateObj)) {
      skimDateObj = getNextWorkingDay(skimDateObj);
    }
    skimDate = formatLocalDate(skimDateObj);

    const isSkimUsed = await isCompoundDateUsed(skimDate, excludeBeltId, session);
    if (isSkimUsed) {
      skimDate = await findAvailableCompoundDate(skimDate, excludeBeltId, session);
    }
    return { coverDate: undefined, skimDate };
  }

  // Both dates are provided - ensure they're different and available
  if (coverDate && skimDate) {
    // Ensure both dates are working days
    let coverDateObj = new Date(coverDate);
    let skimDateObj = new Date(skimDate);

    // Adjust to working days if needed
    while (isWeekendOrHoliday(coverDateObj)) {
      coverDateObj = getNextWorkingDay(coverDateObj);
    }
    coverDate = formatLocalDate(coverDateObj);

    while (isWeekendOrHoliday(skimDateObj)) {
      skimDateObj = getNextWorkingDay(skimDateObj);
    }
    skimDate = formatLocalDate(skimDateObj);

    // First, check if dates are the same
    if (coverDate === skimDate) {
      // Assign cover to preferred date, skim to previous working day
      skimDateObj = getPreviousWorkingDay(coverDateObj);
      skimDate = formatLocalDate(skimDateObj);
    }

    // Check if cover date is used
    const isCoverUsed = await isCompoundDateUsed(coverDate, excludeBeltId, session);
    if (isCoverUsed) {
      coverDate = await findAvailableCompoundDate(coverDate, excludeBeltId, session);
      // Re-check skim date after cover date adjustment
      if (coverDate === skimDate) {
        const coverDateObj = new Date(coverDate);
        const skimDateObj = getPreviousWorkingDay(coverDateObj);
        skimDate = formatLocalDate(skimDateObj);
      }
    }

    // Check if skim date is used
    const isSkimUsed = await isCompoundDateUsed(skimDate, excludeBeltId, session);
    if (isSkimUsed) {
      skimDate = await findAvailableCompoundDate(skimDate, excludeBeltId, session);
      // Re-check cover date after skim date adjustment
      if (coverDate === skimDate) {
        const skimDateObj = new Date(skimDate);
        const coverDateObj = getNextWorkingDay(skimDateObj);
        coverDate = formatLocalDate(coverDateObj);
        // Verify cover date is not used
        const isNewCoverUsed = await isCompoundDateUsed(coverDate, excludeBeltId, session);
        if (isNewCoverUsed) {
          coverDate = await findAvailableCompoundDate(coverDate, excludeBeltId, session);
        }
      }
    }

    // Final check: ensure they're still different (critical requirement)
    if (coverDate === skimDate) {
      // If they're still the same, force separation
      const coverDateObj = new Date(coverDate);
      let skimDateObj = getPreviousWorkingDay(coverDateObj);
      let newSkimDate = formatLocalDate(skimDateObj);

      // Check if the previous working day is available and not used
      let attempts = 0;
      while ((await isCompoundDateUsed(newSkimDate, excludeBeltId, session) || newSkimDate === coverDate) && attempts < 20) {
        skimDateObj = getPreviousWorkingDay(skimDateObj);
        newSkimDate = formatLocalDate(skimDateObj);
        attempts++;
      }

      if (attempts >= 20 || newSkimDate === coverDate) {
        // If previous days are all taken, try next working day for cover
        let newCoverDateObj = getNextWorkingDay(coverDateObj);
        let newCoverDate = formatLocalDate(newCoverDateObj);
        let coverAttempts = 0;

        // Find an available cover date
        while ((await isCompoundDateUsed(newCoverDate, excludeBeltId, session) || newCoverDate === skimDate) && coverAttempts < 20) {
          newCoverDateObj = getNextWorkingDay(newCoverDateObj);
          newCoverDate = formatLocalDate(newCoverDateObj);
          coverAttempts++;
        }

        if (coverAttempts >= 20) {
          throw new Error('Unable to assign separate working days for cover and skim compounds. Please try different dates.');
        }

        coverDate = newCoverDate;
        // Now set skim to previous working day of the new cover date
        skimDateObj = getPreviousWorkingDay(new Date(coverDate));
        newSkimDate = formatLocalDate(skimDateObj);

        // Verify skim date is available
        attempts = 0;
        while ((await isCompoundDateUsed(newSkimDate, excludeBeltId, session) || newSkimDate === coverDate) && attempts < 20) {
          skimDateObj = getPreviousWorkingDay(skimDateObj);
          newSkimDate = formatLocalDate(skimDateObj);
          attempts++;
        }

        if (attempts >= 20 || newSkimDate === coverDate) {
          throw new Error('Unable to assign separate working days for cover and skim compounds. Please try different dates.');
        }

        skimDate = newSkimDate;
      } else {
        skimDate = newSkimDate;
      }
    }

    // One more final verification - this should never happen, but just in case
    if (coverDate === skimDate) {
      throw new Error('Unable to assign separate working days for cover and skim compounds. Please try different dates.');
    }

    return { coverDate, skimDate };
  }

  return { coverDate, skimDate };
}

/**
 * Create a new belt with compound consumption
 */
export async function createBelt(
  payload: CreateBeltPayload,
  session?: ClientSession
): Promise<BeltDoc> {
  const {
    formData,
    coverCompoundCode,
    skimCompoundCode,
    coverConsumedKg,
    skimConsumedKg,
    calendaringDate,
  } = payload;

  // Determine preferred date for batch generation (use calendaringDate or today)
  const preferredDate = calendaringDate
    ? formatLocalDate(new Date(calendaringDate))
    : formatLocalDate(new Date());

  // Get compound codes
  let coverCode = coverCompoundCode;
  let skimCode = skimCompoundCode;

  if (!coverCode && formData.coverCompoundType) {
    coverCode = await getCompoundCode(formData.coverCompoundType, session);
  }

  if (!skimCode && formData.skimCompoundType) {
    skimCode = await getCompoundCode(formData.skimCompoundType, session);
  }

  if (!coverCode) {
    throw new Error('Cover compound code is required');
  }

  if (!skimCode) {
    throw new Error('Skim compound code is required');
  }

  // Parse fabric consumed (can be number or string)
  const fabricConsumedMeters =
    typeof formData.fabricConsumed === 'number'
      ? formData.fabricConsumed
      : typeof formData.fabricConsumed === 'string'
        ? parseFloat(formData.fabricConsumed)
        : undefined;

  // Ensure/Create Fabric record
  const fabricId = await ensureFabric(
    {
      type: formData.fabricType,
      rating: formData.rating,
      strength: typeof formData.beltStrength === 'number' ? formData.beltStrength : undefined,
      supplier: formData.fabricSupplier,
      rollNumber: formData.rollNumber,
      consumedMeters: fabricConsumedMeters !== undefined && !isNaN(fabricConsumedMeters) ? fabricConsumedMeters : undefined,
    },
    session
  );

  // Format producedOn dates if provided and ensure they're on separate working days
  const coverProducedOnRaw = formData.coverCompoundProducedOn
    ? formatLocalDate(
        formData.coverCompoundProducedOn instanceof Date
          ? formData.coverCompoundProducedOn
          : new Date(formData.coverCompoundProducedOn)
      )
    : undefined;

  const skimProducedOnRaw = formData.skimCompoundProducedOn
    ? formatLocalDate(
        formData.skimCompoundProducedOn instanceof Date
          ? formData.skimCompoundProducedOn
          : new Date(formData.skimCompoundProducedOn)
      )
    : undefined;

  // Ensure cover and skim compounds are on separate working days and don't conflict with existing belts
  const { coverDate: coverProducedOn, skimDate: skimProducedOn } =
    await ensureSeparateCompoundDates(coverProducedOnRaw, skimProducedOnRaw, undefined, session);

  // Consume cover compound
  const coverUsage = await consumeCompound(
    coverCode,
    coverConsumedKg,
    preferredDate,
    session,
    coverProducedOn,
    'cover'
  );

  // Consume skim compound
  const skimUsage = await consumeCompound(
    skimCode,
    skimConsumedKg,
    preferredDate,
    session,
    skimProducedOn,
    'skim'
  );

  // Helper function to parse number from string or number
  const parseNumber = (value: number | string | undefined): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };

  // Prepare belt data
  const beltData: Partial<BeltDoc> = {
    beltNumber: formData.beltNumber,
    rating: formData.rating,
    fabricId,
    topCoverMm: parseNumber(formData.topCover),
    bottomCoverMm: parseNumber(formData.bottomCover),
    beltLengthM: parseNumber(formData.beltLength),
    beltWidthMm: parseNumber(formData.beltWidth),
    edge: formData.edge as 'Cut' | 'Moulded' | undefined,
    breakerPly: formData.breakerPly,
    breakerPlyRemarks: formData.breakerPlyRemarks,
    carcassMm: parseNumber(formData.carcass),
    coverGrade: formData.coverGrade,
    orderNumber: formData.orderNumber,
    buyerName: formData.buyerName,
    orderDate: formData.orderDate ? formatLocalDate(formData.orderDate) : undefined,
    deliveryDeadline: formData.deliveryDeadline
      ? formatLocalDate(formData.deliveryDeadline)
      : undefined,
    process: {
      calendaringDate: formData.calendaringDate
        ? formatLocalDate(formData.calendaringDate)
        : undefined,
      calendaringMachine: formData.calendaringStation,
      greenBeltDate: formData.greenBeltDate ? formatLocalDate(formData.greenBeltDate) : undefined,
      greenBeltMachine: formData.greenBeltStation,
      curingDate: formData.curingDate ? formatLocalDate(formData.curingDate) : undefined,
      curingMachine: formData.pressStation,
      inspectionDate: formData.inspectionDate
        ? formatLocalDate(formData.inspectionDate)
        : undefined,
      inspectionMachine: formData.inspectionStation,
      pidDate: formData.pdiDate ? formatLocalDate(formData.pdiDate) : undefined,
      packagingDate: formData.packagingDate ? formatLocalDate(formData.packagingDate) : undefined,
      dispatchDate: formData.dispatchDate ? formatLocalDate(formData.dispatchDate) : undefined,
      coverCompoundProducedOn: coverProducedOn,
      skimCompoundProducedOn: skimProducedOn,
    },
    coverBatchesUsed: coverUsage.batchesUsed,
    skimBatchesUsed: skimUsage.batchesUsed,
    status: (formData.status as 'Dispatched' | 'In Production') || 'In Production',
    entryType: 'Auto',
  };

  // Create Belt document
  const createOptions = session ? { session } : {};
  const created = await Belt.create([beltData], createOptions);
  const belt = created[0];

  // Create BeltHistory snapshot
  const historyData = {
    beltId: belt._id,
    beltNumber: belt.beltNumber,
    rating: belt.rating,
    fabricId: belt.fabricId,
    coverBatchesUsed: belt.coverBatchesUsed,
    skimBatchesUsed: belt.skimBatchesUsed,
  };

  await BeltHistory.create([historyData], createOptions);

  return belt;
}

export interface UpdateBeltWithQuantitiesPayload {
  beltId: mongoose.Types.ObjectId;
  formData: Partial<BeltFormData>;
  coverCompoundCode?: string;
  skimCompoundCode?: string;
  coverConsumedKg?: number;
  skimConsumedKg?: number;
  calendaringDate?: string;
}

/**
 * Update belt with compound consumption handling
 * This function ensures FIFO consistency by:
 * 1. Reverting old consumption from batches
 * 2. Finding all subsequent belts that use the same compounds
 * 3. Reverting their consumption
 * 4. Re-consuming for the updated belt
 * 5. Re-consuming for all subsequent belts in order
 */
export async function updateBeltWithQuantities(
  payload: UpdateBeltWithQuantitiesPayload,
  session?: ClientSession
): Promise<BeltDoc> {
  const {
    beltId,
    formData,
    coverCompoundCode,
    skimCompoundCode,
    coverConsumedKg,
    skimConsumedKg,
    calendaringDate,
  } = payload;

  // Get existing belt
  const findQuery = Belt.findById(beltId);
  if (session) {
    findQuery.session(session);
  }
  const existingBelt = await findQuery.exec();

  if (!existingBelt) {
    throw new Error('Belt not found');
  }

  // Calculate old quantities from existing batches
  const oldCoverConsumed = existingBelt.coverBatchesUsed?.reduce(
    (sum, batch) => sum + batch.consumedKg,
    0
  ) || 0;
  const oldSkimConsumed = existingBelt.skimBatchesUsed?.reduce(
    (sum, batch) => sum + batch.consumedKg,
    0
  ) || 0;

  // Parse new quantities
  const newCoverConsumed = coverConsumedKg !== undefined
    ? roundTo2Decimals(coverConsumedKg)
    : oldCoverConsumed;
  const newSkimConsumed = skimConsumedKg !== undefined
    ? roundTo2Decimals(skimConsumedKg)
    : oldSkimConsumed;

  // Get old compound codes from existing batches
  let oldCoverCode: string | undefined;
  let oldSkimCode: string | undefined;

  if (existingBelt.coverBatchesUsed && existingBelt.coverBatchesUsed.length > 0) {
    const firstCoverBatch = await CompoundBatch.findById(existingBelt.coverBatchesUsed[0].batchId).session(session || null);
    if (firstCoverBatch) {
      oldCoverCode = firstCoverBatch.compoundCode;
    }
  }

  if (existingBelt.skimBatchesUsed && existingBelt.skimBatchesUsed.length > 0) {
    const firstSkimBatch = await CompoundBatch.findById(existingBelt.skimBatchesUsed[0].batchId).session(session || null);
    if (firstSkimBatch) {
      oldSkimCode = firstSkimBatch.compoundCode;
    }
  }

  // Get new compound codes
  let coverCode = coverCompoundCode;
  let skimCode = skimCompoundCode;

  if (!coverCode && formData.coverCompoundType) {
    coverCode = await getCompoundCode(formData.coverCompoundType, session);
  } else if (!coverCode) {
    coverCode = oldCoverCode; // Use old code if no new one provided
  }

  if (!skimCode && formData.skimCompoundType) {
    skimCode = await getCompoundCode(formData.skimCompoundType, session);
  } else if (!skimCode) {
    skimCode = oldSkimCode; // Use old code if no new one provided
  }

  if (!coverCode) {
    throw new Error('Cover compound code is required');
  }

  if (!skimCode) {
    throw new Error('Skim compound code is required');
  }

  // Check if quantities changed
  const coverQuantityChanged = Math.abs(newCoverConsumed - oldCoverConsumed) > 0.01;
  const skimQuantityChanged = Math.abs(newSkimConsumed - oldSkimConsumed) > 0.01;
  const compoundCodeChanged =
    (oldCoverCode && coverCode !== oldCoverCode) ||
    (oldSkimCode && skimCode !== oldSkimCode);

  const quantitiesChanged = coverQuantityChanged || skimQuantityChanged || compoundCodeChanged;

  // Declare usage variables outside the if block so they can be used later
  let coverUsage: { totalConsumed: number; batchesUsed: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }> } | undefined;
  let skimUsage: { totalConsumed: number; batchesUsed: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }> } | undefined;

  // Validate and ensure separate compound dates (regardless of whether quantities changed)
  const coverProducedOnRaw = formData.coverCompoundProducedOn
    ? formatLocalDate(
        formData.coverCompoundProducedOn instanceof Date
          ? formData.coverCompoundProducedOn
          : new Date(formData.coverCompoundProducedOn)
      )
    : undefined;

  const skimProducedOnRaw = formData.skimCompoundProducedOn
    ? formatLocalDate(
        formData.skimCompoundProducedOn instanceof Date
          ? formData.skimCompoundProducedOn
          : new Date(formData.skimCompoundProducedOn)
      )
    : undefined;

  // Ensure cover and skim compounds are on separate working days and don't conflict with existing belts
  const { coverDate: coverProducedOn, skimDate: skimProducedOn } =
    await ensureSeparateCompoundDates(coverProducedOnRaw, skimProducedOnRaw, beltId, session);

  if (quantitiesChanged) {
    // Step 1: Revert old consumption from batches
    if (existingBelt.coverBatchesUsed && existingBelt.coverBatchesUsed.length > 0) {
      await revertCompoundConsumption(
        existingBelt.coverBatchesUsed.map(b => ({
          batchId: b.batchId as mongoose.Types.ObjectId,
          consumedKg: b.consumedKg,
        })),
        session
      );
    }

    if (existingBelt.skimBatchesUsed && existingBelt.skimBatchesUsed.length > 0) {
      await revertCompoundConsumption(
        existingBelt.skimBatchesUsed.map(b => ({
          batchId: b.batchId as mongoose.Types.ObjectId,
          consumedKg: b.consumedKg,
        })),
        session
      );
    }

    // Step 2: Find all subsequent belts (created after this belt) that use the same compounds
    // We need to find belts that use either the old or new compound codes
    const compoundsToCheck = new Set<string>();
    if (oldCoverCode) compoundsToCheck.add(oldCoverCode);
    if (coverCode) compoundsToCheck.add(coverCode);
    if (oldSkimCode) compoundsToCheck.add(oldSkimCode);
    if (skimCode) compoundsToCheck.add(skimCode);

    const subsequentBeltsQuery = Belt.find({
      _id: { $ne: beltId },
      createdAt: { $gte: existingBelt.createdAt },
      $or: [
        { 'coverBatchesUsed.batchId': { $exists: true, $ne: [] } },
        { 'skimBatchesUsed.batchId': { $exists: true, $ne: [] } },
      ],
    }).sort({ createdAt: 1 }); // Sort by creation date ascending

    if (session) {
      subsequentBeltsQuery.session(session);
    }

    const subsequentBelts = await subsequentBeltsQuery.exec();

    // Step 3: Revert consumption for subsequent belts that use the old or new compounds
    // (We need to recalculate them because stock availability has changed)
    const affectedBelts: Array<{
      belt: BeltDoc;
      oldCoverBatches: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }>;
      oldSkimBatches: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }>;
      coverCode?: string;
      skimCode?: string;
      oldCoverTotal: number;
      oldSkimTotal: number;
    }> = [];

    for (const belt of subsequentBelts) {
      let needsRevert = false;
      const oldCoverBatches: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }> = [];
      const oldSkimBatches: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }> = [];
      let beltCoverCode: string | undefined;
      let beltSkimCode: string | undefined;

      // Check if this belt uses a compound that we're affecting (old or new cover compound)
      if (belt.coverBatchesUsed && belt.coverBatchesUsed.length > 0) {
        const firstBatch = await CompoundBatch.findById(belt.coverBatchesUsed[0].batchId).session(session || null);
        if (firstBatch && compoundsToCheck.has(firstBatch.compoundCode)) {
          needsRevert = true;
          beltCoverCode = firstBatch.compoundCode;
          belt.coverBatchesUsed.forEach(b => {
            oldCoverBatches.push({
              batchId: b.batchId as mongoose.Types.ObjectId,
              consumedKg: b.consumedKg,
            });
          });
          await revertCompoundConsumption(oldCoverBatches, session);
        }
      }

      // Check if this belt uses a compound that we're affecting (old or new skim compound)
      if (belt.skimBatchesUsed && belt.skimBatchesUsed.length > 0) {
        const firstBatch = await CompoundBatch.findById(belt.skimBatchesUsed[0].batchId).session(session || null);
        if (firstBatch && compoundsToCheck.has(firstBatch.compoundCode)) {
          needsRevert = true;
          beltSkimCode = firstBatch.compoundCode;
          belt.skimBatchesUsed.forEach(b => {
            oldSkimBatches.push({
              batchId: b.batchId as mongoose.Types.ObjectId,
              consumedKg: b.consumedKg,
            });
          });
          await revertCompoundConsumption(oldSkimBatches, session);
        }
      }

      if (needsRevert) {
        const oldCoverTotal = oldCoverBatches.reduce((sum, b) => sum + b.consumedKg, 0);
        const oldSkimTotal = oldSkimBatches.reduce((sum, b) => sum + b.consumedKg, 0);
        affectedBelts.push({
          belt,
          oldCoverBatches,
          oldSkimBatches,
          coverCode: beltCoverCode,
          skimCode: beltSkimCode,
          oldCoverTotal,
          oldSkimTotal,
        });
      }
    }

    // Step 4: Re-consume for the updated belt
    const preferredDate = calendaringDate
      ? formatLocalDate(new Date(calendaringDate))
      : formData.calendaringDate
        ? formatLocalDate(
            formData.calendaringDate instanceof Date
              ? formData.calendaringDate
              : new Date(formData.calendaringDate)
          )
        : formatLocalDate(new Date());

    coverUsage = await consumeCompound(
      coverCode,
      newCoverConsumed,
      preferredDate,
      session,
      coverProducedOn,
      'cover'
    );

    skimUsage = await consumeCompound(
      skimCode,
      newSkimConsumed,
      preferredDate,
      session,
      skimProducedOn,
      'skim'
    );

    // Step 5: Re-consume for all affected subsequent belts in order
    for (const affected of affectedBelts) {
      const beltPreferredDate = affected.belt.process?.calendaringDate
        ? formatLocalDate(new Date(affected.belt.process.calendaringDate))
        : formatLocalDate(new Date());

      let newCoverBatches = affected.belt.coverBatchesUsed || [];
      let newSkimBatches = affected.belt.skimBatchesUsed || [];

      if (affected.coverCode && affected.oldCoverTotal > 0) {
        const coverUsage = await consumeCompound(
          affected.coverCode,
          affected.oldCoverTotal,
          beltPreferredDate,
          session,
          affected.belt.process?.coverCompoundProducedOn,
          'cover'
        );
        newCoverBatches = coverUsage.batchesUsed.map(b => ({
          batchId: b.batchId,
          consumedKg: b.consumedKg,
        }));
      }

      if (affected.skimCode && affected.oldSkimTotal > 0) {
        const skimUsage = await consumeCompound(
          affected.skimCode,
          affected.oldSkimTotal,
          beltPreferredDate,
          session,
          affected.belt.process?.skimCompoundProducedOn,
          'skim'
        );
        newSkimBatches = skimUsage.batchesUsed.map(b => ({
          batchId: b.batchId,
          consumedKg: b.consumedKg,
        }));
      }

      // Update the belt with new batch usage
      const updateQuery = Belt.findByIdAndUpdate(
        affected.belt._id,
        {
          $set: {
            coverBatchesUsed: newCoverBatches,
            skimBatchesUsed: newSkimBatches,
          },
        },
        { new: true }
      );

      if (session) {
        updateQuery.session(session);
      }

      await updateQuery.exec();
    }
  }

  // Prepare update data (non-quantity fields)
  const updateData: Partial<BeltDoc> = {};

  // Helper function to parse number from string or number
  const parseNumber = (value: number | string | undefined): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };

  if (formData.beltNumber !== undefined) updateData.beltNumber = formData.beltNumber;
  if (formData.rating !== undefined) updateData.rating = formData.rating;
  if (formData.topCover !== undefined) updateData.topCoverMm = parseNumber(formData.topCover);
  if (formData.bottomCover !== undefined) updateData.bottomCoverMm = parseNumber(formData.bottomCover);
  if (formData.beltLength !== undefined) updateData.beltLengthM = parseNumber(formData.beltLength);
  if (formData.beltWidth !== undefined) updateData.beltWidthMm = parseNumber(formData.beltWidth);
  if (formData.edge !== undefined) updateData.edge = formData.edge as 'Cut' | 'Moulded';
  if (formData.breakerPly !== undefined) updateData.breakerPly = formData.breakerPly;
  if (formData.breakerPlyRemarks !== undefined) updateData.breakerPlyRemarks = formData.breakerPlyRemarks;
  if (formData.carcass !== undefined) updateData.carcassMm = parseNumber(formData.carcass);
  if (formData.coverGrade !== undefined) updateData.coverGrade = formData.coverGrade;
  if (formData.orderNumber !== undefined) updateData.orderNumber = formData.orderNumber;
  if (formData.buyerName !== undefined) updateData.buyerName = formData.buyerName;
  if (formData.orderDate !== undefined) {
    updateData.orderDate = formData.orderDate
      ? formatLocalDate(formData.orderDate instanceof Date ? formData.orderDate : new Date(formData.orderDate))
      : undefined;
  }
  if (formData.deliveryDeadline !== undefined) {
    updateData.deliveryDeadline = formData.deliveryDeadline
      ? formatLocalDate(formData.deliveryDeadline instanceof Date ? formData.deliveryDeadline : new Date(formData.deliveryDeadline))
      : undefined;
  }
  if (formData.status !== undefined) {
    updateData.status = formData.status as 'Dispatched' | 'In Production';
  }

  // Update process dates
  if (
    formData.calendaringDate !== undefined ||
    formData.calendaringStation !== undefined ||
    formData.greenBeltDate !== undefined ||
    formData.greenBeltStation !== undefined ||
    formData.curingDate !== undefined ||
    formData.pressStation !== undefined ||
    formData.inspectionDate !== undefined ||
    formData.inspectionStation !== undefined ||
    formData.pdiDate !== undefined ||
    formData.packagingDate !== undefined ||
    formData.dispatchDate !== undefined ||
    formData.coverCompoundProducedOn !== undefined ||
    formData.skimCompoundProducedOn !== undefined
  ) {
    updateData.process = {
      ...existingBelt.process,
      ...(formData.calendaringDate !== undefined && {
        calendaringDate: formData.calendaringDate
          ? formatLocalDate(formData.calendaringDate instanceof Date ? formData.calendaringDate : new Date(formData.calendaringDate))
          : undefined,
      }),
      ...(formData.calendaringStation !== undefined && { calendaringMachine: formData.calendaringStation }),
      ...(formData.greenBeltDate !== undefined && {
        greenBeltDate: formData.greenBeltDate
          ? formatLocalDate(formData.greenBeltDate instanceof Date ? formData.greenBeltDate : new Date(formData.greenBeltDate))
          : undefined,
      }),
      ...(formData.greenBeltStation !== undefined && { greenBeltMachine: formData.greenBeltStation }),
      ...(formData.curingDate !== undefined && {
        curingDate: formData.curingDate
          ? formatLocalDate(formData.curingDate instanceof Date ? formData.curingDate : new Date(formData.curingDate))
          : undefined,
      }),
      ...(formData.pressStation !== undefined && { curingMachine: formData.pressStation }),
      ...(formData.inspectionDate !== undefined && {
        inspectionDate: formData.inspectionDate
          ? formatLocalDate(formData.inspectionDate instanceof Date ? formData.inspectionDate : new Date(formData.inspectionDate))
          : undefined,
      }),
      ...(formData.inspectionStation !== undefined && { inspectionMachine: formData.inspectionStation }),
      ...(formData.pdiDate !== undefined && {
        pidDate: formData.pdiDate
          ? formatLocalDate(formData.pdiDate instanceof Date ? formData.pdiDate : new Date(formData.pdiDate))
          : undefined,
      }),
      ...(formData.packagingDate !== undefined && {
        packagingDate: formData.packagingDate
          ? formatLocalDate(formData.packagingDate instanceof Date ? formData.packagingDate : new Date(formData.packagingDate))
          : undefined,
      }),
      ...(formData.dispatchDate !== undefined && {
        dispatchDate: formData.dispatchDate
          ? formatLocalDate(formData.dispatchDate instanceof Date ? formData.dispatchDate : new Date(formData.dispatchDate))
          : undefined,
      }),
      ...(formData.coverCompoundProducedOn !== undefined && {
        coverCompoundProducedOn: coverProducedOn,
      }),
      ...(formData.skimCompoundProducedOn !== undefined && {
        skimCompoundProducedOn: skimProducedOn,
      }),
    };
  }

  // Update batch usage if quantities changed
  if (quantitiesChanged && coverUsage && skimUsage) {
    updateData.coverBatchesUsed = coverUsage.batchesUsed.map((b: { batchId: mongoose.Types.ObjectId; consumedKg: number }) => ({
      batchId: b.batchId,
      consumedKg: b.consumedKg,
    }));
    updateData.skimBatchesUsed = skimUsage.batchesUsed.map((b: { batchId: mongoose.Types.ObjectId; consumedKg: number }) => ({
      batchId: b.batchId,
      consumedKg: b.consumedKg,
    }));
  }

  // Update belt
  const updateQuery = Belt.findByIdAndUpdate(beltId, { $set: updateData }, { new: true, runValidators: true });
  if (session) {
    updateQuery.session(session);
  }

  const updatedBelt = await updateQuery.exec();

  if (!updatedBelt) {
    throw new Error('Failed to update belt');
  }

  return updatedBelt;
}

/**
 * Delete belt with compound consumption handling
 * This function ensures FIFO consistency by:
 * 1. Reverting old consumption from batches (returning stock)
 * 2. Finding all subsequent belts that use the same compounds
 * 3. Reverting their consumption
 * 4. Re-consuming for all subsequent belts in order (FIFO)
 * 5. Deleting the belt
 */
export async function deleteBelt(
  beltId: mongoose.Types.ObjectId,
  session?: ClientSession
): Promise<void> {
  // Get existing belt
  const findQuery = Belt.findById(beltId);
  if (session) {
    findQuery.session(session);
  }
  const existingBelt = await findQuery.exec();

  if (!existingBelt) {
    throw new Error('Belt not found');
  }

  // Get compound codes from existing batches
  let coverCode: string | undefined;
  let skimCode: string | undefined;

  if (existingBelt.coverBatchesUsed && existingBelt.coverBatchesUsed.length > 0) {
    const firstCoverBatch = await CompoundBatch.findById(existingBelt.coverBatchesUsed[0].batchId).session(session || null);
    if (firstCoverBatch) {
      coverCode = firstCoverBatch.compoundCode;
    }
  }

  if (existingBelt.skimBatchesUsed && existingBelt.skimBatchesUsed.length > 0) {
    const firstSkimBatch = await CompoundBatch.findById(existingBelt.skimBatchesUsed[0].batchId).session(session || null);
    if (firstSkimBatch) {
      skimCode = firstSkimBatch.compoundCode;
    }
  }

  // Step 1: Revert old consumption from batches (return stock)
  if (existingBelt.coverBatchesUsed && existingBelt.coverBatchesUsed.length > 0) {
    await revertCompoundConsumption(
      existingBelt.coverBatchesUsed.map(b => ({
        batchId: b.batchId as mongoose.Types.ObjectId,
        consumedKg: b.consumedKg,
      })),
      session
    );
  }

  if (existingBelt.skimBatchesUsed && existingBelt.skimBatchesUsed.length > 0) {
    await revertCompoundConsumption(
      existingBelt.skimBatchesUsed.map(b => ({
        batchId: b.batchId as mongoose.Types.ObjectId,
        consumedKg: b.consumedKg,
      })),
      session
    );
  }

  // Step 2: Find all subsequent belts (created after this belt) that use the same compounds
  const compoundsToCheck = new Set<string>();
  if (coverCode) compoundsToCheck.add(coverCode);
  if (skimCode) compoundsToCheck.add(skimCode);

  // Only proceed if we have compounds to check
  if (compoundsToCheck.size > 0) {
    const subsequentBeltsQuery = Belt.find({
      _id: { $ne: beltId },
      createdAt: { $gte: existingBelt.createdAt },
      $or: [
        { 'coverBatchesUsed.batchId': { $exists: true, $ne: [] } },
        { 'skimBatchesUsed.batchId': { $exists: true, $ne: [] } },
      ],
    }).sort({ createdAt: 1 }); // Sort by creation date ascending

    if (session) {
      subsequentBeltsQuery.session(session);
    }

    const subsequentBelts = await subsequentBeltsQuery.exec();

    // Step 3: Revert consumption for subsequent belts that use the same compounds
    const affectedBelts: Array<{
      belt: BeltDoc;
      oldCoverBatches: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }>;
      oldSkimBatches: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }>;
      coverCode?: string;
      skimCode?: string;
      oldCoverTotal: number;
      oldSkimTotal: number;
    }> = [];

    for (const belt of subsequentBelts) {
      let needsRevert = false;
      const oldCoverBatches: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }> = [];
      const oldSkimBatches: Array<{ batchId: mongoose.Types.ObjectId; consumedKg: number }> = [];
      let beltCoverCode: string | undefined;
      let beltSkimCode: string | undefined;

      // Check if this belt uses a compound that we're affecting (cover compound)
      if (belt.coverBatchesUsed && belt.coverBatchesUsed.length > 0) {
        const firstBatch = await CompoundBatch.findById(belt.coverBatchesUsed[0].batchId).session(session || null);
        if (firstBatch && compoundsToCheck.has(firstBatch.compoundCode)) {
          needsRevert = true;
          beltCoverCode = firstBatch.compoundCode;
          belt.coverBatchesUsed.forEach(b => {
            oldCoverBatches.push({
              batchId: b.batchId as mongoose.Types.ObjectId,
              consumedKg: b.consumedKg,
            });
          });
          await revertCompoundConsumption(oldCoverBatches, session);
        }
      }

      // Check if this belt uses a compound that we're affecting (skim compound)
      if (belt.skimBatchesUsed && belt.skimBatchesUsed.length > 0) {
        const firstBatch = await CompoundBatch.findById(belt.skimBatchesUsed[0].batchId).session(session || null);
        if (firstBatch && compoundsToCheck.has(firstBatch.compoundCode)) {
          needsRevert = true;
          beltSkimCode = firstBatch.compoundCode;
          belt.skimBatchesUsed.forEach(b => {
            oldSkimBatches.push({
              batchId: b.batchId as mongoose.Types.ObjectId,
              consumedKg: b.consumedKg,
            });
          });
          await revertCompoundConsumption(oldSkimBatches, session);
        }
      }

      if (needsRevert) {
        const oldCoverTotal = oldCoverBatches.reduce((sum, b) => sum + b.consumedKg, 0);
        const oldSkimTotal = oldSkimBatches.reduce((sum, b) => sum + b.consumedKg, 0);
        affectedBelts.push({
          belt,
          oldCoverBatches,
          oldSkimBatches,
          coverCode: beltCoverCode,
          skimCode: beltSkimCode,
          oldCoverTotal,
          oldSkimTotal,
        });
      }
    }

    // Step 4: Re-consume for all affected subsequent belts in order (FIFO)
    for (const affected of affectedBelts) {
      const beltPreferredDate = affected.belt.process?.calendaringDate
        ? formatLocalDate(new Date(affected.belt.process.calendaringDate))
        : formatLocalDate(new Date());

      let newCoverBatches = affected.belt.coverBatchesUsed || [];
      let newSkimBatches = affected.belt.skimBatchesUsed || [];

      if (affected.coverCode && affected.oldCoverTotal > 0) {
        const coverUsage = await consumeCompound(
          affected.coverCode,
          affected.oldCoverTotal,
          beltPreferredDate,
          session,
          affected.belt.process?.coverCompoundProducedOn,
          'cover'
        );
        newCoverBatches = coverUsage.batchesUsed.map(b => ({
          batchId: b.batchId,
          consumedKg: b.consumedKg,
        }));
      }

      if (affected.skimCode && affected.oldSkimTotal > 0) {
        const skimUsage = await consumeCompound(
          affected.skimCode,
          affected.oldSkimTotal,
          beltPreferredDate,
          session,
          affected.belt.process?.skimCompoundProducedOn,
          'skim'
        );
        newSkimBatches = skimUsage.batchesUsed.map(b => ({
          batchId: b.batchId,
          consumedKg: b.consumedKg,
        }));
      }

      // Update the belt with new batch usage
      const updateQuery = Belt.findByIdAndUpdate(
        affected.belt._id,
        {
          $set: {
            coverBatchesUsed: newCoverBatches,
            skimBatchesUsed: newSkimBatches,
          },
        },
        { new: true }
      );

      if (session) {
        updateQuery.session(session);
      }

      await updateQuery.exec();
    }
  }

  // Step 5: Delete the belt
  const deleteQuery = Belt.findByIdAndDelete(beltId);
  if (session) {
    deleteQuery.session(session);
  }

  const deletedBelt = await deleteQuery.exec();

  if (!deletedBelt) {
    throw new Error('Failed to delete belt');
  }
}
