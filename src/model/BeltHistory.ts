import mongoose, { Schema, Document } from 'mongoose';

export interface BeltHistoryDoc extends Document {
  beltId: mongoose.Types.ObjectId;
  beltNumber: string;
  rating?: string;
  fabricId?: mongoose.Types.ObjectId;
  coverBatchesUsed?: { batchId: mongoose.Types.ObjectId; consumedKg: number }[];
  skimBatchesUsed?: { batchId: mongoose.Types.ObjectId; consumedKg: number }[];
  remarks?: string;
  createdAt: Date;
}

const UsedSchema = new Schema(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'CompoundBatch', required: true },
    consumedKg: { type: Number, required: true },
  },
  { _id: false }
);

const BeltHistorySchema = new Schema<BeltHistoryDoc>(
  {
    beltId: { type: Schema.Types.ObjectId, required: true, ref: 'Belt' },
    beltNumber: { type: String },
    rating: String,
    fabricId: { type: Schema.Types.ObjectId, ref: 'Fabric' },
    coverBatchesUsed: { type: [UsedSchema], default: [] },
    skimBatchesUsed: { type: [UsedSchema], default: [] },
    remarks: String,
  },
  { timestamps: true }
);

const BeltHistory =
  (mongoose.models.BeltHistory as mongoose.Model<BeltHistoryDoc>) ||
  mongoose.model<BeltHistoryDoc>('BeltHistory', BeltHistorySchema);

export default BeltHistory;
