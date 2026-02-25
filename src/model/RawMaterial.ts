import mongoose, { Schema, Document } from 'mongoose';

export interface RawMaterialDoc extends Document {
  materialCode: string;
  rawMaterial: string;
  rawMaterialNormalized?: string;
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
    rawMaterialNormalized: {
      type: String,
      trim: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient material + date range lookups with $sample
RawMaterialSchema.index({ rawMaterialNormalized: 1, date: 1 });
RawMaterialSchema.index({ rawMaterial: 1, date: 1 });

// Keep rawMaterialNormalized in sync for exact-match queries (avoids regex when possible)
RawMaterialSchema.pre('save', function () {
  if (this.rawMaterial) {
    this.rawMaterialNormalized = this.rawMaterial.trim().toLowerCase();
  }
});

const RawMaterial =
  (mongoose.models.RawMaterial as mongoose.Model<RawMaterialDoc>) ||
  mongoose.model<RawMaterialDoc>('RawMaterial', RawMaterialSchema);

export default RawMaterial;
