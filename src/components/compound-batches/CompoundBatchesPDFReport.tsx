import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { CompoundBatchDoc } from '@/model/CompoundBatch';
import { Eye, X, Download, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { roundToNearest5 } from '@/lib/utils';

interface CompoundBatchesPDFReportProps {
  batches: CompoundBatchDoc[];
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
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
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  col1: { width: '6%', fontSize: 8 },
  col2: { width: '12%', fontSize: 8 },
  col3: { width: '15%', fontSize: 8 },
  col4: { width: '12%', fontSize: 8 },
  col5: { width: '10%', fontSize: 8 },
  col6: { width: '10%', fontSize: 8 },
  col7: { width: '10%', fontSize: 8 },
  col8: { width: '10%', fontSize: 8 },
  col9: { width: '10%', fontSize: 8 },
  col10: { width: '5%', fontSize: 8 },
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

const formatCompoundCode = (batch: CompoundBatchDoc): string => {
  const code = batch.compoundCode;
  const producedOnDate = batch.coverCompoundProducedOn || batch.skimCompoundProducedOn;
  const dateToUse = producedOnDate || batch.date;
  const formattedDate = dateToUse ? dateToUse.replace(/-/g, '') : '';
  return `${code}-${formattedDate}`;
};

const formatProducedOn = (batch: CompoundBatchDoc): string => {
  const coverProducedOn = batch.coverCompoundProducedOn;
  const skimProducedOn = batch.skimCompoundProducedOn;

  if (coverProducedOn && skimProducedOn) {
    const coverDate = new Date(coverProducedOn).toLocaleDateString();
    const skimDate = new Date(skimProducedOn).toLocaleDateString();
    return `Cover: ${coverDate}\nSkim: ${skimDate}`;
  } else if (coverProducedOn) {
    return new Date(coverProducedOn).toLocaleDateString();
  } else if (skimProducedOn) {
    return new Date(skimProducedOn).toLocaleDateString();
  }
  return '-';
};

const formatDate = (date: string | undefined): string => {
  if (!date) return '-';
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString();
};

const CompoundBatchesPDFDocument: React.FC<{ batches: CompoundBatchDoc[] }> = ({ batches }) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Neelkanthrubber Mills Compound Batches Report</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </View>

        <View style={styles.table}>
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
            <Text style={styles.col10}>Consumed (kg)</Text>
          </View>

          {batches.map((batch, index) => (
            <View key={batch._id?.toString() || index} style={styles.tableRow}>
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{formatCompoundCode(batch)}</Text>
              <Text style={styles.col3}>{batch.compoundName || '-'}</Text>
              <Text style={styles.col4}>{formatProducedOn(batch)}</Text>
              <Text style={styles.col5}>{formatDate(batch.date)}</Text>
              <Text style={styles.col6}>{batch.batches}</Text>
              <Text style={styles.col7}>{roundToNearest5(Number(batch.weightPerBatch)).toFixed(2)}</Text>
              <Text style={styles.col8}>{roundToNearest5(Number(batch.totalInventory)).toFixed(2)}</Text>
              <Text style={styles.col9}>{roundToNearest5(Number(batch.inventoryRemaining)).toFixed(2)}</Text>
              <Text style={styles.col10}>{roundToNearest5(Number(batch.consumed)).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated on {new Date().toLocaleString('en-IN')} | Total Batches: {batches.length}
        </Text>
      </Page>
    </Document>
  );
};

export const CompoundBatchesPDFReportButton: React.FC<CompoundBatchesPDFReportProps> = ({ batches }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<CompoundBatchesPDFDocument batches={batches} />).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      const fileName = `Compound_Batches_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleDownloadXLSX = () => {
    try {
      // Prepare data for Excel
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

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
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

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Compound Batches Report');

      // Generate Excel file
      const fileName = `Compound_Batches_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error generating XLSX:', error);
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
        <Eye className="mr-2 h-4 w-4" />
        {isGenerating ? 'Generating...' : 'View Report'}
      </Button>

      {isPreviewOpen && pdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Compound Batches Report Preview</h2>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <FileDown className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadXLSX}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Download as XLSX
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
