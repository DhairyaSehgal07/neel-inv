'use client';

import { ColumnDef } from '@tanstack/react-table';
import { BeltDoc } from '@/model/Belt';
import { Badge } from '@/components/ui/badge';
import { DataTableRowActions } from './row-actions';
import { FabricInfo } from '@/types/belt';
import { roundToNearest5 } from '@/lib/utils';

type BeltWithFabric = BeltDoc & { fabric?: FabricInfo };

export const columns: ColumnDef<BeltWithFabric>[] = [
  {
    accessorKey: 'beltNumber',
    header: 'Belt No.',
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
      return width ? `${roundToNearest5(Number(width)).toFixed(2)} mm` : '-';
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
      return top ? `${roundToNearest5(Number(top)).toFixed(2)} mm` : '-';
    },
  },
  {
    accessorKey: 'bottomCoverMm',
    header: 'Bottom',
    cell: ({ row }) => {
      const bottom = row.original.bottomCoverMm;
      return bottom ? `${roundToNearest5(Number(bottom)).toFixed(2)} mm` : '-';
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
      return length ? `${roundToNearest5(Number(length)).toFixed(2)} m` : '-';
    },
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
