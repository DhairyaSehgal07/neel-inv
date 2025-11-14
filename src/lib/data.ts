// src/lib/data.ts
export type FabricType = 'EP' | 'NN' | 'EE' | 'Other';
export type CompoundType =
  | 'Nylon'
  | 'Layer3'
  | 'Layer5'
  | 'FR'
  | 'HR'
  | 'SHR T1'
  | 'SHR T2'
  | 'UHR'
  | 'M-24'
  | 'N-17'
  | 'SKIM_N'
  | 'SKIM_L';

export interface FabricLookupItem {
  rating: string; // e.g. "630/4"
  strength: number; // numeric strength lookup
}

export type EdgeType = 'Cut' | 'Moulded';
export type TrackingMode = 'auto' | 'manual';

export interface ProcessDates {
  calendaringDate?: string; // ISO date strings
  calendaringMachine?: string; // Cal #
  greenBeltDate?: string;
  greenBeltMachine?: string; // Table #
  curingDate?: string;
  curingMachine?: string; // Press #
  inspectionDate?: string;
  inspectionMachine?: string; // Inspection Press#
  pidDate?: string;
  packagingDate?: string;
  dispatchDate?: string;
}

export interface CompoundInfo {
  type?: CompoundType;
  producedOn?: string;
  usedOn?: string;
  lotSize?: number; // Batch weight
  batchWeight?: number; // Alternative name for lot size
  compoundId?: string; // Generated ID: compoundType_date (e.g., "M-24_2025-11-03")
}

export interface FabricInfo {
  type?: FabricType;
  rating?: string;
  strength?: number;
  supplier?: string;
  rollNumber?: string;
}

export interface Belt {
  id: string;
  beltNumber: string;
  rating?: string;
  fabric?: FabricInfo;
  topCoverMm?: number;
  bottomCoverMm?: number;
  edge?: EdgeType;
  breakerPly?: boolean;
  breakerPlyRemarks?: string;
  carcassMm?: number;
  orderNumber?: string;
  buyerName?: string;
  orderDate?: string;
  deliveryDeadline?: string;
  compound?: CompoundInfo;
  process?: ProcessDates;
  status: 'Dispatched' | 'In Production';
  trackingMode?: TrackingMode; // 'auto' or 'manual' for In Production belts
  createdAt?: string;
}

/**
 * Complete Fabric rating -> strength lookup table from PRD
 */
export const FABRIC_LOOKUP: FabricLookupItem[] = [
  { rating: '200/2', strength: 100 },
  { rating: '250/2', strength: 125 },
  { rating: '315/3', strength: 100 },
  { rating: '400/3', strength: 125 },
  { rating: '500/3', strength: 160 },
  { rating: '630/3', strength: 200 },
  { rating: '400/4', strength: 100 },
  { rating: '500/4', strength: 125 },
  { rating: '630/4', strength: 160 },
  { rating: '800/4', strength: 200 },
  { rating: '1000/4', strength: 250 },
  { rating: '1250/4', strength: 315 },
  { rating: '1400/4', strength: 350 },
  { rating: '1250/5', strength: 250 },
  { rating: '1400/5', strength: 350 },
  { rating: '1600/5', strength: 315 },
  { rating: '1800/5', strength: 350 },
  { rating: '2000/5', strength: 400 },
  { rating: '600/3', strength: 200 },
  { rating: '1050/3', strength: 350 },
  { rating: '400/2', strength: 200 },
  { rating: '700/2', strength: 350 },
  { rating: '600/2', strength: 300 },
  { rating: '300/2', strength: 150 },
  { rating: '800/2', strength: 400 },
  { rating: '750/3', strength: 250 },
  { rating: '450/3', strength: 150 },
  { rating: '300/3', strength: 100 },
  { rating: '650/4', strength: 160 },
  { rating: '480/3', strength: 160 },
  { rating: '1600/4', strength: 400 },
  { rating: '500/2', strength: 250 },
];

