'use client';

import { ColumnDef } from '@tanstack/react-table';
import { BeltDoc } from '@/model/Belt';
import { Badge } from '@/components/ui/badge';
import { DataTableRowActions } from './row-actions';

export const columns: ColumnDef<BeltDoc>[] = [
  {
    accessorKey: 'beltNumber',
    header: 'Belt Number',
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
    accessorKey: 'rating',
    header: 'Rating',
  },
  {
    accessorKey: 'orderNumber',
    header: 'Order Number',
  },
  {
    accessorKey: 'buyerName',
    header: 'Buyer Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === 'Dispatched' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value === undefined || row.getValue(id) === value;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
