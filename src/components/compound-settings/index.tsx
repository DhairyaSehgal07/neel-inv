// src/components/compound-types/compound-list.tsx

'use client';

import { useState } from 'react';
import { useCompoundMastersQuery } from '@/services/api/queries/compounds/clientCompoundMasters';
import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import EditCompoundDialog from './edit-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompoundList() {
  const [openCreate, setOpenCreate] = useState(false);
  const { data, isLoading, error } = useCompoundMastersQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Compound Types</h2>
          <Button onClick={() => setOpenCreate(true)}>+ Add Compound</Button>
        </div>
        <div className="text-destructive">Error loading compound types: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Compound Master</h2>
        <Button onClick={() => setOpenCreate(true)}>+ Add Compound</Button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        searchKey="compoundName"
        searchPlaceholder="Search by name or code..."
        filterKey="category"
        filterOptions={[
          { value: 'skim', label: 'Skim' },
          { value: 'cover', label: 'Cover' },
        ]}
        filterPlaceholder="Filter by category"
      />

      <EditCompoundDialog open={openCreate} onOpenChange={setOpenCreate} />
    </div>
  );
}
