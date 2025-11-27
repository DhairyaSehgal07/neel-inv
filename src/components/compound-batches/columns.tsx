'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CompoundBatchDoc } from '@/model/CompoundBatch';
import { DataTableRowActions } from './row-actions';

export const columns: ColumnDef<CompoundBatchDoc>[] = [
  {
    accessorKey: 'compoundCode',
    header: 'Compound Code',
    cell: ({ row }) => {
      const code = row.original.compoundCode;
      // Use producedOn date if available, otherwise fall back to consumption date
      const producedOnDate = row.original.coverCompoundProducedOn || row.original.skimCompoundProducedOn;
      const dateToUse = producedOnDate || row.original.date;
      // Format date from YYYY-MM-DD to a shorter format or keep as is
      const formattedDate = dateToUse ? dateToUse.replace(/-/g, '') : '';
      return `${code}-${formattedDate}`;
    },
    filterFn: (row, id, value) => {
      const searchValue = value?.toLowerCase() || '';
      const code = row.original.compoundCode?.toLowerCase() || '';
      const name = row.original.compoundName?.toLowerCase() || '';
      const date = row.original.date?.toLowerCase() || '';
      const producedOn = (row.original.coverCompoundProducedOn || row.original.skimCompoundProducedOn)?.toLowerCase() || '';
      return code.includes(searchValue) || name.includes(searchValue) || date.includes(searchValue) || producedOn.includes(searchValue);
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
    accessorKey: 'producedOn',
    header: 'Produced On',
    cell: ({ row }) => {
      const coverProducedOn = row.original.coverCompoundProducedOn;
      const skimProducedOn = row.original.skimCompoundProducedOn;

      // Show both if both exist, otherwise show the one that exists
      if (coverProducedOn && skimProducedOn) {
        const coverDate = new Date(coverProducedOn).toLocaleDateString();
        const skimDate = new Date(skimProducedOn).toLocaleDateString();
        return `Cover: ${coverDate}, Skim: ${skimDate}`;
      } else if (coverProducedOn) {
        return new Date(coverProducedOn).toLocaleDateString();
      } else if (skimProducedOn) {
        return new Date(skimProducedOn).toLocaleDateString();
      }
      return '-';
    },
  },
  {
    accessorKey: 'date',
    header: 'Consumed On',
    cell: ({ row }) => {
      const date = row.original.date;
      // Format YYYY-MM-DD to a more readable format
      if (date) {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString();
      }
      return date || '-';
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
      return `${Number(row.original.weightPerBatch).toFixed(2)} kg`;
    },
  },
  {
    accessorKey: 'totalInventory',
    header: 'Total Inventory (kg)',
    cell: ({ row }) => {
      return `${Number(row.original.totalInventory).toFixed(2)} kg`;
    },
  },
  {
    accessorKey: 'inventoryRemaining',
    header: 'Remaining (kg)',
    cell: ({ row }) => {
      return `${Number(row.original.inventoryRemaining).toFixed(2)} kg`;
    },
  },
  {
    accessorKey: 'consumed',
    header: 'Consumed (kg)',
    cell: ({ row }) => {
      return `${Number(row.original.consumed).toFixed(2)} kg`;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
