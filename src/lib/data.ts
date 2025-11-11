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

export interface ProcessDates {
  calendaringDate?: string; // ISO date strings for simplicity in UI fixture
  greenBeltDate?: string;
  curingDate?: string;
  inspectionDate?: string;
  pidDate?: string;
  packagingDate?: string;
  dispatchDate?: string;
}

export interface CompoundInfo {
  type?: CompoundType;
  producedOn?: string;
  usedOn?: string;
}

export interface FabricInfo {
  type?: FabricType;
  rating?: string;
  strength?: number;
  supplier?: string;
}

export interface Belt {
  id: string; // internal uniq id
  beltNumber: string; // visible number e.g. "Belt #14598"
  topCoverMm?: number;
  bottomCoverMm?: number;
  carcassMm?: number;
  rating?: string;
  fabric?: FabricInfo;
  compound?: CompoundInfo;
  process?: ProcessDates;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fabric rating -> strength lookup (partial; add rest from the doc)
 * Use this in the UI to auto-fill fabric.strength when rating is selected.
 */
export const FABRIC_LOOKUP: FabricLookupItem[] = [
  { rating: '200/2', strength: 100 },
  { rating: '250/2', strength: 125 },
  { rating: '300/2', strength: 150 },
  { rating: '300/3', strength: 100 },
  { rating: '315/3', strength: 100 },
  { rating: '400/3', strength: 125 },
  { rating: '450/3', strength: 150 },
  { rating: '480/3', strength: 160 },
  { rating: '500/2', strength: 250 },
  { rating: '500/3', strength: 160 },
  { rating: '500/4', strength: 125 },
  { rating: '600/2', strength: 300 },
  { rating: '600/3', strength: 200 },
  { rating: '630/3', strength: 200 },
  { rating: '630/4', strength: 160 },
  { rating: '650/4', strength: 160 },
  { rating: '700/2', strength: 350 },
  { rating: '750/3', strength: 250 },
  { rating: '800/2', strength: 400 },
  { rating: '800/4', strength: 200 },
  { rating: '1000/4', strength: 250 },
  { rating: '1250/4', strength: 315 },
  { rating: '1250/5', strength: 250 },
  { rating: '1400/4', strength: 350 },
  { rating: '1400/5', strength: 350 },
  { rating: '1600/4', strength: 400 },
  { rating: '1600/5', strength: 315 },
  { rating: '1800/5', strength: 350 },
  { rating: '2000/5', strength: 400 },
  // add remaining rows as needed
];

/**
 * Some compound options for dropdowns in UI
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
 * Minimal holiday list for development/testing (ISO date strings)
 * Expand later from Settings UI
 */
export const HOLIDAYS = [
  '2025-01-26', // example: Republic Day (India)
  '2025-08-15', // Independence Day
  // add sample dates as needed
];

/**
 * Seed sample belts to test UI forms / editing / list
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
    compound: { type: 'Layer3', producedOn: '2025-11-03', usedOn: '2025-11-10' },
    process: {
      calendaringDate: '2025-11-10',
      curingDate: '2025-11-11',
      inspectionDate: '2025-11-14',
    },
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
    compound: { type: 'FR', producedOn: '2025-10-01', usedOn: '2025-10-08' },
    process: {
      calendaringDate: '2025-10-08',
      curingDate: '2025-10-09',
      inspectionDate: '2025-10-12',
      dispatchDate: '2025-10-20',
    },
    createdAt: '2025-10-01T08:00:00.000Z',
  },
];


// src/lib/data.ts

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
