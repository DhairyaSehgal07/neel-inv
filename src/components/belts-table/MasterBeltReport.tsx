import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { BeltDoc } from '@/model/Belt';
import { Eye, X, Download, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { roundToNearest5 } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

interface MasterBeltReportProps {
  belts: BeltDoc[];
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  date: {
    fontSize: 11,
    color: '#666',
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  col1: { width: '5.5%', fontSize: 7 }, // S.No.
  col2: { width: '7.5%', fontSize: 7 }, // Belt No.
  col3: { width: '6%', fontSize: 7 }, // Width
  col4: { width: '7%', fontSize: 7 }, // Rating
  col5: { width: '7%', fontSize: 7 }, // Fabric Type
  col6: { width: '5%', fontSize: 7 }, // Top
  col7: { width: '5%', fontSize: 7 }, // Bottom
  col8: { width: '7%', fontSize: 7 }, // Cover Grade
  col9: { width: '5%', fontSize: 7 }, // Edge
  col10: { width: '6%', fontSize: 7 }, // Length
  col11: { width: '12%', fontSize: 7 }, // Compound Code
  col12: { width: '10%', fontSize: 7 }, // Produced
  col13: { width: '10%', fontSize: 7 }, // Consumed
  col14: { width: '8%', fontSize: 7 }, // Weight
  subHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

// Helper function to safely format date
const formatDate = (dateString?: string): string => {
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
  // Use producedOn date if available, otherwise fall back to consumedOn date
  const dateToUse = producedOn || consumedOn;
  if (!dateToUse) return code;
  // Format date from YYYY-MM-DD to YYYYMMDD (remove dashes)
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

const MasterBeltPDFDocument: React.FC<{ belts: BeltDoc[] }> = ({ belts }) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Neelkanthrubber Mills Master Belt Report</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </View>

        <View style={styles.table}>
          {/* Main Header Row */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>S.No.</Text>
            <Text style={styles.col2}>Belt No.</Text>
            <Text style={styles.col3}>Width</Text>
            <Text style={styles.col4}>Rating</Text>
            <Text style={styles.col5}>Fabric Type</Text>
            <Text style={styles.col6}>Top</Text>
            <Text style={styles.col7}>Bottom</Text>
            <Text style={styles.col8}>Cover Grade</Text>
            <Text style={styles.col9}>Edge</Text>
            <Text style={styles.col10}>Length</Text>
            <Text style={styles.col11}>Compound Code</Text>
            <Text style={styles.col12}>Produced</Text>
            <Text style={styles.col13}>Consumed</Text>
            <Text style={styles.col14}>Weight</Text>
          </View>

          {belts.map((belt, index) => {
            const compounds = getCompounds(belt);
            return compounds.map((compound, compoundIndex) => (
              <View key={`${belt.beltNumber}-${compoundIndex}`} style={styles.tableRow}>
                {compoundIndex === 0 && (
                  <>
                    <Text style={styles.col1}>{index + 1}</Text>
                    <Text style={styles.col2}>{belt.beltNumber}</Text>
                    <Text style={styles.col3}>{belt.beltWidthMm ? `${belt.beltWidthMm} mm` : 'N/A'}</Text>
                    <Text style={styles.col4}>{belt.rating || 'N/A'}</Text>
                    <Text style={styles.col5}>{belt.fabric?.type || 'N/A'}</Text>
                    <Text style={styles.col6}>{belt.topCoverMm ? `${belt.topCoverMm} mm` : 'N/A'}</Text>
                    <Text style={styles.col7}>{belt.bottomCoverMm ? `${belt.bottomCoverMm} mm` : 'N/A'}</Text>
                    <Text style={styles.col8}>{belt.coverGrade || 'N/A'}</Text>
                    <Text style={styles.col9}>{belt.edge || 'N/A'}</Text>
                    <Text style={styles.col10}>{belt.beltLengthM ? `${belt.beltLengthM} m` : 'N/A'}</Text>
                  </>
                )}
                {compoundIndex > 0 && (
                  <>
                    <Text style={styles.col1}>{' '}</Text>
                    <Text style={styles.col2}>{' '}</Text>
                    <Text style={styles.col3}>{' '}</Text>
                    <Text style={styles.col4}>{' '}</Text>
                    <Text style={styles.col5}>{' '}</Text>
                    <Text style={styles.col6}>{' '}</Text>
                    <Text style={styles.col7}>{' '}</Text>
                    <Text style={styles.col8}>{' '}</Text>
                    <Text style={styles.col9}>{' '}</Text>
                    <Text style={styles.col10}>{' '}</Text>
                  </>
                )}
                <Text style={styles.col11}>{compound.code}</Text>
                <Text style={styles.col12}>{compound.producedOn}</Text>
                <Text style={styles.col13}>{compound.consumedOn}</Text>
                <Text style={styles.col14}>{compound.weight}</Text>
              </View>
            ));
          })}
        </View>

        <Text style={styles.footer}>
          Generated on {new Date().toLocaleString('en-IN')} | Total Belts: {belts.length}
        </Text>
      </Page>
    </Document>
  );
};

export const MasterBeltReportButton: React.FC<MasterBeltReportProps> = ({ belts }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const handlePreview = async () => {
    setIsGenerating(true);
    // Use double requestAnimationFrame to ensure loader is painted and animating before heavy work
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Add a small delay to ensure animation has started
        setTimeout(async () => {
          try {
            const blob = await pdf(<MasterBeltPDFDocument belts={belts} />).toBlob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setIsPreviewOpen(true);
          } catch (error) {
            console.error('Error generating PDF:', error);
          } finally {
            setIsGenerating(false);
          }
        }, 50);
      });
    });
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      const fileName = `Master_Belt_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleDownloadXLSX = () => {
    setIsGeneratingExcel(true);
    try {
      // Prepare data for Excel - create a row for each compound
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

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
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

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Master Belt Report');

      // Generate Excel file
      const fileName = `Master_Belt_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error generating XLSX:', error);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setIsPreviewOpen(false);
  };

  return (
    <>
      <Button onClick={handlePreview} disabled={isGenerating} variant="outline">
        {isGenerating ? (
          <>
            <div className="mr-2 animate-spin" style={{ willChange: 'transform' }}>
              <Spinner className="h-4 w-4" />
            </div>
            Generating...
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4" />
            View Master Belt
          </>
        )}
      </Button>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg">
            <div className="animate-spin" style={{ willChange: 'transform' }}>
              <Spinner className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">Generating report...</p>
          </div>
        </div>
      )}

      {/* Excel Loading Overlay */}
      {isGeneratingExcel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg">
            <div className="animate-spin" style={{ willChange: 'transform' }}>
              <Spinner className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">Generating Excel file...</p>
          </div>
        </div>
      )}

      {isPreviewOpen && pdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Master Belt Report Preview</h2>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <FileDown className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadPDF} disabled={isGeneratingExcel}>
                      <Download className="mr-2 h-4 w-4" />
                      Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadXLSX} disabled={isGeneratingExcel}>
                      {isGeneratingExcel ? (
                        <>
                          <div className="mr-2 animate-spin" style={{ willChange: 'transform' }}>
                            <Spinner className="h-4 w-4" />
                          </div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          Download as XLSX
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={handleClose} size="sm" variant="ghost">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe src={pdfUrl} className="w-full h-full border-0" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
