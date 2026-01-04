import mongoose, { Schema, Document, Types } from 'mongoose';

export interface CompoundBatchDoc extends Document {
  compoundCode: string;
  compoundName: string;
  date: string;
  batches: number;
  weightPerBatch: number;
  totalInventory: number;
  inventoryRemaining: number;
  consumed: number;

  compoundMasterId: Types.ObjectId; // ✅ FIXED
  coverCompoundProducedOn?: string; // unique globally
  skimCompoundProducedOn?: string; // unique globally
  createdAt: Date;
  updatedAt: Date;
}

const CompoundBatchSchema = new Schema<CompoundBatchDoc>(
  {
    compoundCode: { type: String, required: true },
    compoundName: { type: String },
    date: { type: String, required: true },
    batches: { type: Number, required: true },
    weightPerBatch: { type: Number, required: true },
    totalInventory: { type: Number, required: true },
    inventoryRemaining: { type: Number, required: true, default: 0 },
    consumed: { type: Number, required: true, default: 0 },
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
