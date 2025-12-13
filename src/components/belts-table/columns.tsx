'use client';

import { ColumnDef, Column } from '@tanstack/react-table';
import { BeltDoc } from '@/model/Belt';
import { Badge } from '@/components/ui/badge';
import { DataTableRowActions } from './row-actions';
import { FabricInfo } from '@/types/belt';
import { roundToNearest5, cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeltWithFabric = BeltDoc & { fabric?: FabricInfo };

// Helper function to create sortable header
const createSortableHeader = (title: string) => {
  const SortableHeader = ({ column }: { column: Column<BeltWithFabric> }) => {
    const isSorted = column.getIsSorted();
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className={cn('h-8 px-2 lg:px-3', isSorted && 'bg-muted')}
      >
        {title}
        {isSorted === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : isSorted === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    );
  };
  SortableHeader.displayName = `SortableHeader(${title})`;
  return SortableHeader;
};

export const columns: ColumnDef<BeltWithFabric>[] = [
  {
    accessorKey: 'beltNumber',
    header: createSortableHeader('Belt No.'),
    enableSorting: true,
    filterFn: (row, id, value) => {
      const searchValue = value?.toLowerCase() || '';
      const beltNumber = row.getValue(id)?.toString().toLowerCase() || '';
      const orderNumber = row.original.orderNumber?.toLowerCase() || '';
      const buyerName = row.original.buyerName?.toLowerCase() || '';
      const rating = row.original.rating?.toLowerCase() || '';
      return (
        beltNumber.includes(searchValue) ||
        orderNumber.includes(searchValue) ||
        buyerName.includes(searchValue) ||
        rating.includes(searchValue)
      );
    },
  },
  {
    accessorKey: 'beltWidthMm',
    header: 'Width',
    cell: ({ row }) => {
      const width = row.original.beltWidthMm;
      return width ? `${roundToNearest5(Number(width))} mm` : '-';
    },
  },
  {
    accessorKey: 'rating',
    header: 'Belt Rating',
  },
  {
    id: 'fabricType',
    header: 'Fabric Type',
    cell: ({ row }) => {
      const fabricType = row.original.fabric?.type;
      return fabricType || '-';
    },
  },
  {
    accessorKey: 'topCoverMm',
    header: 'Top',
    cell: ({ row }) => {
      const top = row.original.topCoverMm;
      return top !== undefined && top !== null ? `${Number(top).toFixed(2)} mm` : '-';
    },
  },
  {
    accessorKey: 'bottomCoverMm',
    header: 'Bottom',
    cell: ({ row }) => {
      const bottom = row.original.bottomCoverMm;
      return bottom !== undefined && bottom !== null ? `${Number(bottom).toFixed(2)} mm` : '-';
    },
  },
  {
    accessorKey: 'coverGrade',
    header: 'Cover Grade',
    cell: ({ row }) => {
      const coverGrade = row.original.coverGrade;
      return coverGrade || '-';
    },
  },
  {
    accessorKey: 'edge',
    header: 'Edge',
    cell: ({ row }) => {
      const edge = row.original.edge;
      return edge || '-';
    },
  },
  {
    accessorKey: 'beltLengthM',
    header: 'Length',
    cell: ({ row }) => {
      const length = row.original.beltLengthM;
      return length ? `${length} m` : '-';
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return <Badge variant={status === 'Dispatched' ? 'default' : 'secondary'}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value === undefined || row.getValue(id) === value;
    },
  },
  {
    id: 'dispatchDate',
    accessorFn: (row) => row.process?.dispatchDate || '',
    header: createSortableHeader('Dispatch Date'),
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.process?.dispatchDate || '';
      const dateB = rowB.original.process?.dispatchDate || '';
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    },
    cell: ({ row }) => {
      const dispatchDate = row.original.process?.dispatchDate;
      if (!dispatchDate) return '-';
      return new Date(dispatchDate).toLocaleDateString();
    },
  },
  {
    accessorKey: 'createdAt',
    header: createSortableHeader('Created At'),
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.createdAt ? new Date(rowA.original.createdAt).getTime() : 0;
      const dateB = rowB.original.createdAt ? new Date(rowB.original.createdAt).getTime() : 0;
      return dateA - dateB;
    },
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      if (!createdAt) return '-';
      return new Date(createdAt).toLocaleDateString();
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
