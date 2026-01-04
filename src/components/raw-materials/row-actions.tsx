'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EditRawMaterialDialog from './edit-dialog';
import DeleteRawMaterialDialog from './delete-dialog';
import { RawMaterialDoc } from '@/model/RawMaterial';

export function DataTableRowActions({ row }: { row: Row<RawMaterialDoc> }) {
  const rawMaterial = row.original;
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={() => setOpenEdit(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setOpenDelete(true)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <EditRawMaterialDialog open={openEdit} onOpenChange={setOpenEdit} rawMaterial={rawMaterial} />
      <DeleteRawMaterialDialog open={openDelete} onOpenChange={setOpenDelete} rawMaterial={rawMaterial} />
    </>
  );
}
