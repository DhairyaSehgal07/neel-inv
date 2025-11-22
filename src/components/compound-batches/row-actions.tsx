'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import EditBatchDialog from './edit-batch-dialog';
import { CompoundBatchDoc } from '@/model/CompoundBatch';

export function DataTableRowActions({ row }: { row: Row<CompoundBatchDoc> }) {
  const batch = row.original;
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setOpenEdit(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <EditBatchDialog open={openEdit} onOpenChange={setOpenEdit} batch={batch} />
    </>
  );
}
