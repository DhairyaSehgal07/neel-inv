import mongoose, { Schema, Document } from 'mongoose';

export interface CompoundMasterDoc extends Document {
  compoundCode: string; // e.g., "nk1" - a short code used in UI
  compoundName: string; // human readable name
  category: 'cover' | 'skim';
  defaultWeightPerBatch: number; // 90 or 120
  createdAt: Date;
  updatedAt: Date;
}

const CompoundMasterSchema = new Schema<CompoundMasterDoc>(
  {
    compoundCode: { type: String, required: true, unique: true },
    compoundName: { type: String, required: true },
    category: { type: String, required: true, enum: ['cover', 'skim'] },
    defaultWeightPerBatch: { type: Number, required: true },
  },
  { timestamps: true }
);

const CompoundMaster =
  (mongoose.models.CompoundMaster as mongoose.Model<CompoundMasterDoc>) ||
  mongoose.model<CompoundMasterDoc>('CompoundMaster', CompoundMasterSchema);

export default CompoundMaster;
