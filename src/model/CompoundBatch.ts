import mongoose, { Schema, Document } from 'mongoose';

export interface CompoundBatchDoc extends Document {
  compoundCode: string; // e.g., "nk8"
  compoundName: string; // redundancy for quick reads
  date: string; // YYYY-MM-DD
  batches: number; // 80-90
  weightPerBatch: number; // 90 or 120
  totalInventory: number; // batches * weightPerBatch
  inventoryRemaining: number;
  consumed: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompoundBatchSchema = new Schema<CompoundBatchDoc>(
  {
    compoundCode: { type: String, required: true, index: true },
    compoundName: { type: String },
    date: { type: String, required: true }, // YYYY-MM-DD
    batches: { type: Number, required: true },
    weightPerBatch: { type: Number, required: true },
    totalInventory: { type: Number, required: true },
    inventoryRemaining: { type: Number, required: true, default: 0 },
    consumed: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Global uniqueness on date (one batch per day across all compounds)
CompoundBatchSchema.index({ date: 1 }, { unique: true });

// Non-unique index for compoundCode lookups
CompoundBatchSchema.index({ compoundCode: 1 });

// Composite index for FIFO queries (find oldest batch with remaining inventory)
CompoundBatchSchema.index({ compoundCode: 1, inventoryRemaining: 1, date: 1 });

const CompoundBatch =
  (mongoose.models.CompoundBatch as mongoose.Model<CompoundBatchDoc>) ||
  mongoose.model<CompoundBatchDoc>('CompoundBatch', CompoundBatchSchema);

export default CompoundBatch;
