'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Eye, Pencil } from 'lucide-react';
import { useState } from 'react';
import BeltDetailsDialog from './belt-details-dialog';
import EditBeltDialog from './edit-belt-dialog';
import { BeltDoc } from '@/model/Belt';
import { FabricInfo } from '@/types/belt';

export function DataTableRowActions({ row }: { row: Row<BeltDoc & { fabric?: FabricInfo }> }) {
  const belt = row.original;
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={() => setOpenDetails(true)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setOpenEdit(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      <BeltDetailsDialog open={openDetails} onOpenChange={setOpenDetails} belt={belt} />
      <EditBeltDialog open={openEdit} onOpenChange={setOpenEdit} belt={belt} />
    </>
  );
}
