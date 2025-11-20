// src/lib/belt-utils.ts
import { Belt } from '@/types/belt';
import { BeltDoc } from '@/model/Belt';

/**
 * Convert MongoDB Belt document to frontend Belt format
 * Converts _id to id and handles date formatting
 */
export function convertBeltDocumentToBelt(doc: BeltDoc | null): Belt | null {
  if (!doc) return null;

  const belt = doc.toObject();

  return {
    id: belt._id.toString(),
    beltNumber: belt.beltNumber,
    rating: belt.rating,
    strength: belt.strength,
    fabric: belt.fabric,
    topCoverMm: belt.topCoverMm,
    bottomCoverMm: belt.bottomCoverMm,
    beltLengthM: belt.beltLengthM,
    beltWidthMm: belt.beltWidthMm,
    edge: belt.edge,
    breakerPly: belt.breakerPly,
    breakerPlyRemarks: belt.breakerPlyRemarks,
    carcassMm: belt.carcassMm,
    coverGrade: belt.coverGrade,
    orderNumber: belt.orderNumber,
    buyerName: belt.buyerName,
    orderDate: belt.orderDate,
    deliveryDeadline: belt.deliveryDeadline,
    compound: belt.compound,
    process: belt.process,
    status: belt.status,
    entryType: belt.entryType,
    createdAt: belt.createdAt?.toISOString(),
  };
}

/**
 * Convert array of MongoDB Belt documents to frontend Belt format
 */
export function convertBeltDocumentsToBelts(docs: BeltDoc[]): Belt[] {
  return docs.map((doc) => convertBeltDocumentToBelt(doc)!).filter(Boolean);
}
