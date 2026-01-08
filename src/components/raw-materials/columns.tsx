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

      // Parse YYYY-MM-DD format properly
      const parseDate = (dateStr: string): number => {
        if (!dateStr || typeof dateStr !== 'string') return 0;
        const trimmed = dateStr.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(trimmed)) return 0;

        const [year, month, day] = trimmed.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;

        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      };

      return parseDate(dateA) - parseDate(dateB);
    },
    cell: ({ row }) => {
      const dateStr = row.original.date;
      if (!dateStr || typeof dateStr !== 'string') return '-';

      const trimmed = dateStr.trim();
      if (!trimmed) return '-';

      // Helper function to format date as DD/MM/YYYY
      const formatDateWithSlashes = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Check if it's already in DD.MM.YYYY format (with dots) and convert to slashes
      const dotFormatRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
      if (dotFormatRegex.test(trimmed)) {
        return trimmed.replace(/\./g, '/');
      }

      // Check if it's in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(trimmed)) {
        // Parse YYYY-MM-DD format properly (local timezone)
        try {
          const [year, month, day] = trimmed.split('-').map(Number);

          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return trimmed;
          }

          // Create date in local timezone (month is 0-indexed)
          const date = new Date(year, month - 1, day);

          // Validate the date
          if (isNaN(date.getTime())) {
            return trimmed;
          }

          // Format the date with slashes
          return formatDateWithSlashes(date);
        } catch {
          return trimmed;
        }
      }

      // If not in expected format, try to parse as-is
      try {
        const date = new Date(trimmed);
        if (isNaN(date.getTime())) {
          // If can't parse, try to replace dots with slashes if present
          if (trimmed.includes('.')) {
            return trimmed.replace(/\./g, '/');
          }
          return trimmed; // Return original string if can't parse
        }
        return formatDateWithSlashes(date);
      } catch {
        // If parsing fails, try to replace dots with slashes if present
        if (trimmed.includes('.')) {
          return trimmed.replace(/\./g, '/');
        }
        return trimmed;
      }
    },
  },

  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
