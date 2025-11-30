// src/components/rating-settings/row-actions.tsx

'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EditRatingDialog from './edit-dialog';
import DeleteRatingDialog from './delete-dialog';
import { Rating } from '@/types/rating';

export function DataTableRowActions({ row }: { row: Row<Rating> }) {
  const rating = row.original;

  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={() => setOpenEdit(true)}>
        <Edit2 className="h-4 w-4" />
      </Button>

      <Button variant="destructive" size="icon" onClick={() => setOpenDelete(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <EditRatingDialog open={openEdit} onOpenChange={setOpenEdit} rating={rating} />
      <DeleteRatingDialog open={openDelete} onOpenChange={setOpenDelete} rating={rating} />
    </div>
  );
}
