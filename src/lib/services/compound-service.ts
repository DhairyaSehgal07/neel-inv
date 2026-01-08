/**
 * Compound Service - Handles compound batch consumption and generation
 */

import mongoose, { ClientSession } from 'mongoose';
import CompoundBatch, { CompoundBatchDoc } from '@/model/CompoundBatch';
import CompoundMaster from '@/model/CompoundMaster';
import CompoundHistory from '@/model/CompoundHistory';
import {
  addDaysToDate,
  isDuplicateKeyError,
  isDuplicateKeyErrorForField,
  getRandomBatchCount,
} from '@/lib/helpers/compound-utils';

export interface BatchUsage {
  batchId: mongoose.Types.ObjectId;
  consumedKg: number;
}

export interface ConsumeResult {
  totalConsumed: number;
  batchesUsed: BatchUsage[];
}

/**
 * Find the next available batch for a compound (FIFO - oldest first)
 */
export async function getNextAvailableBatch(
  compoundCode: string,
  session?: ClientSession
): Promise<CompoundBatchDoc | null> {
  const query = CompoundBatch.findOne({
    compoundCode,
    inventoryRemaining: { $gt: 0 },
  }).sort({ date: 1 }); // FIFO: oldest first

  if (session) {
    query.session(session);
  }

  return query.exec();
}

/**
 * Find the next free date (globally unique - one batch per day)
 */
async function findNextFreeDate(preferredDate: string, session?: ClientSession): Promise<string> {
  let candidateDate = preferredDate;
  let attempts = 0;
  const maxAttempts = 365; // Prevent infinite loop

  while (attempts < maxAttempts) {
    const query = CompoundBatch.exists({ date: candidateDate });
    if (session) {
      query.session(session);
    }

    const exists = await query.exec();

    if (!exists) {
      return candidateDate;
    }

    candidateDate = addDaysToDate(candidateDate, 1);
    attempts++;
  }

  throw new Error('Could not find free date within reasonable range');
}

/**
 * Generate a new compound batch on the next free date
 */
export async function generateCompoundBatch(
  compoundCode: string,
  preferredDate: string,
  session?: ClientSession,
  batchDate?: string // Optional: specific date to use for the batch (e.g., calendaring date)
): Promise<CompoundBatchDoc> {
  // Get compound master record to determine weightPerBatch and name
  const masterQuery = CompoundMaster.findOne({ compoundCode });
  if (session) {
    masterQuery.session(session);
  }
  const master = await masterQuery.exec();

  if (!master) {
    throw new Error(`CompoundMaster not found for code: ${compoundCode}`);
  }

  const weightPerBatch = master.defaultWeightPerBatch;
  const compoundName = master.compoundName;

  // Pick batchCount randomly between 80 and 90
  const batches = getRandomBatchCount();
  const totalInventory = batches * weightPerBatch;

  // Use batchDate if provided, otherwise find next free date
  let dateToUse: string;
  if (batchDate) {
    dateToUse = batchDate;
  } else {
    dateToUse = await findNextFreeDate(preferredDate, session);
  }
  let attempts = 0;
  const maxAttempts = 365;

  // Attempt insert; on duplicate-key, increment date and retry
  while (attempts < maxAttempts) {
    try {
      const batchData = {
        compoundCode,
        compoundName,
        date: dateToUse,
        batches,
        weightPerBatch,
        totalInventory,
        inventoryRemaining: totalInventory,
        consumed: 0,
        compoundMasterId: master._id,
      };

      const createOptions = session ? { session } : {};
      const created = await CompoundBatch.create([batchData], createOptions);

      // Create CompoundHistory snapshot
      const historyData = {
        batchId: created[0]._id,
        compoundCode,
        compoundName,
        date: dateToUse,
        batches,
        weightPerBatch,
        totalInventory,
        closingBalance: totalInventory, // At creation, closingBalance = totalInventory
        coverCompoundProducedOn: created[0].coverCompoundProducedOn,
        skimCompoundProducedOn: created[0].skimCompoundProducedOn,
      };

      await CompoundHistory.create([historyData], createOptions);

      return created[0];
    } catch (err) {
      if (isDuplicateKeyError(err) && isDuplicateKeyErrorForField(err, 'date')) {
        // Some other process created a batch on dateToUse — try next day
        dateToUse = addDaysToDate(dateToUse, 1);
        attempts++;
        continue;
      } else {
        throw err;
      }
    }
  }

  throw new Error('Could not find free date within reasonable range');
}

