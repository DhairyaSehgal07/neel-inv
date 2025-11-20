'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CompoundBatchDoc } from '@/model/CompoundBatch';

export const columns: ColumnDef<CompoundBatchDoc>[] = [
  {
    accessorKey: 'compoundCode',
    header: 'Compound Code',
    cell: ({ row }) => {
      const code = row.original.compoundCode;
      const date = row.original.date;
      // Format date from YYYY-MM-DD to a shorter format or keep as is
      const formattedDate = date ? date.replace(/-/g, '') : '';
      return `${code}-${formattedDate}`;
    },
    filterFn: (row, id, value) => {
      const searchValue = value?.toLowerCase() || '';
      const code = row.original.compoundCode?.toLowerCase() || '';
      const name = row.original.compoundName?.toLowerCase() || '';
      const date = row.original.date?.toLowerCase() || '';
      return code.includes(searchValue) || name.includes(searchValue) || date.includes(searchValue);
    },
  },
  {
    accessorKey: 'compoundName',
    header: 'Compound Name',
    filterFn: (row, id, value) => {
      const searchValue = value?.toLowerCase() || '';
      const code = row.original.compoundCode?.toLowerCase() || '';
      const name = row.getValue(id)?.toString().toLowerCase() || '';
      return code.includes(searchValue) || name.includes(searchValue);
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.date;
      // Format YYYY-MM-DD to a more readable format
      if (date) {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString();
      }
      return date;
    },
  },
  {
    accessorKey: 'batches',
    header: 'Batches',
    cell: ({ row }) => {
      return row.original.batches;
    },
  },
  {
    accessorKey: 'weightPerBatch',
    header: 'Weight/Batch (kg)',
    cell: ({ row }) => {
      return `${row.original.weightPerBatch} kg`;
    },
  },
  {
    accessorKey: 'totalInventory',
    header: 'Total Inventory (kg)',
    cell: ({ row }) => {
      return `${row.original.totalInventory} kg`;
    },
  },
  {
    accessorKey: 'inventoryRemaining',
    header: 'Remaining (kg)',
    cell: ({ row }) => {
      return `${row.original.inventoryRemaining} kg`;
    },
  },
  {
    accessorKey: 'consumed',
    header: 'Consumed (kg)',
    cell: ({ row }) => {
      return `${row.original.consumed} kg`;
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
];
