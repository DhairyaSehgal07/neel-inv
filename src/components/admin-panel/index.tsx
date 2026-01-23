'use client';

import { useUsersQuery } from '@/services/api/queries/users/clientUsers';
import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPanel() {
  const { data, isLoading, error } = useUsersQuery();

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
          <h2 className="text-xl font-semibold">User Management</h2>
        </div>
        <div className="text-destructive">Error loading users: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        searchKey="name"
        searchPlaceholder="Search by name or mobile number..."
      />
    </div>
  );
}
