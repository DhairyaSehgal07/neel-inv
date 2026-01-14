import mongoose, { Schema, Document } from 'mongoose';

export interface CompoundHistoryDoc extends Document {
  batchId: mongoose.Types.ObjectId; // ref CompoundBatch
  compoundCode: string;
  compoundName: string;
  date: string; // YYYY-MM-DD - empty string if not yet consumed
  batches: number;
  weightPerBatch: number;
  totalInventory: number;
  closingBalance: number; // inventoryRemaining at the time of insertion
  coverCompoundProducedOn?: string; // YYYY-MM-DD - date when used for cover compound
  skimCompoundProducedOn?: string; // YYYY-MM-DD - date when used for skim compound
  createdAt: Date;
}

const CompoundHistorySchema = new Schema<CompoundHistoryDoc>(
  {
    batchId: { type: Schema.Types.ObjectId, required: true, ref: 'CompoundBatch' },
    compoundCode: { type: String, required: true },
    compoundName: { type: String },
    date: { type: String, default: '', required: false },
    batches: { type: Number, required: true },
    weightPerBatch: { type: Number, required: true },
    totalInventory: { type: Number, required: true },
    closingBalance: { type: Number, required: true },
    coverCompoundProducedOn: { type: String }, // YYYY-MM-DD
    skimCompoundProducedOn: { type: String }, // YYYY-MM-DD
  },
  { timestamps: true }
);

const CompoundHistory =
  (mongoose.models.CompoundHistory as mongoose.Model<CompoundHistoryDoc>) ||
  mongoose.model<CompoundHistoryDoc>('CompoundHistory', CompoundHistorySchema);

export default CompoundHistory;
