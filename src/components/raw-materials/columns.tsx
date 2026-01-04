'use client';

import { ColumnDef } from '@tanstack/react-table';
import { RawMaterialDoc } from '@/model/RawMaterial';
import { DataTableRowActions } from './row-actions';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

// Helper function to create sortable header
const createSortableHeader = (title: string) => {
  const SortableHeader = ({ column }: { column: Column<RawMaterialDoc> }) => {
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

export const columns: ColumnDef<RawMaterialDoc>[] = [
  {
    accessorKey: 'materialCode',
    header: createSortableHeader('Material Code'),
    enableSorting: true,
    filterFn: (row, id, value) => {
      const searchValue = value?.toLowerCase() || '';
      const materialCode = row.getValue(id)?.toString().toLowerCase() || '';
      const rawMaterial = row.original.rawMaterial?.toLowerCase() || '';
      const date = row.original.date?.toLowerCase() || '';
      return (
        materialCode.includes(searchValue) ||
        rawMaterial.includes(searchValue) ||
        date.includes(searchValue)
      );
    },
  },
  {
    accessorKey: 'rawMaterial',
    header: createSortableHeader('Raw Material'),
    enableSorting: true,
  },
  {
    accessorKey: 'date',
    header: createSortableHeader('Date'),
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.date || '';
      const dateB = rowB.original.date || '';
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    },
    cell: ({ row }) => {
      const date = row.original.date;
      if (!date) return '-';
      try {
        return new Date(date).toLocaleDateString();
      } catch {
        return date;
      }
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
