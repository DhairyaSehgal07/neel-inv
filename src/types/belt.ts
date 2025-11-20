export interface BeltFormData {
  beltNumber: string;
  rating: string;
  beltStrength?: number | string;
  fabricType: string;
  topCover?: number | string;
  bottomCover?: number | string;
  beltLength?: number | string;
  beltWidth?: number | string;
  edge: string;
  carcass?: number | string;
  coverGrade: string;
  breakerPly: boolean;
  breakerPlyRemarks?: string;
  orderNumber: string;
  buyerName: string;
  orderDate?: Date;
  deliveryDeadline?: Date;
  status: string;
  fabricSupplier: string;
  rollNumber: string;
  fabricConsumed?: number | string;
  coverCompoundType: string;
  skimCompoundType: string;
  coverCompoundConsumed?: number | string;
  skimCompoundConsumed?: number | string;
  dispatchDate?: Date;
  packagingDate?: Date;
  pdiDate?: Date;
  inspectionDate?: Date;
  inspectionStation: string;
  curingDate?: Date;
  pressStation: string;
  greenBeltDate?: Date;
  greenBeltStation: string;
  calendaringDate?: Date;
  calendaringStation: string;
  coverCompoundProducedOn?: Date;
  skimCompoundProducedOn?: Date;
}


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

export type CoverCompoundType =
  | 'Nk-1'
  | 'Nk-2'
  | 'Nk-3'
  | 'Nk-4'
  | 'Nk-5'
  | 'Nk-6'
  | 'Nk-7'
  | 'Nk-8'
  | 'Nk-9'
  | 'Nk-10'
  | 'Nk-11'
  | 'Nk-12'
  | 'Nk-13';

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
  strength?: number;
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