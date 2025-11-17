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
        header: 'Belt #',
        cell: ({ row }) => (
          <div className="font-medium min-w-[100px]">{row.getValue('beltNumber')}</div>
        ),
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        cell: ({ row }) => {
          const rating = row.getValue('rating') as string;
          return <div className="min-w-[80px]">{rating || '-'}</div>;
        },
      },
      {
        accessorKey: 'fabric.type',
        header: 'Fabric',
        cell: ({ row }) => {
          const fabric = row.original.fabric;
          return <div className="min-w-[60px]">{fabric?.type || '-'}</div>;
        },
      },
      {
        accessorKey: 'fabric.strength',
        header: 'Strength',
        cell: ({ row }) => {
          const strength = row.original.fabric?.strength;
          return <div className="min-w-[70px]">{strength || '-'}</div>;
        },
      },
      {
        accessorKey: 'beltLengthM',
        header: 'Length (m)',
        cell: ({ row }) => {
          const length = row.original.beltLengthM;
          return <div className="min-w-[80px]">{length ? `${length}` : '-'}</div>;
        },
      },
      {
        accessorKey: 'beltWidthMm',
        header: 'Width (mm)',
        cell: ({ row }) => {
          const width = row.original.beltWidthMm;
          return <div className="min-w-[90px]">{width ? `${width}` : '-'}</div>;
        },
      },
      {
        accessorKey: 'topCoverMm',
        header: 'Top Cover',
        cell: ({ row }) => {
          const topCover = row.original.topCoverMm;
          return <div className="min-w-[90px]">{topCover ? `${topCover} mm` : '-'}</div>;
        },
      },
      {
        accessorKey: 'bottomCoverMm',
        header: 'Bottom Cover',
        cell: ({ row }) => {
          const bottomCover = row.original.bottomCoverMm;
          return <div className="min-w-[110px]">{bottomCover ? `${bottomCover} mm` : '-'}</div>;
        },
      },
      {
        accessorKey: 'edge',
        header: 'Edge',
        cell: ({ row }) => {
          const edge = row.original.edge;
          return <div className="min-w-[70px]">{edge || '-'}</div>;
        },
      },
      {
        accessorKey: 'compound.coverCompoundType',
        header: 'Cover Compound',
        cell: ({ row }) => {
          const coverCompound = row.original.compound?.coverCompoundType || row.original.compound?.type;
          return <div className="min-w-[120px]">{coverCompound || '-'}</div>;
        },
      },
      {
        accessorKey: 'compound.skimCompoundType',
        header: 'Skim Compound',
        cell: ({ row }) => {
          const skimCompound = row.original.compound?.skimCompoundType;
          return <div className="min-w-[120px]">{skimCompound || '-'}</div>;
        },
      },
      {
        accessorKey: 'compound.compoundId',
        header: 'Compound ID',
        cell: ({ row }) => {
          const compoundId = row.original.compound?.compoundId;
          return <div className="min-w-[140px] font-mono text-xs">{compoundId || '-'}</div>;
        },
      },
      {
        accessorKey: 'compound.coverCompoundProducedOn',
        header: 'Cover Produced On',
        cell: ({ row }) => {
          const date = row.original.compound?.coverCompoundProducedOn || row.original.compound?.coverCompoundUsedOn;
          return <div className="min-w-[120px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'compound.skimCompoundProducedOn',
        header: 'Skim Produced On',
        cell: ({ row }) => {
          const date = row.original.compound?.skimCompoundProducedOn || row.original.compound?.skimCompoundUsedOn;
          return <div className="min-w-[120px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'compound.coverCompoundLotSize',
        header: 'Cover Lot Size',
        cell: ({ row }) => {
          const lotSize = row.original.compound?.coverCompoundLotSize;
          return <div className="min-w-[110px]">{lotSize || '-'}</div>;
        },
      },
      {
        accessorKey: 'compound.skimCompoundLotSize',
        header: 'Skim Lot Size',
        cell: ({ row }) => {
          const lotSize = row.original.compound?.skimCompoundLotSize;
          return <div className="min-w-[100px]">{lotSize || '-'}</div>;
        },
      },
      {
        accessorKey: 'process.calendaringDate',
        header: 'Calendaring',
        cell: ({ row }) => {
          const date = row.original.process?.calendaringDate;
          return <div className="min-w-[100px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'process.calendaringMachine',
        header: 'Cal #',
        cell: ({ row }) => {
          const machine = row.original.process?.calendaringMachine;
          return <div className="min-w-[60px] text-xs">{machine || '-'}</div>;
        },
      },
      {
        accessorKey: 'process.greenBeltDate',
        header: 'Green Belt',
        cell: ({ row }) => {
          const date = row.original.process?.greenBeltDate;
          return <div className="min-w-[100px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'process.greenBeltMachine',
        header: 'Table #',
        cell: ({ row }) => {
          const machine = row.original.process?.greenBeltMachine;
          return <div className="min-w-[70px] text-xs">{machine || '-'}</div>;
        },
      },
      {
        accessorKey: 'process.curingDate',
        header: 'Curing',
        cell: ({ row }) => {
          const date = row.original.process?.curingDate;
          return <div className="min-w-[100px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'process.curingMachine',
        header: 'Press #',
        cell: ({ row }) => {
          const machine = row.original.process?.curingMachine;
          return <div className="min-w-[70px] text-xs">{machine || '-'}</div>;
        },
      },
      {
        accessorKey: 'process.inspectionDate',
        header: 'Inspection',
        cell: ({ row }) => {
          const date = row.original.process?.inspectionDate;
          return <div className="min-w-[100px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'process.inspectionMachine',
        header: 'Inspection Station',
        cell: ({ row }) => {
          const machine = row.original.process?.inspectionMachine;
          return <div className="min-w-[120px] text-xs">{machine || '-'}</div>;
        },
      },
      {
        accessorKey: 'process.pidDate',
        header: 'PID',
        cell: ({ row }) => {
          const date = row.original.process?.pidDate;
          return <div className="min-w-[100px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'process.packagingDate',
        header: 'Packaging',
        cell: ({ row }) => {
          const date = row.original.process?.packagingDate;
          return <div className="min-w-[100px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'process.dispatchDate',
        header: 'Dispatch',
        cell: ({ row }) => {
          const date = row.original.process?.dispatchDate;
          return <div className="min-w-[100px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'buyerName',
        header: 'Buyer',
        cell: ({ row }) => {
          const buyer = row.getValue('buyerName') as string;
          return <div className="min-w-[120px]">{buyer || '-'}</div>;
        },
      },
      {
        accessorKey: 'orderNumber',
        header: 'Order #',
        cell: ({ row }) => {
          const order = row.getValue('orderNumber') as string;
          return <div className="min-w-[100px]">{order || '-'}</div>;
        },
      },
      {
        accessorKey: 'orderDate',
        header: 'Order Date',
        cell: ({ row }) => {
          const date = row.original.orderDate;
          return <div className="min-w-[100px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'deliveryDeadline',
        header: 'Delivery Deadline',
        cell: ({ row }) => {
          const date = row.original.deliveryDeadline;
          return <div className="min-w-[120px] text-xs">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: 'fabric.supplier',
        header: 'Fabric Supplier',
        cell: ({ row }) => {
          const supplier = row.original.fabric?.supplier;
          return <div className="min-w-[120px] text-xs">{supplier || '-'}</div>;
        },
      },
      {
        accessorKey: 'fabric.rollNumber',
        header: 'Roll #',
        cell: ({ row }) => {
          const rollNumber = row.original.fabric?.rollNumber;
          return <div className="min-w-[90px] text-xs">{rollNumber || '-'}</div>;
        },
      },
      {
        accessorKey: 'compound.lotSize',
        header: 'Lot Size',
        cell: ({ row }) => {
          const lotSize = row.original.compound?.lotSize;
          return <div className="min-w-[80px]">{lotSize || '-'}</div>;
        },
      },
      {
        accessorKey: 'breakerPly',
        header: 'Breaker Ply',
        cell: ({ row }) => {
          const breakerPly = row.original.breakerPly;
          return <div className="min-w-[90px]">{breakerPly === undefined ? '-' : breakerPly ? 'Yes' : 'No'}</div>;
        },
      },
      {
        accessorKey: 'carcassMm',
        header: 'Carcass',
        cell: ({ row }) => {
          const carcass = row.original.carcassMm;
          return <div className="min-w-[80px]">{carcass ? `${carcass} mm` : '-'}</div>;
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
              className="min-w-[100px]"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const belt = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewBelt(belt)}
              className="min-w-[80px]"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
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
          {belt.beltLengthM && (
            <div>
              <p className="text-sm text-muted-foreground">Belt Length</p>
              <p className="font-medium">{belt.beltLengthM} m</p>
            </div>
          )}
          {belt.beltWidthMm && (
            <div>
              <p className="text-sm text-muted-foreground">Belt Width</p>
              <p className="font-medium">{belt.beltWidthMm} mm</p>
            </div>
          )}
          {belt.carcassMm && (
            <div>
              <p className="text-sm text-muted-foreground">Carcass</p>
              <p className="font-medium">{belt.carcassMm} mm</p>
            </div>
          )}
          {belt.edge && (
            <div>
              <p className="text-sm text-muted-foreground">Edge</p>
              <p className="font-medium">{belt.edge}</p>
            </div>
          )}
          {belt.breakerPly !== undefined && (
            <div>
              <p className="text-sm text-muted-foreground">Breaker Ply</p>
              <p className="font-medium">{belt.breakerPly ? 'Yes' : 'No'}</p>
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
            {belt.compound.compoundId && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Compound ID</p>
                <p className="font-mono font-semibold text-base">{belt.compound.compoundId}</p>
              </div>
            )}
            {belt.compound.coverCompoundType && (
              <div>
                <p className="text-sm text-muted-foreground">Cover Compound Type</p>
                <p className="font-medium">{belt.compound.coverCompoundType}</p>
              </div>
            )}
            {belt.compound.skimCompoundType && (
              <div>
                <p className="text-sm text-muted-foreground">Skim Compound Type</p>
                <p className="font-medium">{belt.compound.skimCompoundType}</p>
              </div>
            )}
            {/* Legacy support - show old type if new fields not available */}
            {!belt.compound.coverCompoundType && !belt.compound.skimCompoundType && belt.compound.type && (
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{belt.compound.type}</p>
              </div>
            )}
            {belt.compound.coverCompoundProducedOn && (
              <div>
                <p className="text-sm text-muted-foreground">Cover Compound Produced On</p>
                <p className="font-medium">{formatDate(belt.compound.coverCompoundProducedOn)}</p>
              </div>
            )}
            {belt.compound.skimCompoundProducedOn && (
              <div>
                <p className="text-sm text-muted-foreground">Skim Compound Produced On</p>
                <p className="font-medium">{formatDate(belt.compound.skimCompoundProducedOn)}</p>
              </div>
            )}
            {/* Legacy support - show old dates if new fields not available */}
            {!belt.compound.coverCompoundProducedOn && !belt.compound.skimCompoundProducedOn && (
              <>
                {belt.compound.coverCompoundUsedOn && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cover Compound Used On</p>
                    <p className="font-medium">{formatDate(belt.compound.coverCompoundUsedOn)}</p>
                  </div>
                )}
                {belt.compound.skimCompoundUsedOn && (
                  <div>
                    <p className="text-sm text-muted-foreground">Skim Compound Used On</p>
                    <p className="font-medium">{formatDate(belt.compound.skimCompoundUsedOn)}</p>
                  </div>
                )}
                {belt.compound.producedOn && (
                  <div>
                    <p className="text-sm text-muted-foreground">Produced On</p>
                    <p className="font-medium">{formatDate(belt.compound.producedOn)}</p>
                  </div>
                )}
                {belt.compound.usedOn && (
                  <div>
                    <p className="text-sm text-muted-foreground">Used On</p>
                    <p className="font-medium">{formatDate(belt.compound.usedOn)}</p>
                  </div>
                )}
              </>
            )}
            {belt.compound.coverCompoundLotSize && (
              <div>
                <p className="text-sm text-muted-foreground">Cover Compound Lot Size</p>
                <p className="font-medium">{belt.compound.coverCompoundLotSize}</p>
              </div>
            )}
            {belt.compound.skimCompoundLotSize && (
              <div>
                <p className="text-sm text-muted-foreground">Skim Compound Lot Size</p>
                <p className="font-medium">{belt.compound.skimCompoundLotSize}</p>
              </div>
            )}
            {/* Legacy support - show old lot size if new fields not available */}
            {!belt.compound.coverCompoundLotSize && !belt.compound.skimCompoundLotSize && belt.compound.lotSize && (
              <div>
                <p className="text-sm text-muted-foreground">Lot Size / Batch Weight</p>
                <p className="font-medium">{belt.compound.lotSize}</p>
              </div>
            )}
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
