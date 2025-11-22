import mongoose, { Schema, Document } from 'mongoose';

export interface BatchUsage {
  batchId: mongoose.Types.ObjectId;
  consumedKg: number;
  compoundCode?: string;
  date?: string;
  coverCompoundProducedOn?: string;
  skimCompoundProducedOn?: string;
}

export interface BeltDoc extends Document {
  beltNumber: string;
  rating?: string;
  fabricId?: mongoose.Types.ObjectId;
  topCoverMm?: number;
  bottomCoverMm?: number;
  beltLengthM?: number;
  beltWidthMm?: number;
  edge?: 'Cut' | 'Moulded';
  breakerPly?: boolean;
  breakerPlyRemarks?: string;
  carcassMm?: number;
  coverGrade?: string;
  orderNumber?: string;
  buyerName?: string;
  orderDate?: string;
  deliveryDeadline?: string;
  process?: {
    calendaringDate?: string;
    calendaringMachine?: string;
    greenBeltDate?: string;
    greenBeltMachine?: string;
    curingDate?: string;
    curingMachine?: string;
    inspectionDate?: string;
    inspectionMachine?: string;
    pidDate?: string;
    packagingDate?: string;
    dispatchDate?: string;
    coverCompoundProducedOn?: string;
    skimCompoundProducedOn?: string;
  };
  coverBatchesUsed?: BatchUsage[];
  skimBatchesUsed?: BatchUsage[];
  status: 'Dispatched' | 'In Production';
  entryType: 'Manual' | 'Auto';
  createdAt: Date;
  updatedAt: Date;
}

const BatchUsageSchema = new Schema(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'CompoundBatch', required: true },
    consumedKg: { type: Number, required: true },
    compoundCode: { type: String },
    date: { type: String },
    coverCompoundProducedOn: { type: String },
    skimCompoundProducedOn: { type: String },
  },
  { _id: false }
);

const BeltSchema = new Schema<BeltDoc>(
  {
    beltNumber: { type: String, required: true, unique: true, trim: true },
    rating: String,
    fabricId: { type: Schema.Types.ObjectId, ref: 'Fabric' },

    topCoverMm: Number,
    bottomCoverMm: Number,
    beltLengthM: Number,
    beltWidthMm: Number,
    edge: { type: String, enum: ['Cut', 'Moulded'] },
    breakerPly: { type: Boolean, default: false },
    breakerPlyRemarks: String,
    carcassMm: Number,
    coverGrade: String,
    orderNumber: String,
    buyerName: String,
    orderDate: String,
    deliveryDeadline: String,
    process: {
      calendaringDate: String,
      calendaringMachine: String,
      greenBeltDate: String,
      greenBeltMachine: String,
      curingDate: String,
      curingMachine: String,
      inspectionDate: String,
      inspectionMachine: String,
      pidDate: String,
      packagingDate: String,
      dispatchDate: String,
      coverCompoundProducedOn: String,
      skimCompoundProducedOn: String,
    },
    coverBatchesUsed: { type: [BatchUsageSchema], default: [] },
    skimBatchesUsed: { type: [BatchUsageSchema], default: [] },
    status: { type: String, enum: ['Dispatched', 'In Production'], default: 'In Production' },
    entryType: { type: String, enum: ['Manual', 'Auto'], default: 'Auto' },
  },
  { timestamps: true }
);

const Belt =
  (mongoose.models.Belt as mongoose.Model<BeltDoc>) || mongoose.model<BeltDoc>('Belt', BeltSchema);

export default Belt;
