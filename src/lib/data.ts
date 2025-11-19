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

  export type CoverCompoundType = 'Nk-1' | 'Nk-2' | 'Nk-3' | 'Nk-4' | 'Nk-5' | 'Nk-6' | 'Nk-7' | 'Nk-8' | 'Nk-9' | 'Nk-10' | 'Nk-11' | 'Nk-12' | 'Nk-13';

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

export const FABRIC_TYPES = [
  'EP', 'NN', 'EE', 'Other'
]

export const EDGE_TYPES = [
  'Cut', 'Moulded'
]

export const BELT_STATUS = [
  'Dispatched', 'In Production'
]