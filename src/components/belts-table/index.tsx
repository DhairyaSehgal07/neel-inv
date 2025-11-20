'use client';

import { useBeltsQuery } from '@/services/api/queries/belts/clientBelts';
import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function BeltsTable() {
  const router = useRouter();
  const { data, isLoading, error } = useBeltsQuery();

  const handleAddBelt = () => {
    router.push('/dashboard/belts/create');
  };

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
          <h2 className="text-xl font-semibold">Belts</h2>
          <Button onClick={handleAddBelt}>Add Belt</Button>
        </div>
        <div className="text-destructive">Error loading belts: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Belts</h2>
        <Button onClick={handleAddBelt}>Add Belt</Button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        searchKey="beltNumber"
        searchPlaceholder="Search by belt number, order number, buyer name, or rating..."
        filterKey="status"
        filterOptions={[
          { value: 'In Production', label: 'In Production' },
          { value: 'Dispatched', label: 'Dispatched' },
        ]}
        filterPlaceholder="Filter by status"
      />
    </div>
  );
}
