import mongoose, { Schema, Document } from 'mongoose';

export interface BeltDocument extends Document {
  beltNumber: string;
  rating?: string;

  topCoverMm?: number;
  bottomCoverMm?: number;
  beltLengthM?: number;
  beltWidthMm?: number;
  edge?: string;
  carcassMm?: number;

  breakerPly?: boolean;
  breakerPlyRemarks?: string;

  coverGrade?: string;

  orderNumber?: string;
  buyerName?: string;
  orderDate?: string;
  deliveryDeadline?: string;

  status: 'Dispatched' | 'In Production';
  entryType?: 'Manual' | 'Auto';

  fabric?: mongoose.Types.ObjectId; // ref: FabricInfo
  process?: mongoose.Types.ObjectId; // ref: ProcessDates
  // compound?: mongoose.Types.ObjectId (will add later)

  createdAt: Date;
  updatedAt: Date;
}

const BeltSchema = new Schema<BeltDocument>(
  {
    beltNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    rating: String,

    topCoverMm: Number,
    bottomCoverMm: Number,
    beltLengthM: Number,
    beltWidthMm: Number,

    edge: {
      type: String,
      enum: ['Cut', 'Moulded'],
    },

    carcassMm: Number,

    breakerPly: {
      type: Boolean,
      default: false,
    },

    breakerPlyRemarks: String,

    coverGrade: String,

    orderNumber: String,
    buyerName: String,
    orderDate: String,
    deliveryDeadline: String,

    status: {
      type: String,
      enum: ['Dispatched', 'In Production'],
      default: 'In Production',
      required: true,
    },

    entryType: {
      type: String,
      enum: ['Manual', 'Auto'],
      default: 'Auto',
    },

    // References
    fabric: {
      type: Schema.Types.ObjectId,
      ref: 'FabricInfo',
    },

    process: {
      type: Schema.Types.ObjectId,
      ref: 'ProcessDates',
    },
  },
  { timestamps: true }
);

const BeltModel =
  (mongoose.models.Belt as mongoose.Model<BeltDocument>) ||
  mongoose.model<BeltDocument>('Belt', BeltSchema);

export default BeltModel;
