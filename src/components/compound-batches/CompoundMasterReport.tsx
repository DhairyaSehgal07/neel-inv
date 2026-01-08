import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
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
import { CompoundMasterReportData } from '@/services/api/queries/compounds/clientCompoundMasterReport';

interface CompoundMasterReportProps {
  data: CompoundMasterReportData[];
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
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  col1: { width: '4%', fontSize: 7, textAlign: 'left' }, // S.No.
  col2: { width: '10%', fontSize: 7, textAlign: 'left' }, // Compound Code
  col3: { width: '12%', fontSize: 7, textAlign: 'left' }, // Compound Name
  col4: { width: '8%', fontSize: 7, textAlign: 'left' }, // Produced On
  col5: { width: '8%', fontSize: 7, textAlign: 'left' }, // Consumed On
  col6: { width: '6%', fontSize: 7, textAlign: 'left' }, // Number of Batches
  col7: { width: '8%', fontSize: 7, textAlign: 'left' }, // Weight per Batch
  col8: { width: '8%', fontSize: 7, textAlign: 'left' }, // Total Inventory
  col9: { width: '8%', fontSize: 7, textAlign: 'left' }, // Remaining
  col10: { width: '10%', fontSize: 7, textAlign: 'left' }, // Belt Numbers
  col11: { width: '9%', fontSize: 7, textAlign: 'left' }, // Material Name
  col12: { width: '9%', fontSize: 7, textAlign: 'left' }, // Material Code
  rawMaterialRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  emptyCell: { width: '4%', fontSize: 7, textAlign: 'left' },
  emptyCell2: { width: '10%', fontSize: 7, textAlign: 'left' },
  emptyCell3: { width: '12%', fontSize: 7, textAlign: 'left' },
  emptyCell4: { width: '8%', fontSize: 7, textAlign: 'left' },
  emptyCell5: { width: '8%', fontSize: 7, textAlign: 'left' },
  emptyCell6: { width: '6%', fontSize: 7, textAlign: 'left' },
  emptyCell7: { width: '8%', fontSize: 7, textAlign: 'left' },
  emptyCell8: { width: '8%', fontSize: 7, textAlign: 'left' },
  emptyCell9: { width: '8%', fontSize: 7, textAlign: 'left' },
  emptyCell10: { width: '10%', fontSize: 7, textAlign: 'left' },
  materialNameCell: { width: '9%', fontSize: 7, textAlign: 'left' },
  materialCodeCell: { width: '9%', fontSize: 7, textAlign: 'left' },
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
const formatDate = (dateString: string | null | undefined): string => {
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
const formatCompoundCode = (code: string, producedOn: string | null): string => {
  if (!code) return 'N/A';
  if (!producedOn) return code;
  // Format date from YYYY-MM-DD to YYYYMMDD (remove dashes)
  const formattedDate = producedOn.replace(/-/g, '');
  return `${code}-${formattedDate}`;
};

const CompoundMasterPDFDocument: React.FC<{ data: CompoundMasterReportData[] }> = ({ data }) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Neelkanthrubber Mills Compound Master Report</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </View>

        <View style={styles.table}>
          {/* Main Header Row */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>S.No.</Text>
            <Text style={styles.col2}>Compound Code</Text>
            <Text style={styles.col3}>Compound Name</Text>
            <Text style={styles.col4}>Produced On</Text>
            <Text style={styles.col5}>Consumed On</Text>
            <Text style={styles.col6}>Batches</Text>
            <Text style={styles.col7}>Weight/Batch (kg)</Text>
            <Text style={styles.col8}>Total Inventory (kg)</Text>
            <Text style={styles.col9}>Remaining (kg)</Text>
            <Text style={styles.col10}>Belt Numbers</Text>
            <Text style={styles.col11}>Material Name</Text>
            <Text style={styles.col12}>Material Code</Text>
          </View>

          {data.map((row, index) => {
            // Create unique key from compoundCode and producedOn
            const uniqueKey = `${row.compoundCode}-${row.producedOn || row.consumedOn || index}`;

            // Use materialsUsed if available (includes codes), otherwise fallback to rawMaterials
            const materialsUsed = row.materialsUsed && row.materialsUsed.length > 0
              ? row.materialsUsed
              : (row.rawMaterials || []).map(name => ({ materialName: name, materialCode: '' }));

            const hasMaterials = materialsUsed.length > 0;

            return (
              <React.Fragment key={uniqueKey}>
                {/* Main compound row - show first material */}
                <View style={styles.tableRow}>
                  <Text style={styles.col1}>{index + 1}</Text>
                  <Text style={styles.col2}>{formatCompoundCode(row.compoundCode, row.producedOn)}</Text>
                  <Text style={styles.col3}>{row.compoundName}</Text>
                  <Text style={styles.col4}>{formatDate(row.producedOn)}</Text>
                  <Text style={styles.col5}>{formatDate(row.consumedOn)}</Text>
                  <Text style={styles.col6}>{row.numberOfBatches}</Text>
                  <Text style={styles.col7}>{roundToNearest5(row.weightPerBatch).toFixed(2)}</Text>
                  <Text style={styles.col8}>{roundToNearest5(row.totalInventory).toFixed(2)}</Text>
                  <Text style={styles.col9}>{roundToNearest5(row.remaining).toFixed(2)}</Text>
                  <Text style={styles.col10}>
                    {row.beltNumbers.length > 0 ? row.beltNumbers.join(', ') : 'N/A'}
                  </Text>
                  <Text style={styles.col11}>
                    {hasMaterials ? materialsUsed[0].materialName : 'N/A'}
                  </Text>
                  <Text style={styles.col12}>
                    {hasMaterials && materialsUsed[0].materialCode ? materialsUsed[0].materialCode : 'N/A'}
                  </Text>
                </View>

                {/* Raw materials rows - one per material (skip first as it's shown in main row) */}
                {materialsUsed.slice(1).map((material, materialIndex) => (
                  <View key={`${uniqueKey}-material-${materialIndex}`} style={styles.rawMaterialRow}>
                    <Text style={styles.emptyCell}></Text>
                    <Text style={styles.emptyCell2}></Text>
                    <Text style={styles.emptyCell3}></Text>
                    <Text style={styles.emptyCell4}></Text>
                    <Text style={styles.emptyCell5}></Text>
                    <Text style={styles.emptyCell6}></Text>
                    <Text style={styles.emptyCell7}></Text>
                    <Text style={styles.emptyCell8}></Text>
                    <Text style={styles.emptyCell9}></Text>
                    <Text style={styles.emptyCell10}></Text>
                    <Text style={styles.materialNameCell}>{material.materialName}</Text>
                    <Text style={styles.materialCodeCell}>{material.materialCode || 'N/A'}</Text>
                  </View>
                ))}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.footer}>
          Generated on {new Date().toLocaleString('en-IN')} | Total Batches: {data.length}
        </Text>
      </Page>
    </Document>
  );
};

export const CompoundMasterReportButton: React.FC<CompoundMasterReportProps> = ({ data }) => {
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
            const blob = await pdf(<CompoundMasterPDFDocument data={data} />).toBlob();
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
      const fileName = `Compound_Master_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleDownloadXLSX = () => {
    setIsGeneratingExcel(true);
    try {
      // Prepare data for Excel - each raw material gets its own row
      const excelData: Record<string, string | number>[] = [];

      data.forEach((row, index) => {
        // Use materialsUsed if available (includes codes), otherwise fallback to rawMaterials
        const materialsUsed = row.materialsUsed && row.materialsUsed.length > 0
          ? row.materialsUsed
          : (row.rawMaterials || []).map(name => ({ materialName: name, materialCode: '' }));

        // Main row with first raw material (or N/A if none)
        excelData.push({
          'S.No.': index + 1,
          'Compound Code': formatCompoundCode(row.compoundCode, row.producedOn),
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

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
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

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Compound Master Report');

      // Generate Excel file
      const fileName = `Compound_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
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
            View Master Compound
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
              <h2 className="text-lg font-semibold">Compound Master Report Preview</h2>
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
