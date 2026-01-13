/**
 * Belt Service - Orchestrates belt creation with compound consumption
 */

import mongoose, { ClientSession } from 'mongoose';
import Belt, { BeltDoc } from '@/model/Belt';
import BeltHistory from '@/model/BeltHistory';
import Fabric, { FabricDoc } from '@/model/Fabric';
import CompoundMaster from '@/model/CompoundMaster';
import { consumeCompound, consumeFromSelectedBatches } from './compound-service';
import { compoundNameToCode, formatLocalDate } from '@/lib/helpers/compound-utils';
import { BeltFormData } from '@/types/belt';

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

  // Format calendaring date for batch creation
  const batchDate = formData.calendaringDate
    ? formatLocalDate(
        formData.calendaringDate instanceof Date
          ? formData.calendaringDate
          : new Date(formData.calendaringDate)
      )
    : undefined;

  // Format producedOn dates if provided
  const coverProducedOn = formData.coverCompoundProducedOn
    ? formatLocalDate(
        formData.coverCompoundProducedOn instanceof Date
          ? formData.coverCompoundProducedOn
          : new Date(formData.coverCompoundProducedOn)
      )
    : undefined;

  const skimProducedOn = formData.skimCompoundProducedOn
    ? formatLocalDate(
        formData.skimCompoundProducedOn instanceof Date
          ? formData.skimCompoundProducedOn
          : new Date(formData.skimCompoundProducedOn)
      )
    : undefined;

  // Consume cover compound
  const coverUsage = await consumeCompound(
    coverCode,
    coverConsumedKg,
    preferredDate,
    session,
    coverProducedOn,
    'cover',
    batchDate // Pass calendaring date as batchDate
  );

  // Consume skim compound
  const skimUsage = await consumeCompound(
    skimCode,
    skimConsumedKg,
    preferredDate,
    session,
    skimProducedOn,
    'skim',
    batchDate // Pass calendaring date as batchDate
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
      coverCompoundProducedOn: formData.coverCompoundProducedOn
        ? formatLocalDate(formData.coverCompoundProducedOn)
        : undefined,
      skimCompoundProducedOn: formData.skimCompoundProducedOn
        ? formatLocalDate(formData.skimCompoundProducedOn)
        : undefined,
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

export interface CreateManualBeltPayload {
  formData: BeltFormData;
  coverBatches: Array<{ batchId: string; consumedKg: number }>;
  skimBatches: Array<{ batchId: string; consumedKg: number }>;
}

/**
 * Create a new belt manually using selected compound batches
 * Does not create new batches, only consumes from existing ones
 */
export async function createManualBelt(
  payload: CreateManualBeltPayload,
  session?: ClientSession
): Promise<BeltDoc> {
  const { formData, coverBatches = [], skimBatches = [] } = payload;

  const coverConsumedKg =
    typeof formData.coverCompoundConsumed === 'number'
      ? formData.coverCompoundConsumed
      : typeof formData.coverCompoundConsumed === 'string'
        ? parseFloat(formData.coverCompoundConsumed)
        : 0;

  const skimConsumedKg =
    typeof formData.skimCompoundConsumed === 'number'
      ? formData.skimCompoundConsumed
      : typeof formData.skimCompoundConsumed === 'string'
        ? parseFloat(formData.skimCompoundConsumed)
        : 0;

  // At least one compound must be provided
  if (coverConsumedKg <= 0 && skimConsumedKg <= 0) {
    throw new Error('At least one compound (cover or skim) must be provided');
  }

  // Validate cover compound if provided
  if (coverConsumedKg > 0) {
    if (!coverBatches || coverBatches.length === 0) {
      throw new Error('At least one cover compound batch is required when cover compound is provided');
    }

    const totalCoverConsumed = coverBatches.reduce((sum, batch) => sum + batch.consumedKg, 0);
    if (Math.abs(totalCoverConsumed - coverConsumedKg) > 0.01) {
      throw new Error(
        `Cover compound consumption mismatch. Form shows ${coverConsumedKg} kg but selected batches total ${totalCoverConsumed} kg.`
      );
    }
  }

  // Validate skim compound if provided
  if (skimConsumedKg > 0) {
    if (!skimBatches || skimBatches.length === 0) {
      throw new Error('At least one skim compound batch is required when skim compound is provided');
    }

    const totalSkimConsumed = skimBatches.reduce((sum, batch) => sum + batch.consumedKg, 0);
    if (Math.abs(totalSkimConsumed - skimConsumedKg) > 0.01) {
      throw new Error(
        `Skim compound consumption mismatch. Form shows ${skimConsumedKg} kg but selected batches total ${totalSkimConsumed} kg.`
      );
    }
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

  // Consume from selected cover batches (only if provided)
  const coverUsage = coverBatches.length > 0
    ? await consumeFromSelectedBatches(coverBatches, session)
    : { batchesUsed: [], totalConsumed: 0 };

  // Consume from selected skim batches (only if provided)
  const skimUsage = skimBatches.length > 0
    ? await consumeFromSelectedBatches(skimBatches, session)
    : { batchesUsed: [], totalConsumed: 0 };

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
      coverCompoundProducedOn: formData.coverCompoundProducedOn
        ? formatLocalDate(formData.coverCompoundProducedOn)
        : undefined,
      skimCompoundProducedOn: formData.skimCompoundProducedOn
        ? formatLocalDate(formData.skimCompoundProducedOn)
        : undefined,
    },
    coverBatchesUsed: coverUsage.batchesUsed,
    skimBatchesUsed: skimUsage.batchesUsed,
    status: (formData.status as 'Dispatched' | 'In Production') || 'In Production',
    entryType: 'Manual',
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