/**
 * Compound options for dropdowns
 */
export const COMPOUNDS: CompoundType[] = [
  'Nylon',
  'Layer3',
  'Layer5',
  'FR',
  'HR',
  'SHR T1',
  'SHR T2',
  'UHR',
  'M-24',
  'N-17',
  'SKIM_N',
  'SKIM_L',
];

/**
 * Holiday list (ISO date strings) - excludes Sundays and government holidays
 * Expand later from Settings UI
 */
export const HOLIDAYS = [
  '2025-01-26', // Republic Day (India)
  '2025-08-15', // Independence Day
  '2025-10-02', // Gandhi Jayanti
  '2025-11-01', // Diwali (example)
  '2025-12-25', // Christmas
];

/**
 * Sample belts for testing
 */
export const SAMPLE_BELTS: Belt[] = [
  {
    id: 'b1',
    beltNumber: 'Belt #14598',
    rating: '630/4',
    topCoverMm: 6,
    bottomCoverMm: 3,
    carcassMm: 0,
    fabric: { type: 'EP', rating: '630/4', strength: 160, supplier: 'Alpha Fabrics' },
    compound: { type: 'Layer3', producedOn: '2025-11-03', usedOn: '2025-11-10', compoundId: 'Layer3_2025-11-03' },
    process: {
      calendaringDate: '2025-11-10',
      greenBeltDate: '2025-11-10',
      curingDate: '2025-11-11',
      inspectionDate: '2025-11-14',
    },
    orderNumber: 'ORD-2025-001',
    buyerName: 'ABC Industries',
    orderDate: '2025-10-15',
    deliveryDeadline: '2025-11-30',
    status: 'In Production',
    createdAt: '2025-11-01T08:00:00.000Z',
  },
  {
    id: 'b2',
    beltNumber: 'Belt #14599',
    rating: '500/3',
    topCoverMm: 5,
    bottomCoverMm: 2,
    carcassMm: 0,
    fabric: { type: 'NN', rating: '500/3', strength: 160, supplier: 'Beta Textiles' },
    compound: { type: 'FR', producedOn: '2025-10-01', usedOn: '2025-10-08', compoundId: 'FR_2025-10-01' },
    process: {
      calendaringDate: '2025-10-08',
      greenBeltDate: '2025-10-08',
      curingDate: '2025-10-09',
      inspectionDate: '2025-10-12',
      pidDate: '2025-10-15',
      packagingDate: '2025-10-18',
      dispatchDate: '2025-10-20',
    },
    orderNumber: 'ORD-2025-002',
    buyerName: 'XYZ Corp',
    orderDate: '2025-09-20',
    deliveryDeadline: '2025-10-25',
    status: 'Dispatched',
    createdAt: '2025-10-01T08:00:00.000Z',
  },
];

// Legacy type for backward compatibility
export type ReverseTrackingRecord = {
  id: string;
  batchNumber: string;
  date: string;
  productType: string;
  quantityReturned: number;
  reason: string;
  processedBy: string;
  status: "Pending" | "Processed" | "Rejected";
};

export const reverseTrackingData: ReverseTrackingRecord[] = [
  {
    id: "1",
    batchNumber: "NRM-2025-001",
    date: "2025-11-10",
    productType: "Rubber Hose",
    quantityReturned: 20,
    reason: "Defective material",
    processedBy: "Ramesh",
    status: "Pending",
  },
  {
    id: "2",
    batchNumber: "NRM-2025-002",
    date: "2025-11-09",
    productType: "Rubber Sheet",
    quantityReturned: 10,
    reason: "Size mismatch",
    processedBy: "Suresh",
    status: "Processed",
  },
  {
    id: "3",
    batchNumber: "NRM-2025-003",
    date: "2025-11-08",
    productType: "Rubber Gasket",
    quantityReturned: 15,
    reason: "Late return",
    processedBy: "Mahesh",
    status: "Rejected",
  },
];
