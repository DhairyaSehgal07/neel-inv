import mongoose, { Schema, Document } from "mongoose";
import {
  BeltStatus,
  EntryType,
  EdgeType,
  FabricType,
  CompoundType,
} from "@/lib/data";

// Sub-document schemas
const FabricInfoSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["EP", "NN", "EE", "Other"],
    },
    rating: String,
    strength: Number,
    supplier: String,
    rollNumber: String,
    consumedMeters: Number,
  },
  { _id: false }
);

const ProcessDatesSchema = new Schema(
  {
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
  },
  { _id: false }
);

const CompoundInfoSchema = new Schema(
  {
    coverCompoundType: {
      type: String,
      enum: [
        "Nylon",
        "Layer3",
        "Layer5",
        "FR",
        "HR",
        "SHR T1",
        "SHR T2",
        "UHR",
        "M-24",
        "N-17",
        "SKIM_N",
        "SKIM_L",
      ],
    },
    skimCompoundType: {
      type: String,
      enum: [
        "Nylon",
        "Layer3",
        "Layer5",
        "FR",
        "HR",
        "SHR T1",
        "SHR T2",
        "UHR",
        "M-24",
        "N-17",
        "SKIM_N",
        "SKIM_L",
      ],
    },
    coverCompoundProducedOn: String,
    skimCompoundProducedOn: String,
    coverCompoundConsumed: Number,
    skimCompoundConsumed: Number,
    coverBeltCode: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null/undefined values but enforces uniqueness for non-null values
    },
    skimBeltCode: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null/undefined values but enforces uniqueness for non-null values
    },
  },
  { _id: false }
);

// Main Belt schema
export interface BeltDocument extends Document {
  beltNumber: string;
  rating?: string;
  fabric?: {
    type?: FabricType;
    rating?: string;
    strength?: number;
    supplier?: string;
    rollNumber?: string;
    consumedMeters?: number;
  };
  topCoverMm?: number;
  bottomCoverMm?: number;
  beltLengthM?: number;
  beltWidthMm?: number;
  edge?: EdgeType;
  breakerPly?: boolean;
  breakerPlyRemarks?: string;
  carcassMm?: number;
  coverGrade?: string;
  orderNumber?: string;
  buyerName?: string;
  orderDate?: string;
  deliveryDeadline?: string;
  compound?: {
    coverCompoundType?: CompoundType;
    skimCompoundType?: CompoundType;
    coverCompoundProducedOn?: string;
    skimCompoundProducedOn?: string;
    coverCompoundConsumed?: number;
    skimCompoundConsumed?: number;
    coverBeltCode?: string;
    skimBeltCode?: string;
  };
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
  };
  status: BeltStatus;
  entryType?: EntryType;
  createdAt: Date;
  updatedAt: Date;
}

const BeltSchema: Schema<BeltDocument> = new Schema(
  {
    beltNumber: {
      type: String,
      required: [true, "Belt number is required"],
      trim: true,
      unique: true,
    },
    rating: {
      type: String,
      trim: true,
    },
    fabric: {
      type: FabricInfoSchema,
      default: {},
    },
    topCoverMm: {
      type: Number,
    },
    bottomCoverMm: {
      type: Number,
    },
    beltLengthM: {
      type: Number,
    },
    beltWidthMm: {
      type: Number,
    },
    edge: {
      type: String,
      enum: ["Cut", "Moulded"],
    },
    breakerPly: {
      type: Boolean,
      default: false,
    },
    breakerPlyRemarks: {
      type: String,
      trim: true,
    },
    carcassMm: {
      type: Number,
    },
    coverGrade: {
      type: String,
      trim: true,
    },
    orderNumber: {
      type: String,
      trim: true,
    },
    buyerName: {
      type: String,
      trim: true,
    },
    orderDate: {
      type: String,
    },
    deliveryDeadline: {
      type: String,
    },
    compound: {
      type: CompoundInfoSchema,
      default: {},
    },
    process: {
      type: ProcessDatesSchema,
      default: {},
    },
    status: {
      type: String,
      enum: ["Dispatched", "In Production"],
      required: [true, "Status is required"],
      default: "In Production",
    },
    entryType: {
      type: String,
      enum: ["Manual", "Auto"],
      default: "Auto",
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Note: Unique indexes for coverBeltCode and skimBeltCode are defined in the CompoundInfoSchema
// using unique: true and sparse: true in the field definitions

const BeltModel =
  (mongoose.models.Belt as mongoose.Model<BeltDocument>) ||
  mongoose.model<BeltDocument>("Belt", BeltSchema);

export default BeltModel;