/**
 * Consume compound across batches (FIFO) until requiredKg is satisfied
 * Auto-generates batches as needed
 */
export async function consumeCompound(
  compoundCode: string,
  requiredKg: number,
  preferredDate: string,
  session?: ClientSession,
  producedOn?: string, // YYYY-MM-DD - date when compound was produced/used
  compoundType?: 'cover' | 'skim', // Indicates if this is for cover or skim compound
  batchDate?: string // Optional: specific date to use when creating new batches (e.g., calendaring date)
): Promise<ConsumeResult> {
  let remaining = requiredKg;
  const batchesUsed: BatchUsage[] = [];
  let daysCreated = 0;
  const maxDaysLookahead = 30; // Safety cap to prevent runaway batch creation
  const maxRetries = 8; // Maximum retries for concurrency conflicts

  while (remaining > 0) {
    // Find oldest batch with remaining inventory
    let batch = await getNextAvailableBatch(compoundCode, session);

    if (!batch) {
      // Generate a new batch on next free date
      if (daysCreated >= maxDaysLookahead) {
        throw new Error(
          `Cannot create more batches: exceeds ${maxDaysLookahead} day lookahead. Please create batches manually.`
        );
      }

      batch = await generateCompoundBatch(compoundCode, preferredDate, session, batchDate);
      daysCreated++;

      // Update preferredDate for next iteration (if needed)
      preferredDate = addDaysToDate(batch.date, 1);
    }

    // Determine how much to take from this batch
    const toConsume = Math.min(remaining, batch.inventoryRemaining);

    // Atomically update batch with retry logic
    let updated: CompoundBatchDoc | null = null;
    let retryCount = 0;
    let currentToConsume = toConsume;
    let currentBatch = batch;

    while (!updated && retryCount < maxRetries) {
      // Build update object
      const updateObj: {
        $inc: { inventoryRemaining: number; consumed: number };
        $set?: { coverCompoundProducedOn?: string; skimCompoundProducedOn?: string };
      } = {
        $inc: {
          inventoryRemaining: -currentToConsume,
          consumed: currentToConsume,
        },
      };

      // Set producedOn date if provided and not already set (preserve first usage date)
      if (producedOn && compoundType) {
        updateObj.$set = {};
        if (compoundType === 'cover' && !currentBatch.coverCompoundProducedOn) {
          updateObj.$set.coverCompoundProducedOn = producedOn;
        } else if (compoundType === 'skim' && !currentBatch.skimCompoundProducedOn) {
          updateObj.$set.skimCompoundProducedOn = producedOn;
        }
        // If $set is empty, remove it
        if (Object.keys(updateObj.$set || {}).length === 0) {
          delete updateObj.$set;
        }
      }

      const updateQuery = CompoundBatch.findOneAndUpdate(
        {
          _id: currentBatch._id,
          inventoryRemaining: { $gte: currentToConsume }, // Conditional: only update if enough inventory
        },
        updateObj,
        { new: true }
      );

      if (session) {
        updateQuery.session(session);
      }

      updated = await updateQuery.exec();

      if (!updated) {
        // Concurrency conflict or inventory changed — re-fetch and retry
        const refetchQuery = CompoundBatch.findById(currentBatch._id);
        if (session) {
          refetchQuery.session(session);
        }
        const refetched = await refetchQuery.exec();

        if (refetched && refetched.inventoryRemaining > 0) {
          // Update currentToConsume based on new inventory
          currentToConsume = Math.min(remaining, refetched.inventoryRemaining);
          currentBatch = refetched;
          retryCount++;
          // Small delay before retry
          await new Promise((resolve) => setTimeout(resolve, 50 * retryCount));
          continue;
        }
        // If no inventory or batch not found, break and try next batch
        break;
      }
    }

    if (!updated) {
      // Could not consume from this batch, try next one
      continue;
    }

    // Update existing CompoundHistory entry if producedOn date was set for the first time
    if (producedOn && compoundType && updated) {
      const wasFirstTimeSet =
        (compoundType === 'cover' && !currentBatch.coverCompoundProducedOn && updated.coverCompoundProducedOn) ||
        (compoundType === 'skim' && !currentBatch.skimCompoundProducedOn && updated.skimCompoundProducedOn);

      if (wasFirstTimeSet) {
        // Update the existing CompoundHistory entry instead of creating a new one
        const updateQuery = CompoundHistory.findOneAndUpdate(
          { batchId: updated._id },
          {
            $set: {
              coverCompoundProducedOn: updated.coverCompoundProducedOn,
              skimCompoundProducedOn: updated.skimCompoundProducedOn,
              closingBalance: updated.inventoryRemaining,
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

    batchesUsed.push({
      batchId: updated._id as mongoose.Types.ObjectId,
      consumedKg: currentToConsume,
    });
    remaining -= currentToConsume;
  }

  return {
    totalConsumed: requiredKg,
    batchesUsed,
  };
}

/**
 * Consume compound from selected batches
 * Validates inventory before consuming and throws error if insufficient
 */
export async function consumeFromSelectedBatches(
  selectedBatches: Array<{ batchId: string | mongoose.Types.ObjectId; consumedKg: number }>,
  session?: ClientSession
): Promise<ConsumeResult> {
  const batchesUsed: BatchUsage[] = [];
  let totalConsumed = 0;

  // First, validate all batches have enough inventory
  const batchIds = selectedBatches.map((batch) =>
    typeof batch.batchId === 'string' ? new mongoose.Types.ObjectId(batch.batchId) : batch.batchId
  );

  const query = CompoundBatch.find({ _id: { $in: batchIds } });
  if (session) {
    query.session(session);
  }
  const batches = await query.exec();

  // Create a map for quick lookup
  const batchMap = new Map<string, CompoundBatchDoc>();
  batches.forEach((batch) => {
    const batchIdStr = batch._id.toString();
    batchMap.set(batchIdStr, batch);
  });

  // Validate inventory for each selected batch
  for (const selectedBatch of selectedBatches) {
    const batchIdStr =
      typeof selectedBatch.batchId === 'string'
        ? selectedBatch.batchId
        : selectedBatch.batchId.toString();
    const batch = batchMap.get(batchIdStr);

    if (!batch) {
      throw new Error(`Batch ${batchIdStr} not found`);
    }

    if (batch.inventoryRemaining < selectedBatch.consumedKg) {
      throw new Error(
        `Not enough inventory. Batch ${batch.compoundCode} (${batch.date}) has ${batch.inventoryRemaining} kg remaining, but ${selectedBatch.consumedKg} kg is required.`
      );
    }
  }

  // Now consume from each batch
  for (const selectedBatch of selectedBatches) {
    const batchIdStr =
      typeof selectedBatch.batchId === 'string'
        ? selectedBatch.batchId
        : selectedBatch.batchId.toString();
    const batch = batchMap.get(batchIdStr)!;

    // Atomically update batch
    const updateQuery = CompoundBatch.findOneAndUpdate(
      {
        _id: batch._id,
        inventoryRemaining: { $gte: selectedBatch.consumedKg }, // Conditional: only update if enough inventory
      },
      {
        $inc: {
          inventoryRemaining: -selectedBatch.consumedKg,
          consumed: selectedBatch.consumedKg,
        },
      },
      { new: true }
    );

    if (session) {
      updateQuery.session(session);
    }

    const updated = await updateQuery.exec();

    if (!updated) {
      // This should not happen if validation passed, but handle it anyway
      throw new Error(
        `Failed to consume from batch ${batch.compoundCode} (${batch.date}). Inventory may have changed.`
      );
    }

    batchesUsed.push({
      batchId: updated._id as mongoose.Types.ObjectId,
      consumedKg: selectedBatch.consumedKg,
    });

    totalConsumed += selectedBatch.consumedKg;
  }

  return {
    totalConsumed,
    batchesUsed,
  };
}
