'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Belt, SAMPLE_BELTS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import NewBeltDialog from '@/components/new-belt-dialog';
import { formatDate } from '@/lib/date-utils';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReverseTrackingPage() {
  const [belts, setBelts] = useState<Belt[]>(SAMPLE_BELTS);
  const [selectedBelt, setSelectedBelt] = useState<Belt | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleAddBelt = (belt: Belt) => {
    setBelts([belt, ...belts]);
  };

  const handleViewBelt = (belt: Belt) => {
    setSelectedBelt(belt);
    setViewDialogOpen(true);
  };

  const columns: ColumnDef<Belt>[] = useMemo(
    () => [
      {
        accessorKey: 'beltNumber',
        header: 'Belt Number',
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('beltNumber')}</div>
        ),
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        cell: ({ row }) => {
          const rating = row.getValue('rating') as string;
          return <div>{rating || '-'}</div>;
        },
      },
      {
        accessorKey: 'fabric.type',
        header: 'Fabric Type',
        cell: ({ row }) => {
          const fabric = row.original.fabric;
          return <div>{fabric?.type || '-'}</div>;
        },
      },
      {
        accessorKey: 'buyerName',
        header: 'Buyer',
        cell: ({ row }) => {
          const buyer = row.getValue('buyerName') as string;
          return <div>{buyer || '-'}</div>;
        },
      },
      {
        accessorKey: 'orderNumber',
        header: 'Order #',
        cell: ({ row }) => {
          const order = row.getValue('orderNumber') as string;
          return <div>{order || '-'}</div>;
        },
      },
      {
        accessorKey: 'process.calendaringDate',
        header: 'Calendaring Date',
        cell: ({ row }) => {
          const date = row.original.process?.calendaringDate;
          return <div>{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          return (
            <Badge
              variant={status === 'Dispatched' ? 'default' : 'secondary'}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const belt = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewBelt(belt)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reverse Tracking System</h1>
          <p className="text-muted-foreground mt-1">
            Trace belts back through raw materials, compounding, and processing stages
          </p>
        </div>
        <NewBeltDialog onAdd={handleAddBelt} />
      </div>

      <DataTable
        columns={columns}
        data={belts}
        searchKey="beltNumber"
        searchPlaceholder="Search by belt number..."
      />

      {/* Belt Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Belt Details - {selectedBelt?.beltNumber}</DialogTitle>
          </DialogHeader>
          {selectedBelt && <BeltDetailView belt={selectedBelt} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BeltDetailView({ belt }: { belt: Belt }) {
  return (
    <div className="space-y-6 mt-4">
      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Rating</p>
            <p className="font-medium">{belt.rating || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fabric Type</p>
            <p className="font-medium">{belt.fabric?.type || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Top Cover</p>
            <p className="font-medium">{belt.topCoverMm ? `${belt.topCoverMm} mm` : '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bottom Cover</p>
            <p className="font-medium">{belt.bottomCoverMm ? `${belt.bottomCoverMm} mm` : '-'}</p>
          </div>
          {belt.carcassMm && (
            <div>
              <p className="text-sm text-muted-foreground">Carcass</p>
              <p className="font-medium">{belt.carcassMm} mm</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fabric Information */}
      <Card>
        <CardHeader>
          <CardTitle>Fabric Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Rating</p>
            <p className="font-medium">{belt.fabric?.rating || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Strength</p>
            <p className="font-medium">{belt.fabric?.strength || '-'}</p>
          </div>
          {belt.fabric?.supplier && (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{belt.fabric.supplier}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compound Information */}
      {belt.compound && (
        <Card>
          <CardHeader>
            <CardTitle>Compound Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{belt.compound.type || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produced On</p>
              <p className="font-medium">{formatDate(belt.compound.producedOn)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Used On</p>
              <p className="font-medium">{formatDate(belt.compound.usedOn)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Timeline */}
      {belt.process && (
        <Card>
          <CardHeader>
            <CardTitle>Production Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {belt.process.calendaringDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">Calendaring Date</span>
                  <span className="font-medium">{formatDate(belt.process.calendaringDate)}</span>
                </div>
              )}
              {belt.process.greenBeltDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">Green Belt Date</span>
                  <span className="font-medium">{formatDate(belt.process.greenBeltDate)}</span>
                </div>
              )}
              {belt.process.curingDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">Curing (Press) Date</span>
                  <span className="font-medium">{formatDate(belt.process.curingDate)}</span>
                </div>
              )}
              {belt.process.inspectionDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">Inspection Date</span>
                  <span className="font-medium">{formatDate(belt.process.inspectionDate)}</span>
                </div>
              )}
              {belt.process.pidDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">PID Date</span>
                  <span className="font-medium">{formatDate(belt.process.pidDate)}</span>
                </div>
              )}
              {belt.process.packagingDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">Packaging Date</span>
                  <span className="font-medium">{formatDate(belt.process.packagingDate)}</span>
                </div>
              )}
              {belt.process.dispatchDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Dispatch Date</span>
                  <span className="font-medium">{formatDate(belt.process.dispatchDate)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Information */}
      {(belt.orderNumber || belt.buyerName) && (
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {belt.orderNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-medium">{belt.orderNumber}</p>
              </div>
            )}
            {belt.buyerName && (
              <div>
                <p className="text-sm text-muted-foreground">Buyer Name</p>
                <p className="font-medium">{belt.buyerName}</p>
              </div>
            )}
            {belt.orderDate && (
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">{formatDate(belt.orderDate)}</p>
              </div>
            )}
            {belt.deliveryDeadline && (
              <div>
                <p className="text-sm text-muted-foreground">Delivery Deadline</p>
                <p className="font-medium">{formatDate(belt.deliveryDeadline)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
