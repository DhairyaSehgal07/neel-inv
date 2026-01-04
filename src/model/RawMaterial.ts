import mongoose, { Schema, Document } from 'mongoose';

export interface RawMaterialDoc extends Document {
  materialCode: string;
  rawMaterial: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

const RawMaterialSchema = new Schema<RawMaterialDoc>(
  {
    materialCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    rawMaterial: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);



const RawMaterial =
  (mongoose.models.RawMaterial as mongoose.Model<RawMaterialDoc>) ||
  mongoose.model<RawMaterialDoc>('RawMaterial', RawMaterialSchema);

export default RawMaterial;
