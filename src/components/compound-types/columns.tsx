// src/components/compound-types/columns.tsx

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CompoundType } from '@/lib/api/compound-type';
import { Badge } from '@/components/ui/badge';
import { DataTableRowActions } from './row-actions';

export const columns: ColumnDef<CompoundType>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'type',
    header: 'Category',
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge variant={type === 'skim' ? 'secondary' : 'default'}>{type.toUpperCase()}</Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value === undefined || row.getValue(id) === value;
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded text-xs ${
          row.original.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
        }`}
      >
        {row.original.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
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
