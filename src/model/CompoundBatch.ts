import mongoose, { Schema, Document, Types } from 'mongoose';
import { getMaterialCodeDateRange } from '@/lib/helpers/compound-utils';
import RawMaterial from '@/model/RawMaterial';

export interface CompoundBatchDoc extends Document {
  compoundCode: string;
  compoundName: string;
  date: string;
  batches: number;
  weightPerBatch: number;
  totalInventory: number;
  inventoryRemaining: number;
  consumed: number;

  materialsUsed: MaterialUsed[];

  compoundMasterId: Types.ObjectId; // ✅ FIXED
  coverCompoundProducedOn?: string; // unique globally
  skimCompoundProducedOn?: string; // unique globally
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialUsed {
  materialName: string;
  materialCode: string;
}


const MaterialUsedSchema = new Schema(
  {
    materialName: { type: String, required: true },
    materialCode: { type: String, required: true },
  },
  { _id: false } // important: no separate _id per material
);

const CompoundBatchSchema = new Schema(
  {
    compoundCode: { type: String, required: true },
    compoundName: { type: String },
    date: { type: String, required: true },
    batches: { type: Number, required: true },
    weightPerBatch: { type: Number, required: true },
    totalInventory: { type: Number, required: true },
    inventoryRemaining: { type: Number, required: true, default: 0 },
    consumed: { type: Number, required: true, default: 0 },

    materialsUsed: {
      type: [MaterialUsedSchema],
      default: [],
    },

    compoundMasterId: {
      type: Schema.Types.ObjectId,
      ref: 'CompoundMaster',
      required: true,
      index: true,
    },

    coverCompoundProducedOn: { type: String },
    skimCompoundProducedOn: { type: String },
  },
  { timestamps: true }
);




/* ----------------- INDEXES ------------------ */
// Individual unique constraints
CompoundBatchSchema.index({ coverCompoundProducedOn: 1 }, { unique: true, sparse: true });
CompoundBatchSchema.index({ skimCompoundProducedOn: 1 }, { unique: true, sparse: true });

// Lookup indexes
CompoundBatchSchema.index({ compoundCode: 1 });
CompoundBatchSchema.index({
  compoundCode: 1,
  inventoryRemaining: 1,
  coverCompoundProducedOn: 1,
});
CompoundBatchSchema.index({
  compoundCode: 1,
  inventoryRemaining: 1,
  skimCompoundProducedOn: 1,
});

/* ---------- GLOBAL VALIDATION (MOST IMPORTANT) ------------ */
CompoundBatchSchema.pre('save', async function () {
  const doc = this as CompoundBatchDoc;
  const isNew = doc.isNew;

  // Auto-populate compoundMasterId if missing (lookup by compoundCode)
  if (!doc.compoundMasterId && doc.compoundCode) {
    const CompoundMaster = mongoose.model('CompoundMaster');
    const master = await CompoundMaster.findOne({ compoundCode: doc.compoundCode });
    if (master) {
      doc.compoundMasterId = master._id;
    } else {
      throw new Error(`CompoundMaster not found for code: ${doc.compoundCode}`);
    }
  }

  // Populate materialsUsed if not already set or if production date was just set
  if (doc.compoundMasterId) {
    const CompoundMaster = mongoose.model('CompoundMaster');
    const master = await CompoundMaster.findById(doc.compoundMasterId);

    if (master && master.rawMaterials && master.rawMaterials.length > 0) {
      // Determine production date: prefer coverCompoundProducedOn or skimCompoundProducedOn, fallback to date
      const productionDate = doc.coverCompoundProducedOn || doc.skimCompoundProducedOn || doc.date;

      // Check if production date was just set (for existing documents)
      const wasProductionDateJustSet = !isNew &&
        (doc.isModified('coverCompoundProducedOn') || doc.isModified('skimCompoundProducedOn'));

      // Populate materialsUsed if:
      // 1. Document is new and materialsUsed is empty
      // 2. Production date was just set and materialsUsed is empty
      // 3. materialsUsed is empty and we have a production date
      const shouldPopulateMaterials = productionDate &&
        (!doc.materialsUsed || doc.materialsUsed.length === 0 || wasProductionDateJustSet);

      if (shouldPopulateMaterials) {
        // Build materialsUsed array with assigned material codes
        const materialsUsed: MaterialUsed[] = [];

        for (const materialName of master.rawMaterials) {
          // Trim and normalize material name for matching
          const normalizedMaterialName = materialName.trim();
          const regex = new RegExp(`^${normalizedMaterialName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

          let materialCode = '';
          const maxMonthsBack = 12; // Maximum months to look back

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
              // Randomly select one material code from available options
              const randomIndex = Math.floor(Math.random() * availableMaterials.length);
              const selectedMaterial = availableMaterials[randomIndex] as unknown as {
                materialCode: string;
                rawMaterial: string;
                date: string;
              };

              materialCode = selectedMaterial?.materialCode || '';
              if (materialCode) {
                break; // Found a material code, exit the loop
              }
            }
          }

          // If still not found, try to find any material with this name (no date restriction)
          if (!materialCode) {
            const anyMaterial = await RawMaterial.find({
              rawMaterial: { $regex: regex },
            }).limit(1).lean();

            if (anyMaterial.length > 0) {
              const selectedMaterial = anyMaterial[0] as unknown as {
                materialCode: string;
                rawMaterial: string;
                date: string;
              };
              materialCode = selectedMaterial?.materialCode || '';
            }
          }

          materialsUsed.push({
            materialName,
            materialCode: materialCode || '',
          });
        }

        doc.materialsUsed = materialsUsed;
      }
    }
  }

  // If cover date exists, ensure no skim record has same date
  if (doc.coverCompoundProducedOn) {
    const conflict = await mongoose.model('CompoundBatch').findOne({
      skimCompoundProducedOn: doc.coverCompoundProducedOn,
      _id: { $ne: doc._id },
    });
    if (conflict) {
      throw new Error(`Date ${doc.coverCompoundProducedOn} already used in skimCompoundProducedOn`);
    }
  }

  // If skim date exists, ensure no cover record has same date
  if (doc.skimCompoundProducedOn) {
    const conflict = await mongoose.model('CompoundBatch').findOne({
      coverCompoundProducedOn: doc.skimCompoundProducedOn,
      _id: { $ne: doc._id },
    });
    if (conflict) {
      throw new Error(`Date ${doc.skimCompoundProducedOn} already used in coverCompoundProducedOn`);
    }
  }
});

const CompoundBatch =
  (mongoose.models.CompoundBatch as mongoose.Model<CompoundBatchDoc>) ||
  mongoose.model<CompoundBatchDoc>('CompoundBatch', CompoundBatchSchema);

export default CompoundBatch;
