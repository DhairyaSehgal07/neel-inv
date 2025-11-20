import { z } from 'zod';

export const batchUsageSchema = z.object({
  batchId: z.string(),
  consumedKg: z.number(),
});

export const beltProcessSchema = z.object({
  calendaringDate: z.string().optional(),
  calendaringMachine: z.string().optional(),
  greenBeltDate: z.string().optional(),
  greenBeltMachine: z.string().optional(),
  curingDate: z.string().optional(),
  curingMachine: z.string().optional(),
  inspectionDate: z.string().optional(),
  inspectionMachine: z.string().optional(),
  pidDate: z.string().optional(),
  packagingDate: z.string().optional(),
  dispatchDate: z.string().optional(),
});

export const createBeltSchema = z.object({
  beltNumber: z.string(),

  rating: z.string().optional(),
  fabricId: z.string().optional(),

  topCoverMm: z.number().optional(),
  bottomCoverMm: z.number().optional(),
  beltLengthM: z.number().optional(),
  beltWidthMm: z.number().optional(),
  edge: z.enum(['Cut', 'Moulded']).optional(),

  breakerPly: z.boolean().optional(),
  breakerPlyRemarks: z.string().optional(),
  carcassMm: z.number().optional(),
  coverGrade: z.string().optional(),

  orderNumber: z.string().optional(),
  buyerName: z.string().optional(),
  orderDate: z.string().optional(),
  deliveryDeadline: z.string().optional(),

  process: beltProcessSchema.optional(),

  coverBatchesUsed: z.array(batchUsageSchema).optional(),
  skimBatchesUsed: z.array(batchUsageSchema).optional(),

  status: z.enum(['Dispatched', 'In Production']).optional(),
  entryType: z.enum(['Manual', 'Auto']).optional(),
});
