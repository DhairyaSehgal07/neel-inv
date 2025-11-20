import mongoose, { Schema, Document } from 'mongoose';

export interface ProcessDatesDocument extends Document {
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
}

const ProcessDatesSchema = new Schema<ProcessDatesDocument>(
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

    // auto-calculated — but stored here
    coverCompoundProducedOn: String,
    skimCompoundProducedOn: String,
  },
  { timestamps: true }
);

const ProcessDatesModel =
  (mongoose.models.ProcessDates as mongoose.Model<ProcessDatesDocument>) ||
  mongoose.model<ProcessDatesDocument>('ProcessDates', ProcessDatesSchema);

export default ProcessDatesModel;
