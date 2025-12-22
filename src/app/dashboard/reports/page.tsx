'use client';

import { useBeltsQuery } from '@/services/api/queries/belts/clientBelts';
import { useCompoundBatchesQuery } from '@/services/api/queries/compounds/clientCompoundBatches';
import { useCompoundMasterReportQuery } from '@/services/api/queries/compounds/clientCompoundMasterReport';
import { BeltsPDFReportButton } from '@/components/belts-table/BeltsPDFReport';
import { MasterBeltReportButton } from '@/components/belts-table/MasterBeltReport';
import { CompoundBatchesPDFReportButton } from '@/components/compound-batches/CompoundBatchesPDFReport';
import { CompoundMasterReportButton } from '@/components/compound-batches/CompoundMasterReport';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { data: beltsData, isLoading: beltsLoading, error: beltsError } = useBeltsQuery();
  const { data: batchesData, isLoading: batchesLoading, error: batchesError } = useCompoundBatchesQuery();
  const {
    data: masterReportData,
    isLoading: masterReportLoading,
    error: masterReportError,
  } = useCompoundMasterReportQuery();

  const isLoading = beltsLoading || batchesLoading || masterReportLoading;
  const hasError = beltsError || batchesError || masterReportError;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Reports</h1>
        </div>
        <div className="text-destructive">
          {beltsError && `Error loading belts: ${beltsError.message}`}
          {batchesError && `Error loading compound batches: ${batchesError.message}`}
          {masterReportError && `Error loading compound master report: ${masterReportError.message}`}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="text-muted-foreground mt-2">
            View and download reports in PDF or Excel format
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Belts Report</h2>
              <p className="text-sm text-muted-foreground mt-1">Total belts: {beltsData?.length || 0}</p>
            </div>
            <BeltsPDFReportButton belts={beltsData || []} />
          </div>
          <p className="text-sm text-muted-foreground">
            Click the &quot;View Report&quot; button to preview the report and download it as PDF or XLSX.
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Master Belt Report</h2>
              <p className="text-sm text-muted-foreground mt-1">Total belts: {beltsData?.length || 0}</p>
            </div>
            <MasterBeltReportButton belts={beltsData || []} />
          </div>
          <p className="text-sm text-muted-foreground">
            Detailed report with belt specifications, compound information (code, produced on, consumed on, weight), and process dates. Click the &quot;View Master Belt&quot; button to preview and download as PDF or XLSX.
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Compound Batches Report</h2>
              <p className="text-sm text-muted-foreground mt-1">Total batches: {batchesData?.length || 0}</p>
            </div>
            <CompoundBatchesPDFReportButton batches={batchesData || []} />
          </div>
          <p className="text-sm text-muted-foreground">
            Click the &quot;View Report&quot; button to preview the report and download it as PDF or XLSX.
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Compound Master Report</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Total batches: {masterReportData?.length || 0}
              </p>
            </div>
            {masterReportData && <CompoundMasterReportButton data={masterReportData} />}
          </div>
          <p className="text-sm text-muted-foreground">
            Detailed report showing all compound batches with their details (compound code, name, produced on, consumed on, batches, weight per batch, total inventory, remaining) and the belt numbers where each batch was used. Click the &quot;View Master Compound&quot; button to preview and download as PDF or XLSX.
          </p>
        </div>
      </div>
    </div>
  );
}
