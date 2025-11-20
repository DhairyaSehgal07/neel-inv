'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CompoundMaster } from '@/types/compound-master';
import { DataTableRowActions } from './row-actions';

export const columns: ColumnDef<CompoundMaster>[] = [
  {
    accessorKey: 'compoundCode',
    header: 'Code',
  },
  {
    accessorKey: 'compoundName',
    header: 'Name',
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.original.category;
      return (
        <Badge variant={category === 'skim' ? 'secondary' : 'default'}>
          {category.toUpperCase()}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value === undefined || row.getValue(id) === value;
    },
  },
  {
    accessorKey: 'defaultWeightPerBatch',
    header: 'Weight/Batch (kg)',
    cell: ({ row }) => {
      return `${row.original.defaultWeightPerBatch} kg`;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return date.toLocaleDateString();
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];