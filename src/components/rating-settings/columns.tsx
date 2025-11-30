'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Rating } from '@/types/rating';
import { DataTableRowActions } from './row-actions';

export const columns: ColumnDef<Rating>[] = [
  {
    accessorKey: 'rating',
    header: 'Rating',
  },
  {
    accessorKey: 'strength',
    header: 'Strength',
    cell: ({ row }) => {
      return `${row.original.strength}`;
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
