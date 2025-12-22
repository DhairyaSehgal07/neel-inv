'use client';

import { useCompoundBatchesQuery } from '@/services/api/queries/compounds/clientCompoundBatches';
import { useCompoundMasterReportQuery } from '@/services/api/queries/compounds/clientCompoundMasterReport';
import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { CompoundBatchesPDFReportButton } from './CompoundBatchesPDFReport';
import { CompoundMasterReportButton } from './CompoundMasterReport';

export default function CompoundBatchesList() {
  const { data, isLoading, error } = useCompoundBatchesQuery();
  const {
    data: masterReportData,
    isLoading: isMasterReportLoading,
    error: masterReportError,
  } = useCompoundMasterReportQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Compound Batches</h2>
        </div>
        <div className="text-destructive">Error loading compound batches: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Compound Batches</h2>
        <div className="flex gap-2">
          <CompoundBatchesPDFReportButton batches={data || []} />
          {!isMasterReportLoading && !masterReportError && masterReportData && (
            <CompoundMasterReportButton data={masterReportData} />
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        searchKey="compoundName"
        searchPlaceholder="Search by compound name or code..."
      />
    </div>
  );
}
