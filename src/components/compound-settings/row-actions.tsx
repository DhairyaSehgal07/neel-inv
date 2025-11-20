// src/components/compound-types/row-actions.tsx

'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EditCompoundDialog from './edit-dialog';
import DeleteCompoundDialog from './delete-dialog';
import { CompoundMaster } from '@/types/compound-master';

export function DataTableRowActions({ row }: { row: Row<CompoundMaster> }) {
  const compound = row.original;

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

      <EditCompoundDialog open={openEdit} onOpenChange={setOpenEdit} compound={compound} />
      <DeleteCompoundDialog open={openDelete} onOpenChange={setOpenDelete} compound={compound} />
    </div>
  );
}
