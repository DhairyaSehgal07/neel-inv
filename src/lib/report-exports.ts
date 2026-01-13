import * as XLSX from 'xlsx';
import { BeltDoc } from '@/model/Belt';
import { CompoundBatchDoc } from '@/model/CompoundBatch';
import { CompoundMasterReportData } from '@/services/api/queries/compounds/clientCompoundMasterReport';
import { roundToNearest5 } from '@/lib/utils';

// Helper function to format date
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'N/A';
  }
};

// Helper function to format compound code like nk5-20251029
const formatCompoundCode = (code?: string, producedOn?: string, consumedOn?: string): string => {
  if (!code) return 'N/A';
  const dateToUse = producedOn || consumedOn;
  if (!dateToUse) return code;
  const formattedDate = dateToUse.replace(/-/g, '');
  return `${code}-${formattedDate}`;
};

// Helper function to get all compounds for a belt
interface CompoundRow {
  type: 'Cover' | 'Skim';
  code: string;
  producedOn: string;
  consumedOn: string;
  weight: string;
}

const getCompounds = (belt: BeltDoc): CompoundRow[] => {
  const compounds: CompoundRow[] = [];

  // Add cover compounds
  if (belt.coverBatchesUsed && belt.coverBatchesUsed.length > 0) {
    belt.coverBatchesUsed.forEach((batch) => {
      const formattedCode = formatCompoundCode(
        batch.compoundCode,
        batch.coverCompoundProducedOn,
        batch.date
      );
      const producedOn = formatDate(batch.coverCompoundProducedOn);
      const consumedOn = formatDate(batch.date);
      const consumedKg = batch.consumedKg
        ? `${roundToNearest5(Number(batch.consumedKg)).toFixed(2)} kg`
        : 'N/A';
      compounds.push({
        type: 'Cover',
        code: formattedCode,
        producedOn,
        consumedOn,
        weight: consumedKg,
      });
    });
  }

  // Add skim compounds
  if (belt.skimBatchesUsed && belt.skimBatchesUsed.length > 0) {
    belt.skimBatchesUsed.forEach((batch) => {
      const formattedCode = formatCompoundCode(
        batch.compoundCode,
        batch.skimCompoundProducedOn,
        batch.date
      );
      const producedOn = formatDate(batch.skimCompoundProducedOn);
      const consumedOn = formatDate(batch.date);
      const consumedKg = batch.consumedKg
        ? `${roundToNearest5(Number(batch.consumedKg)).toFixed(2)} kg`
        : 'N/A';
      compounds.push({
        type: 'Skim',
        code: formattedCode,
        producedOn,
        consumedOn,
        weight: consumedKg,
      });
    });
  }

  return compounds.length > 0 ? compounds : [{ type: 'Cover' as const, code: 'N/A', producedOn: 'N/A', consumedOn: 'N/A', weight: 'N/A' }];
};

