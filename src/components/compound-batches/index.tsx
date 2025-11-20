'use client';

import { useCompoundBatchesQuery } from '@/services/api/queries/compounds/clientCompoundBatches';
import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompoundBatchesList() {
  const { data, isLoading, error } = useCompoundBatchesQuery();

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
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Compound Batches</h2>
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
