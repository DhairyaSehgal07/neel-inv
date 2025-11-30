// src/components/rating-settings/index.tsx

'use client';

import { useState } from 'react';
import { useRatingsQuery } from '@/services/api/queries/ratings/clientRatings';
import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import EditRatingDialog from './edit-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function RatingList() {
  const [openCreate, setOpenCreate] = useState(false);
  const { data, isLoading, error } = useRatingsQuery();

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
          <h2 className="text-xl font-semibold">Ratings</h2>
          <Button onClick={() => setOpenCreate(true)}>+ Add Rating</Button>
        </div>
        <div className="text-destructive">Error loading ratings: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Ratings</h2>
        <Button onClick={() => setOpenCreate(true)}>+ Add Rating</Button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        searchKey="rating"
        searchPlaceholder="Search by rating..."
      />

      <EditRatingDialog open={openCreate} onOpenChange={setOpenCreate} />
    </div>
  );
}
