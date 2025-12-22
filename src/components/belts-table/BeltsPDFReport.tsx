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



interface BeltsPDFReportProps {
  belts: BeltDoc[];
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
  col1: { width: '8%', fontSize: 8 },
  col2: { width: '9%', fontSize: 8 },
  col3: { width: '8%', fontSize: 8 },
  col4: { width: '11%', fontSize: 8 },
  col5: { width: '10%', fontSize: 8 },
  col6: { width: '8%', fontSize: 8 },
  col7: { width: '9%', fontSize: 8 },
  col8: { width: '11%', fontSize: 8 },
  col9: { width: '9%', fontSize: 8 },
  col10: { width: '9%', fontSize: 8 },
  col11: { width: '8%', fontSize: 8 },
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

const BeltsPDFDocument: React.FC<{ belts: BeltDoc[] }> = ({ belts }) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Neelkanthrubber Mills Belts Report</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>S.No.</Text>
            <Text style={styles.col2}>Belt No.</Text>
            <Text style={styles.col3}>Width</Text>
            <Text style={styles.col4}>Belt Rating</Text>
            <Text style={styles.col5}>Fabric Type</Text>
            <Text style={styles.col6}>Top</Text>
            <Text style={styles.col7}>Bottom</Text>
            <Text style={styles.col8}>Cover Grade</Text>
            <Text style={styles.col9}>Edge</Text>
            <Text style={styles.col10}>Length</Text>
            <Text style={styles.col11}>Status</Text>
          </View>

          {belts.map((belt, index) => (
            <View key={belt.beltNumber} style={styles.tableRow}>
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{belt.beltNumber}</Text>
              <Text style={styles.col3}>{belt.beltWidthMm}</Text>
              <Text style={styles.col4}>{belt.rating}</Text>
              <Text style={styles.col5}>{belt.fabric?.type || 'N/A'}</Text>
              <Text style={styles.col6}>{belt.topCoverMm}</Text>
              <Text style={styles.col7}>{belt.bottomCoverMm}</Text>
              <Text style={styles.col8}>{belt.coverGrade}</Text>
              <Text style={styles.col9}>{belt.edge}</Text>
              <Text style={styles.col10}>{belt.beltLengthM}</Text>
              <Text style={styles.col11}>{belt.status}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated on {new Date().toLocaleString('en-IN')} | Total Belts: {belts.length}
        </Text>
      </Page>
    </Document>
  );
};

export const BeltsPDFReportButton: React.FC<BeltsPDFReportProps> = ({ belts }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<BeltsPDFDocument belts={belts} />).toBlob();
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
      const fileName = `Belts_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleDownloadXLSX = () => {
    try {
      // Prepare data for Excel
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

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
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

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Belts Report');

      // Generate Excel file
      const fileName = `Belts_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
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
              <h2 className="text-lg font-semibold">Belts Report Preview</h2>
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
