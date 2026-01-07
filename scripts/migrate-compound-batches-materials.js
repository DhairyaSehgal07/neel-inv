/**
 * Migration script to populate materialsUsed for existing CompoundBatch documents
 *
 * This script:
 * 1. Finds all CompoundBatch documents that don't have materialsUsed populated
 * 2. For each batch, gets raw materials from CompoundMaster
 * 3. Assigns material codes based on production date (2-3 months before)
 * 4. Updates the batch with materialsUsed array
 *
 * Usage:
 *   - First run (only empty/missing): node scripts/migrate-compound-batches-materials.js
 *   - Re-randomize all batches: RANDOMIZE_ALL=true node scripts/migrate-compound-batches-materials.js
 *
 * Make sure MONGODB_URI is set in your environment
 */

import mongoose from 'mongoose';
import { parseISO, format, subMonths } from 'date-fns';


/**
 * Calculate date range for material code lookup
 * @param {string} productionDate - Production date in YYYY-MM-DD format
 * @param {number} monthsBack - Number of months to look back from production date
 * @returns {Object} { startDate, endDate } in YYYY-MM-DD format
 */
function getMaterialCodeDateRange(productionDate, monthsBack = 3) {
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

/**
 * Shuffle array using Fisher-Yates algorithm for better randomization
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Find material code for a material name by expanding date range until found
 * @param {string} materialName - Name of the material to find
 * @param {string} productionDate - Production date
 * @param {Object} RawMaterial - RawMaterial model
 * @param {number} maxMonthsBack - Maximum months to look back (default: 12)
 * @returns {Promise<string>} Material code or empty string if not found
 */
async function findMaterialCodeWithExpandingRange(materialName, productionDate, RawMaterial, maxMonthsBack = 12) {
  const normalizedMaterialName = materialName.trim();
  const regex = new RegExp(`^${normalizedMaterialName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

  // Start with 3 months, expand until found or maxMonthsBack reached
  for (let monthsBack = 3; monthsBack <= maxMonthsBack; monthsBack++) {
    const { startDate, endDate } = getMaterialCodeDateRange(productionDate, monthsBack);

    const availableMaterials = await RawMaterial.find({
      rawMaterial: { $regex: regex },
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();

    if (availableMaterials.length > 0) {
      // Shuffle array and randomly select one material code from available options
      const shuffledMaterials = shuffleArray(availableMaterials);
      const randomIndex = Math.floor(Math.random() * shuffledMaterials.length);
      const selectedMaterial = shuffledMaterials[randomIndex];
      const materialCode = selectedMaterial?.materialCode || '';

      if (materialCode) {
        if (monthsBack > 3) {
          console.log(`  ✅ Found material code "${materialCode}" for "${materialName}" (searched ${monthsBack} months back, ${availableMaterials.length} options available)`);
        } else {
          console.log(`  ✅ Found material code "${materialCode}" for "${materialName}" (${availableMaterials.length} options available)`);
        }
        return materialCode;
      }
    }
  }

  // If still not found, try to find any material with this name (no date restriction)
  // Get all matching materials and randomize selection
  const anyMaterials = await RawMaterial.find({
    rawMaterial: { $regex: regex },
  }).lean();

  if (anyMaterials.length > 0) {
    // Shuffle and randomly select from all available materials
    const shuffledMaterials = shuffleArray(anyMaterials);
    const randomIndex = Math.floor(Math.random() * shuffledMaterials.length);
    const selectedMaterial = shuffledMaterials[randomIndex];
    const materialCode = selectedMaterial?.materialCode || '';

    if (materialCode) {
      console.log(`  ⚠️  Found material code "${materialCode}" for "${materialName}" (outside ${maxMonthsBack} month range, ${anyMaterials.length} total options available)`);
      return materialCode;
    }
  }

  console.log(`  ⚠️  No material code found for "${materialName}" even after searching ${maxMonthsBack} months back`);
  return '';
}

/**
 * Assign material codes to a batch
 * @param {Object} compoundsNeedingRawMaterials - Set to track compounds needing rawMaterials (passed by reference)
 */
async function assignMaterialCodes(batch, CompoundMaster, RawMaterial, compoundsNeedingRawMaterials) {
  try {
    // Get CompoundMaster
    const master = await CompoundMaster.findById(batch.compoundMasterId);

    if (!master) {
      console.log(`  ⚠️  CompoundMaster not found for batch ${batch.compoundCode} (ID: ${batch.compoundMasterId})`);
      return null;
    }

    // Check if rawMaterials is empty or missing
    if (!master.rawMaterials || master.rawMaterials.length === 0) {
      console.log(`  ⚠️  CompoundMaster for ${batch.compoundCode} has no rawMaterials defined`);
      console.log(`     CompoundMaster ID: ${master._id}, Name: ${master.compoundName || 'N/A'}`);
      // Track this compound for summary (if set is provided)
      if (compoundsNeedingRawMaterials) {
        compoundsNeedingRawMaterials.add(batch.compoundCode);
      }
      // Return empty array to still populate materialsUsed field (for consistency)
      return [];
    }

    // Determine production date: prefer coverCompoundProducedOn or skimCompoundProducedOn, fallback to date
    const productionDate = batch.coverCompoundProducedOn || batch.skimCompoundProducedOn || batch.date;

    if (!productionDate) {
      console.log(`  ⚠️  No production date found for batch ${batch._id}`);
      return null;
    }

    console.log(`  📅 Production date: ${productionDate}`);

    // Build materialsUsed array with assigned material codes
    const materialsUsed = [];

    for (const materialName of master.rawMaterials) {
      // Use expanding date range to find material code
      const materialCode = await findMaterialCodeWithExpandingRange(
        materialName,
        productionDate,
        RawMaterial,
        12 // Maximum 12 months back
      );

      materialsUsed.push({
        materialName,
        materialCode: materialCode || '',
      });
    }

    return materialsUsed;
  } catch (error) {
    console.error(`  ❌ Error assigning material codes:`, error.message);
    return null;
  }
}

/**
 * Define schemas inline (since we can't easily import TypeScript models)
 */
function defineModels() {
  // CompoundMaster Schema
  const CompoundMasterSchema = new mongoose.Schema({
    compoundCode: { type: String, required: true },
    compoundName: { type: String, required: true },
    rawMaterials: { type: [String], default: [] },
    category: { type: String, required: true, enum: ['cover', 'skim'] },
    defaultWeightPerBatch: { type: Number, required: true },
  }, { timestamps: true });

  // RawMaterial Schema
  const RawMaterialSchema = new mongoose.Schema({
    materialCode: { type: String, required: true, trim: true, index: true },
    rawMaterial: { type: String, required: true, trim: true },
    date: { type: String, required: true },
  }, { timestamps: true });

  // CompoundBatch Schema (simplified for migration)
  const CompoundBatchSchema = new mongoose.Schema({
    compoundCode: { type: String, required: true },
    compoundName: { type: String },
    date: { type: String, required: true },
    batches: { type: Number, required: true },
    weightPerBatch: { type: Number, required: true },
    totalInventory: { type: Number, required: true },
    inventoryRemaining: { type: Number, required: true, default: 0 },
    consumed: { type: Number, required: true, default: 0 },
    materialsUsed: {
      type: [{
        materialName: { type: String, required: true },
        materialCode: { type: String, required: true },
      }],
      default: [],
    },
    compoundMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompoundMaster', required: true },
    coverCompoundProducedOn: { type: String },
    skimCompoundProducedOn: { type: String },
  }, { timestamps: true });

  // Get or create models
  const CompoundBatch = mongoose.models.CompoundBatch || mongoose.model('CompoundBatch', CompoundBatchSchema);
  const CompoundMaster = mongoose.models.CompoundMaster || mongoose.model('CompoundMaster', CompoundMasterSchema);
  const RawMaterial = mongoose.models.RawMaterial || mongoose.model('RawMaterial', RawMaterialSchema);

  return { CompoundBatch, CompoundMaster, RawMaterial };
}

/**
 * Main migration function
 */
async function migrateCompoundBatches() {
  try {
    // Connect to database
    const mongoUri =
      'mongodb+srv://neelkanthrubbermills:V6pwqreZT8BnIUeI@neelkanthcluster.5s56j39.mongodb.net/neelkanthdb?appName=NeelkanthCluster';
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('🔌 Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');

    // Define models
    const models = defineModels();
    const CompoundBatch = models.CompoundBatch;
    const CompoundMaster = models.CompoundMaster;
    const RawMaterial = models.RawMaterial;

    // Check if we should re-randomize all batches
    const randomizeAll = process.env.RANDOMIZE_ALL === 'true';

    // Find batches to update
    let batchesToUpdate;
    if (randomizeAll) {
      // Re-randomize ALL batches (including those with existing material codes)
      batchesToUpdate = await CompoundBatch.find({});
      console.log(`🔄 Re-randomizing mode: Found ${batchesToUpdate.length} batches to update\n`);
    } else {
      // Only update batches that need materialsUsed populated or have empty material codes
      batchesToUpdate = await CompoundBatch.find({
        $or: [
          { materialsUsed: { $exists: false } },
          { materialsUsed: null },
          { materialsUsed: { $size: 0 } },
          { 'materialsUsed.materialCode': '' }, // Has materials but with empty codes
          { 'materialsUsed.materialCode': { $exists: false } },
        ],
      });
      console.log(`📊 Found ${batchesToUpdate.length} batches to update\n`);
    }

    if (batchesToUpdate.length === 0) {
      console.log('✅ All batches already have materialsUsed populated');
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const compoundsNeedingRawMaterials = new Set(); // Track compounds that need rawMaterials defined

    // Process each batch
    for (let i = 0; i < batchesToUpdate.length; i++) {
      const batch = batchesToUpdate[i];
      console.log(`[${i + 1}/${batchesToUpdate.length}] Processing batch ${batch._id} (${batch.compoundCode})...`);

      const materialsUsed = await assignMaterialCodes(batch, CompoundMaster, RawMaterial, compoundsNeedingRawMaterials);

      if (materialsUsed === null) {
        skippedCount++;
        console.log(`  ⏭️  Skipped\n`);
        continue;
      }

      try {
        // Update the batch (even if materialsUsed is empty array)
        await CompoundBatch.findByIdAndUpdate(
          batch._id,
          { $set: { materialsUsed } },
          { new: true }
        );

        if (materialsUsed.length === 0) {
          console.log(`  ✅ Updated with empty materialsUsed array (no raw materials defined in CompoundMaster)\n`);
        } else {
          console.log(`  ✅ Updated with ${materialsUsed.length} materials`);
          console.log(`     Materials: ${materialsUsed.map(m => `${m.materialName} (${m.materialCode || 'N/A'})`).join(', ')}\n`);
        }
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to update batch:`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 Migration Summary:');
    console.log(`  ✅ Successfully updated: ${successCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📊 Total processed: ${batchesToUpdate.length}`);

    if (compoundsNeedingRawMaterials.size > 0) {
      console.log('\n⚠️  Compounds that need rawMaterials defined in CompoundMaster:');
      Array.from(compoundsNeedingRawMaterials).sort().forEach(code => {
        console.log(`     - ${code}`);
      });
      console.log('\n💡 To fix: Update these CompoundMaster records to include rawMaterials array');
    }

    console.log('='.repeat(50));

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateCompoundBatches();
