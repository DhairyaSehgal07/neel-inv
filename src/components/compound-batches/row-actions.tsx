'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EditBatchDialog from './edit-batch-dialog';
import DeleteBatchDialog from './delete-batch-dialog';
import { CompoundBatchDoc } from '@/model/CompoundBatch';

export function DataTableRowActions({ row }: { row: Row<CompoundBatchDoc> }) {
  const batch = row.original;
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={() => setOpenEdit(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="icon" onClick={() => setOpenDelete(true)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <EditBatchDialog open={openEdit} onOpenChange={setOpenEdit} batch={batch} />
      <DeleteBatchDialog open={openDelete} onOpenChange={setOpenDelete} batch={batch} />
    </>
  );
}
