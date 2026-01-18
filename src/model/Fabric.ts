import mongoose, { Schema, Document } from 'mongoose';

export interface FabricDoc extends Document {
  type: 'EP' | 'NN' | 'EE' | 'Other';
  rating?: string;
  strength?: number;
  supplier?: string;
  rollNumber?: string;
  consumedMeters?: number;
  createdAt: Date;
  updatedAt: Date;
}

const FabricSchema = new Schema<FabricDoc>(
  {
    type: { type: String, enum: ['EP', 'NN', 'EE', 'Other'], required: true },
    rating: String,
    strength: Number,
    supplier: String,
    rollNumber: String,
    consumedMeters: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ----------------- INDEXES ------------------ */
// Index for _id lookups (already exists by default, but explicit for clarity)
FabricSchema.index({ _id: 1 });

const Fabric =
  (mongoose.models.Fabric as mongoose.Model<FabricDoc>) ||
  mongoose.model<FabricDoc>('Fabric', FabricSchema);

export default Fabric;
