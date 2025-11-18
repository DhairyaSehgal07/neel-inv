'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Belt } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import NewBeltDialog from '@/components/new-belt-dialog';
import NewBeltDialogAuto from '@/components/auto-new-belt-dialog';
import { formatDate } from '@/lib/date-utils';
import { Eye, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReverseTrackingPageProps {
  initialBelts?: Belt[];
}

export default function ReverseTrackingPage({ initialBelts = [] }: ReverseTrackingPageProps) {
  const [belts, setBelts] = useState<Belt[]>(initialBelts);
  const [selectedBelt, setSelectedBelt] = useState<Belt | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingBelt, setEditingBelt] = useState<Belt | null>(null);

  const handleAddBelt = (belt: Belt) => {
    setBelts([belt, ...belts]);
    // TODO: Add API call to save belt to database
    // await fetch('/api/belts', { method: 'POST', body: JSON.stringify(belt) });
  };

  const handleUpdateBelt = (updatedBelt: Belt) => {
    setBelts(belts.map((b) => (b.id === updatedBelt.id ? updatedBelt : b)));
    setEditingBelt(null);
    // TODO: Add API call to update belt in database
    // await fetch(`/api/belts/${updatedBelt.id}`, { method: 'PUT', body: JSON.stringify(updatedBelt) });
  };

  const handleViewBelt = (belt: Belt) => {
    setSelectedBelt(belt);
    setViewDialogOpen(true);
  };

  const handleEditBelt = (belt: Belt) => {
    setEditingBelt(belt);
  };

  const columns: ColumnDef<Belt>[] = useMemo(
    () => [
      {
        accessorKey: 'beltNumber',
        header: 'Belt #',
        cell: ({ row }) => <div className="font-medium truncate">{row.getValue('beltNumber')}</div>,
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        cell: ({ row }) => {
          const rating = row.getValue('rating') as string;
          return <div className="truncate">{rating || '-'}</div>;
        },
      },
      {
        accessorKey: 'fabric.type',
        header: 'Fabric',
        cell: ({ row }) => {
          const fabric = row.original.fabric;
          return <div className="truncate">{fabric?.type || '-'}</div>;
        },
      },
      {
        accessorKey: 'beltLengthM',
        header: 'Length (m)',
        cell: ({ row }) => {
          const length = row.original.beltLengthM;
          return <div className="truncate">{length ? `${length}` : '-'}</div>;
        },
      },
      {
        accessorKey: 'beltWidthMm',
        header: 'Width (m)',
        cell: ({ row }) => {
          const width = row.original.beltWidthMm;
          return <div className="truncate">{width ? `${(width / 1000).toFixed(3)}` : '-'}</div>;
        },
      },
      {
        accessorKey: 'coverGrade',
        header: 'Cover Grade',
        cell: ({ row }) => {
          const coverGrade = row.original.coverGrade;
          return <div className="truncate">{coverGrade || '-'}</div>;
        },
      },
      {
        accessorKey: 'topCoverMm',
        header: 'Top Cover',
        cell: ({ row }) => {
          const topCover = row.original.topCoverMm;
          return <div className="truncate">{topCover ? `${topCover} mm` : '-'}</div>;
        },
      },
      {
        accessorKey: 'bottomCoverMm',
        header: 'Bottom Cover',
        cell: ({ row }) => {
          const bottomCover = row.original.bottomCoverMm;
          return <div className="truncate">{bottomCover ? `${bottomCover} mm` : '-'}</div>;
        },
      },
      {
        accessorKey: 'edge',
        header: 'Edge',
        cell: ({ row }) => {
          const edge = row.original.edge;
          return <div className="truncate">{edge || '-'}</div>;
        },
      },
      {
        accessorKey: 'buyerName',
        header: 'Buyer',
        cell: ({ row }) => {
          const buyer = row.getValue('buyerName') as string;
          return <div className="truncate">{buyer || '-'}</div>;
        },
      },
      {
        accessorKey: 'orderNumber',
        header: 'Order #',
        cell: ({ row }) => {
          const order = row.getValue('orderNumber') as string;
          return <div className="truncate">{order || '-'}</div>;
        },
      },
      {
        accessorKey: 'breakerPly',
        header: 'Breaker Ply',
        cell: ({ row }) => {
          const breakerPly = row.original.breakerPly;
          return (
            <div className="truncate">
              {breakerPly === undefined ? '-' : breakerPly ? 'Yes' : 'No'}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          return (
            <Badge variant={status === 'Dispatched' ? 'default' : 'secondary'} className="truncate">
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
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={() => handleViewBelt(belt)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleEditBelt(belt)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="w-full flex flex-col">
      <div className="px-6 pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold">Reverse Tracking System</h1>
            <p className="text-muted-foreground mt-1">
              Trace belts back through raw materials, compounding, and processing stages
            </p>
          </div>
          <div className="shrink-0 flex gap-2">
            <NewBeltDialog onAdd={handleAddBelt} />
            <NewBeltDialogAuto onAdd={handleAddBelt} />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 flex-1 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={belts}
          searchKey="beltNumber"
          searchPlaceholder="Search by belt number..."
        />
      </div>

      {/* Belt Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Belt Details - Belt {selectedBelt?.beltNumber}</DialogTitle>
              {selectedBelt && (
                <div className="flex gap-2">
                  <Badge variant={selectedBelt.entryType === 'Auto' ? 'default' : 'outline'}>
                    {selectedBelt.entryType || 'Manual'}
                  </Badge>
                  <Badge variant={selectedBelt.status === 'Dispatched' ? 'default' : 'secondary'}>
                    {selectedBelt.status}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>
          {selectedBelt && <BeltDetailView belt={selectedBelt} />}
        </DialogContent>
      </Dialog>

      {/* Edit Belt Dialog */}
      <NewBeltDialog
        belt={editingBelt || undefined}
        onUpdate={(updatedBelt) => {
          handleUpdateBelt(updatedBelt);
          setEditingBelt(null);
        }}
        open={!!editingBelt}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingBelt(null);
          }
        }}
        trigger={<div style={{ display: 'none' }} />}
      />
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
              <p className="font-medium">{(belt.beltWidthMm / 1000).toFixed(3)} m</p>
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
          {belt.coverGrade && (
            <div>
              <p className="text-sm text-muted-foreground">Cover Grade</p>
              <p className="font-medium">{belt.coverGrade}</p>
            </div>
          )}
          {belt.breakerPly !== undefined && (
            <div className={belt.breakerPly && belt.breakerPlyRemarks ? 'col-span-2' : ''}>
              <p className="text-sm text-muted-foreground">Breaker Ply</p>
              <p className="font-medium">{belt.breakerPly ? 'Yes' : 'No'}</p>
              {belt.breakerPly && belt.breakerPlyRemarks && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="font-medium text-sm whitespace-pre-wrap">
                    {belt.breakerPlyRemarks}
                  </p>
                </div>
              )}
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
          {belt.fabric?.rollNumber && (
            <div>
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="font-medium">{belt.fabric.rollNumber}</p>
            </div>
          )}
          {belt.fabric?.consumedMeters !== undefined && (
            <div>
              <p className="text-sm text-muted-foreground">Fabric Consumed</p>
              <p className="font-medium">{belt.fabric.consumedMeters} m</p>
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
            {belt.compound.coverCompoundConsumed && (
              <div>
                <p className="text-sm text-muted-foreground">Cover Compound Consumed</p>
                <p className="font-medium">{belt.compound.coverCompoundConsumed}</p>
              </div>
            )}
            {belt.compound.skimCompoundConsumed && (
              <div>
                <p className="text-sm text-muted-foreground">Skim Compound Consumed</p>
                <p className="font-medium">{belt.compound.skimCompoundConsumed}</p>
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
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Calendaring Date</span>
                    {belt.process.calendaringMachine && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Cal #: {belt.process.calendaringMachine}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{formatDate(belt.process.calendaringDate)}</span>
                </div>
              )}
              {belt.process.greenBeltDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Green Belt Date</span>
                    {belt.process.greenBeltMachine && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Table #: {belt.process.greenBeltMachine}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{formatDate(belt.process.greenBeltDate)}</span>
                </div>
              )}
              {belt.process.curingDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Curing (Press) Date</span>
                    {belt.process.curingMachine && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Press #: {belt.process.curingMachine}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{formatDate(belt.process.curingDate)}</span>
                </div>
              )}
              {belt.process.inspectionDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Internal Inspection Date</span>
                    {belt.process.inspectionMachine && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Inspection Station: {belt.process.inspectionMachine}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{formatDate(belt.process.inspectionDate)}</span>
                </div>
              )}
              {belt.process.pidDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">
                    PDI Date (Pre Dispatch Inspection)
                  </span>
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
