import mongoose, { Schema, Document } from 'mongoose';

export type CompoundCategory = 'skim' | 'cover';

export interface CompoundType extends Document {
  name: string; // e.g. "Nk-5"
  type: CompoundCategory; // skim | cover
  isActive: boolean; // optional for soft delete
  createdAt: Date;
  updatedAt: Date;
}

const CompoundTypeSchema: Schema<CompoundType> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Compound name is required'],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['skim', 'cover'],
      required: [true, 'Compound type is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CompoundTypeModel =
  (mongoose.models.CompoundType as mongoose.Model<CompoundType>) ||
  mongoose.model<CompoundType>('CompoundType', CompoundTypeSchema);

export default CompoundTypeModel;
