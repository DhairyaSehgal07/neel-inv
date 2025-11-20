import mongoose, { Schema, Document } from 'mongoose';

export interface CompoundHistoryDoc extends Document {
  batchId: mongoose.Types.ObjectId; // ref CompoundBatch
  compoundCode: string;
  compoundName: string;
  date: string; // YYYY-MM-DD
  batches: number;
  weightPerBatch: number;
  totalInventory: number;
  closingBalance: number; // inventoryRemaining at the time of insertion
  createdAt: Date;
}

const CompoundHistorySchema = new Schema<CompoundHistoryDoc>(
  {
    batchId: { type: Schema.Types.ObjectId, required: true, ref: 'CompoundBatch' },
    compoundCode: { type: String, required: true },
    compoundName: { type: String },
    date: { type: String, required: true },
    batches: { type: Number, required: true },
    weightPerBatch: { type: Number, required: true },
    totalInventory: { type: Number, required: true },
    closingBalance: { type: Number, required: true },
  },
  { timestamps: true }
);

const CompoundHistory =
  (mongoose.models.CompoundHistory as mongoose.Model<CompoundHistoryDoc>) ||
  mongoose.model<CompoundHistoryDoc>('CompoundHistory', CompoundHistorySchema);

export default CompoundHistory;