// Export Belts Report to XLSX
export const exportBeltsToXLSX = (belts: BeltDoc[]) => {
  try {
    const excelData = belts.map((belt, index) => ({
      'S.No.': index + 1,
      'Belt No.': belt.beltNumber,
      'Width (mm)': belt.beltWidthMm || '',
      'Belt Rating': belt.rating || '',
      'Fabric Type': belt.fabric?.type || 'N/A',
      'Top Cover (mm)': belt.topCoverMm || '',
      'Bottom Cover (mm)': belt.bottomCoverMm || '',
      'Cover Grade': belt.coverGrade || '',
      'Edge': belt.edge || '',
      'Length (m)': belt.beltLengthM || '',
      'Status': belt.status || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 8 },  // S.No.
      { wch: 12 }, // Belt No.
      { wch: 12 }, // Width
      { wch: 12 }, // Belt Rating
      { wch: 12 }, // Fabric Type
      { wch: 12 }, // Top
      { wch: 15 }, // Bottom
      { wch: 12 }, // Cover Grade
      { wch: 10 }, // Edge
      { wch: 12 }, // Length
      { wch: 12 }, // Status
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Belts Report');
    const fileName = `Belts_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Error generating XLSX:', error);
    throw error;
  }
};

// Export Master Belt Report to XLSX
export const exportMasterBeltToXLSX = (belts: BeltDoc[]) => {
  try {
    const excelData: Array<{
      'S.No.': number | string;
      'Belt No.': string;
      'Width (mm)': string | number;
      'Rating': string;
      'Fabric Type': string;
      'Top (mm)': string | number;
      'Bottom (mm)': string | number;
      'Cover Grade': string;
      'Edge': string;
      'Length (m)': string | number;
      'Compound Code': string;
      'Produced': string;
      'Consumed': string;
      'Weight': string;
    }> = [];

    belts.forEach((belt, index) => {
      const compounds = getCompounds(belt);
      compounds.forEach((compound, compoundIndex) => {
        excelData.push({
          'S.No.': compoundIndex === 0 ? index + 1 : '',
          'Belt No.': compoundIndex === 0 ? belt.beltNumber : '',
          'Width (mm)': compoundIndex === 0 ? (belt.beltWidthMm || '') : '',
          'Rating': compoundIndex === 0 ? (belt.rating || '') : '',
          'Fabric Type': compoundIndex === 0 ? (belt.fabric?.type || 'N/A') : '',
          'Top (mm)': compoundIndex === 0 ? (belt.topCoverMm || '') : '',
          'Bottom (mm)': compoundIndex === 0 ? (belt.bottomCoverMm || '') : '',
          'Cover Grade': compoundIndex === 0 ? (belt.coverGrade || '') : '',
          'Edge': compoundIndex === 0 ? (belt.edge || '') : '',
          'Length (m)': compoundIndex === 0 ? (belt.beltLengthM || '') : '',
          'Compound Code': compound.code,
          'Produced': compound.producedOn,
          'Consumed': compound.consumedOn,
          'Weight': compound.weight,
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 8 },  // S.No.
      { wch: 12 }, // Belt No.
      { wch: 12 }, // Width
      { wch: 12 }, // Rating
      { wch: 12 }, // Fabric Type
      { wch: 12 }, // Top
      { wch: 12 }, // Bottom
      { wch: 12 }, // Cover Grade
      { wch: 10 }, // Edge
      { wch: 12 }, // Length
      { wch: 20 }, // Compound Code
      { wch: 15 }, // Produced
      { wch: 15 }, // Consumed
      { wch: 12 }, // Weight
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Master Belt Report');
    const fileName = `Master_Belt_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Error generating XLSX:', error);
    throw error;
  }
};

// Export Compound Batches Report to XLSX
export const exportCompoundBatchesToXLSX = (batches: CompoundBatchDoc[]) => {
  try {
    const excelData = batches.map((batch, index) => {
      const producedOnDate = batch.coverCompoundProducedOn || batch.skimCompoundProducedOn;
      const dateToUse = producedOnDate || batch.date;
      const formattedDate = dateToUse ? dateToUse.replace(/-/g, '') : '';
      const compoundCode = `${batch.compoundCode}-${formattedDate}`;

      let producedOn = '-';
      if (batch.coverCompoundProducedOn && batch.skimCompoundProducedOn) {
        const coverDate = new Date(batch.coverCompoundProducedOn).toLocaleDateString();
        const skimDate = new Date(batch.skimCompoundProducedOn).toLocaleDateString();
        producedOn = `Cover: ${coverDate}, Skim: ${skimDate}`;
      } else if (batch.coverCompoundProducedOn) {
        producedOn = new Date(batch.coverCompoundProducedOn).toLocaleDateString();
      } else if (batch.skimCompoundProducedOn) {
        producedOn = new Date(batch.skimCompoundProducedOn).toLocaleDateString();
      }

      return {
        'S.No.': index + 1,
        'Compound Code': compoundCode,
        'Compound Name': batch.compoundName || '',
        'Produced On': producedOn,
        'Consumed On': batch.date ? new Date(batch.date).toLocaleDateString() : '-',
        'Batches': batch.batches,
        'Weight/Batch (kg)': roundToNearest5(Number(batch.weightPerBatch)).toFixed(2),
        'Total Inventory (kg)': roundToNearest5(Number(batch.totalInventory)).toFixed(2),
        'Remaining (kg)': roundToNearest5(Number(batch.inventoryRemaining)).toFixed(2),
        'Consumed (kg)': roundToNearest5(Number(batch.consumed)).toFixed(2),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 8 },  // S.No.
      { wch: 18 }, // Compound Code
      { wch: 20 }, // Compound Name
      { wch: 25 }, // Produced On
      { wch: 15 }, // Consumed On
      { wch: 10 }, // Batches
      { wch: 18 }, // Weight/Batch
      { wch: 20 }, // Total Inventory
      { wch: 15 }, // Remaining
      { wch: 15 }, // Consumed
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Compound Batches Report');
    const fileName = `Compound_Batches_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Error generating XLSX:', error);
    throw error;
  }
};

// Export Compound Master Report to XLSX
export const exportCompoundMasterToXLSX = (data: CompoundMasterReportData[]) => {
  try {
    const excelData: Record<string, string | number>[] = [];

    data.forEach((row, index) => {
      // Use materialsUsed if available (includes codes), otherwise fallback to rawMaterials
      const materialsUsed = row.materialsUsed && row.materialsUsed.length > 0
        ? row.materialsUsed
        : (row.rawMaterials || []).map(name => ({ materialName: name, materialCode: '' }));

      // Format compound code
      const compoundCode = row.producedOn
        ? `${row.compoundCode}-${row.producedOn.replace(/-/g, '')}`
        : row.compoundCode;

      // Main row with first raw material (or N/A if none)
      excelData.push({
        'S.No.': index + 1,
        'Compound Code': compoundCode,
        'Compound Name': row.compoundName,
        'Produced On': formatDate(row.producedOn),
        'Consumed On': formatDate(row.consumedOn),
        'Batches': row.numberOfBatches,
        'Weight per Batch (kg)': roundToNearest5(row.weightPerBatch).toFixed(2),
        'Total Inventory (kg)': roundToNearest5(row.totalInventory).toFixed(2),
        'Remaining (kg)': roundToNearest5(row.remaining).toFixed(2),
        'Belt Numbers': row.beltNumbers.length > 0 ? row.beltNumbers.join(', ') : 'N/A',
        'Material Name': materialsUsed.length > 0 ? materialsUsed[0].materialName : 'N/A',
        'Material Code': materialsUsed.length > 0 && materialsUsed[0].materialCode ? materialsUsed[0].materialCode : 'N/A',
      });

      // Additional rows for remaining raw materials
      materialsUsed.slice(1).forEach((material) => {
        excelData.push({
          'S.No.': '',
          'Compound Code': '',
          'Compound Name': '',
          'Produced On': '',
          'Consumed On': '',
          'Batches': '',
          'Weight per Batch (kg)': '',
          'Total Inventory (kg)': '',
          'Remaining (kg)': '',
          'Belt Numbers': '',
          'Material Name': material.materialName,
          'Material Code': material.materialCode || 'N/A',
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 8 },  // S.No.
      { wch: 18 }, // Compound Code
      { wch: 22 }, // Compound Name
      { wch: 13 }, // Produced On
      { wch: 13 }, // Consumed On
      { wch: 12 }, // Number of Batches
      { wch: 16 }, // Weight per Batch
      { wch: 18 }, // Total Inventory
      { wch: 13 }, // Remaining
      { wch: 25 }, // Belt Numbers
      { wch: 20 }, // Material Name
      { wch: 25 }, // Material Code
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Compound Master Report');
    const fileName = `Compound_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Error generating XLSX:', error);
    throw error;
  }
};
