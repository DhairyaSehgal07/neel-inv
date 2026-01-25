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
      const dateA = (rowA.getValue('date') as string) || rowA.original.date || '';
      const dateB = (rowB.getValue('date') as string) || rowB.original.date || '';
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      // Parse date from various formats
      const parseDate = (dateStr: string): number => {
        if (!dateStr || typeof dateStr !== 'string') return 0;
        const trimmed = dateStr.trim();
        if (!trimmed) return 0;

        // Try YYYY-MM-DD format first (primary format stored in database)
        const yyyyMMddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const yyyyMMddMatch = trimmed.match(yyyyMMddRegex);
        if (yyyyMMddMatch) {
          const year = parseInt(yyyyMMddMatch[1], 10);
          const month = parseInt(yyyyMMddMatch[2], 10);
          const day = parseInt(yyyyMMddMatch[3], 10);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
              return date.getTime();
            }
          }
        }

        // Try DD.MM.YYYY or DD/MM/YYYY format (display format)
        const ddmmyyyyRegex = /^(\d{2})[./](\d{2})[./](\d{4})$/;
        const ddmmyyyyMatch = trimmed.match(ddmmyyyyRegex);
        if (ddmmyyyyMatch) {
          const day = parseInt(ddmmyyyyMatch[1], 10);
          const month = parseInt(ddmmyyyyMatch[2], 10);
          const year = parseInt(ddmmyyyyMatch[3], 10);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
              return date.getTime();
            }
          }
        }

        // Fallback: try to parse as Date object
        try {
          const date = new Date(trimmed);
          if (!isNaN(date.getTime())) {
            return date.getTime();
          }
        } catch {
          // Ignore parsing errors
        }

        // If all parsing fails, return 0 (will be sorted to top/bottom)
        return 0;
      };

      const timeA = parseDate(dateA);
      const timeB = parseDate(dateB);
      return timeA - timeB;
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
