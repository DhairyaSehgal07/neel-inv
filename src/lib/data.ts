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

export type EdgeType = 'Cut' | 'Moulded';
export type BeltStatus = 'Dispatched' | 'In Production';
export type EntryType = 'Manual' | 'Auto';

export interface FabricLookupItem {
  rating: string;
  strength: number;
}

export interface ProcessDates {
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
}

export interface CompoundInfo {
  coverCompoundType?: CompoundType;
  skimCompoundType?: CompoundType;
  coverCompoundProducedOn?: string;
  skimCompoundProducedOn?: string;
  coverCompoundConsumed?: number;
  skimCompoundConsumed?: number;
  coverBeltCode?: string;
  skimBeltCode?: string;
}

export interface FabricInfo {
  type?: FabricType;
  rating?: string;
  strength?: number;
  supplier?: string;
  rollNumber?: string;
  consumedMeters?: number;
}

export interface Belt {
  id: string;
  beltNumber: string;
  rating?: string;
  fabric?: FabricInfo;
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
  compound?: CompoundInfo;
  process?: ProcessDates;
  status: BeltStatus;
  entryType?: EntryType;
  createdAt?: string;
}

/**
 * Fabric rating to strength lookup table
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
 * Available compound types
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

export const HOLIDAYS = [
  '2025-01-26', // Republic Day (India)
  '2025-08-15', // Independence Day
  '2025-10-02', // Gandhi Jayanti
  '2025-11-01', // Diwali (example)
  '2025-12-25', // Christmas
];

export const SAMPLE_BELTS: Belt[] = [
  {
    id: 'belt-001',
    beltNumber: 'BELT-2025-001',
    rating: '630/4',
    fabric: {
      type: 'EP',
      rating: '630/4',
      strength: 160,
      supplier: 'ABC Fabrics Ltd.',
      rollNumber: 'RL-98231',
      consumedMeters: 120,
    },
    topCoverMm: 6,
    bottomCoverMm: 4,
    beltLengthM: 250,
    beltWidthMm: 1200,
    edge: 'Cut',
    breakerPly: false,
    carcassMm: 4.5,
    coverGrade: 'M-24',
    orderNumber: 'ORD-7891',
    buyerName: 'Shivam Minerals Pvt Ltd.',
    orderDate: '2025-02-10',
    deliveryDeadline: '2025-03-05',
    compound: {
      coverCompoundType: 'M-24',
      skimCompoundType: 'SKIM_N',
      coverCompoundProducedOn: '2025-02-12',
      skimCompoundProducedOn: '2025-02-12',
      coverCompoundConsumed: 320,
      skimCompoundConsumed: 180,
    },
    process: {
      calendaringDate: '2025-02-15',
      calendaringMachine: 'CAL-02',
      greenBeltDate: '2025-02-17',
      greenBeltMachine: 'GB-01',
      curingDate: '2025-02-22',
      curingMachine: 'CUR-03',
      inspectionDate: '2025-02-24',
      inspectionMachine: 'INSP-01',
      pidDate: '2025-02-25',
      packagingDate: '2025-02-26',
    },
    status: 'In Production',
    entryType: 'Auto',
    createdAt: '2025-02-10T10:22:00Z',
  },

  {
    id: 'belt-002',
    beltNumber: 'BELT-2025-002',
    rating: '800/4',
    fabric: {
      type: 'NN',
      rating: '800/4',
      strength: 200,
      supplier: 'Global Belt Fabrics',
      rollNumber: 'RL-77122',
      consumedMeters: 150,
    },
    topCoverMm: 8,
    bottomCoverMm: 5,
    beltLengthM: 320,
    beltWidthMm: 1400,
    edge: 'Moulded',
    breakerPly: true,
    breakerPlyRemarks: 'Breaker ply added for impact resistance',
    carcassMm: 5,
    coverGrade: 'HR',
    orderNumber: 'ORD-8105',
    buyerName: 'Sunrise Coal Traders',
    orderDate: '2025-03-01',
    deliveryDeadline: '2025-03-25',
    compound: {
      coverCompoundType: 'HR',
      skimCompoundType: 'SKIM_L',
      coverCompoundProducedOn: '2025-03-03',
      skimCompoundProducedOn: '2025-03-03',
      coverCompoundConsumed: 400,
      skimCompoundConsumed: 210,
    },
    process: {
      calendaringDate: '2025-03-06',
      calendaringMachine: 'CAL-01',
      greenBeltDate: '2025-03-09',
      curingDate: '2025-03-14',
      curingMachine: 'CUR-01',
      inspectionDate: '2025-03-16',
      pidDate: '2025-03-17',
      packagingDate: '2025-03-18',
      dispatchDate: '2025-03-19',
    },
    status: 'Dispatched',
    entryType: 'Manual',
    createdAt: '2025-03-01T08:10:00Z',
  },

  {
    id: 'belt-003',
    beltNumber: 'BELT-2025-003',
    rating: '500/3',
    fabric: {
      type: 'EE',
      rating: '500/3',
      strength: 160,
      supplier: 'Fine Weave Industries',
      rollNumber: 'RL-55108',
      consumedMeters: 90,
    },
    topCoverMm: 5,
    bottomCoverMm: 3,
    beltLengthM: 180,
    beltWidthMm: 1000,
    edge: 'Cut',
    breakerPly: false,
    carcassMm: 4,
    coverGrade: 'N-17',
    orderNumber: 'ORD-5543',
    buyerName: 'Patel Aggregates',
    orderDate: '2025-01-15',
    deliveryDeadline: '2025-02-10',
    compound: {
      coverCompoundType: 'N-17',
      skimCompoundType: 'SKIM_N',
      coverCompoundProducedOn: '2025-01-18',
      skimCompoundProducedOn: '2025-01-18',
      coverCompoundConsumed: 260,
      skimCompoundConsumed: 130,
    },
    process: {
      calendaringDate: '2025-01-20',
      greenBeltDate: '2025-01-22',
      curingDate: '2025-01-28',
      inspectionDate: '2025-01-29',
      pidDate: '2025-01-30',
      packagingDate: '2025-01-31',
    },
    status: 'In Production',
    entryType: 'Auto',
    createdAt: '2025-01-15T09:15:00Z',
  },
];
