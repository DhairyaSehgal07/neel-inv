'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import BeltDetailsDialog from './belt-details-dialog';
import { BeltDoc } from '@/model/Belt';

export function DataTableRowActions({ row }: { row: Row<BeltDoc> }) {
  const belt = row.original;
  const [openDetails, setOpenDetails] = useState(false);

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setOpenDetails(true)}>
        <Eye className="h-4 w-4" />
      </Button>
      <BeltDetailsDialog open={openDetails} onOpenChange={setOpenDetails} belt={belt} />
    </>
  );
}
