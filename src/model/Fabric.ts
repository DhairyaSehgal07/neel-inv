import mongoose, { Schema, Document } from 'mongoose';

export interface FabricInfoDocument extends Document {
  type?: string; // EP / NN / EE / Other
  rating?: string;
  strength?: number;
  supplier?: string;
  rollNumber?: string;
  consumedMeters?: number;
}

const FabricInfoSchema = new Schema<FabricInfoDocument>(
  {
    type: {
      type: String,
      enum: ['EP', 'NN', 'EE', 'Other'],
    },
    rating: String,
    strength: Number,
    supplier: String,
    rollNumber: String,
    consumedMeters: Number,
  },
  { timestamps: true }
);

const FabricInfoModel =
  (mongoose.models.FabricInfo as mongoose.Model<FabricInfoDocument>) ||
  mongoose.model<FabricInfoDocument>('FabricInfo', FabricInfoSchema);

export default FabricInfoModel;
