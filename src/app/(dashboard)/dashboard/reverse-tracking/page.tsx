'use client';

import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Belt, SAMPLE_BELTS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import NewBeltDialog from '@/components/new-belt-dialog';
import { formatDate } from '@/lib/date-utils';
import { Eye, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STORAGE_KEY = 'reverse-tracking-belts';

export default function ReverseTrackingPage() {
  // Initialize with SAMPLE_BELTS to avoid hydration mismatch
  const [belts, setBelts] = useState<Belt[]>(SAMPLE_BELTS);
  const [selectedBelt, setSelectedBelt] = useState<Belt | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingBelt, setEditingBelt] = useState<Belt | null>(null);
  const isInitialLoad = useRef(true);

  // Load from localStorage after hydration (client-side only)
  // Using useLayoutEffect to load before paint to minimize visual flash
  // Note: setState in effect is necessary here to avoid hydration mismatch.
  // We initialize with SAMPLE_BELTS (same on server/client), then update from localStorage after mount.
  // This is a standard pattern for localStorage in Next.js to prevent hydration errors.
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsedBelts = JSON.parse(stored);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setBelts(parsedBelts);
        } catch (error) {
          console.error('Error parsing stored belts:', error);
        }
      }
      isInitialLoad.current = false;
    }
  }, []);

  // Save belts to localStorage whenever they change (client-side only, skip initial load)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialLoad.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(belts));
    }
  }, [belts]);

  const handleAddBelt = (belt: Belt) => {
    setBelts([belt, ...belts]);
  };

  const handleUpdateBelt = (updatedBelt: Belt) => {
    setBelts(belts.map((b) => (b.id === updatedBelt.id ? updatedBelt : b)));
    setEditingBelt(null);
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
        accessorKey: 'coverGrade',
        header: 'Cover Grade',
        cell: ({ row }) => {
          const width = row.original.coverGrade;
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
        accessorKey: 'breakerPly',
        header: 'Breaker Ply',
        cell: ({ row }) => {
          const breakerPly = row.original.breakerPly;
          return (
            <div className="min-w-[90px]">
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
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewBelt(belt)}
                className="min-w-[80px]"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditBelt(belt)}
                className="min-w-[80px]"
              >
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
    <div className="w-full overflow-x-hidden">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold">Reverse Tracking System</h1>
            <p className="text-muted-foreground mt-1">
              Trace belts back through raw materials, compounding, and processing stages
            </p>
          </div>
          <div className="shrink-0">
            <NewBeltDialog onAdd={handleAddBelt} />
          </div>
        </div>

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
            {/* Only show compoundId for Auto entries */}
            {belt.entryType === 'Auto' && belt.compound.compoundId && (
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
            {!belt.compound.coverCompoundType &&
              !belt.compound.skimCompoundType &&
              belt.compound.type && (
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
                <p className="text-sm text-muted-foreground">Cover Compound consumed</p>
                <p className="font-medium">{belt.compound.coverCompoundLotSize}</p>
              </div>
            )}
            {belt.compound.skimCompoundLotSize && (
              <div>
                <p className="text-sm text-muted-foreground">Skim Compound consumed</p>
                <p className="font-medium">{belt.compound.skimCompoundLotSize}</p>
              </div>
            )}
            {/* Legacy support - show old lot size if new fields not available */}
            {!belt.compound.coverCompoundLotSize &&
              !belt.compound.skimCompoundLotSize &&
              belt.compound.lotSize && (
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
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Calendaring Date</span>
                    {belt.process.calendaringMachine && (
                      <span className="text-xs text-muted-foreground mt-0.5">Cal #: {belt.process.calendaringMachine}</span>
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
                      <span className="text-xs text-muted-foreground mt-0.5">Table #: {belt.process.greenBeltMachine}</span>
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
                      <span className="text-xs text-muted-foreground mt-0.5">Press #: {belt.process.curingMachine}</span>
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
                      <span className="text-xs text-muted-foreground mt-0.5">Inspection Station: {belt.process.inspectionMachine}</span>
                    )}
                  </div>
                  <span className="font-medium">{formatDate(belt.process.inspectionDate)}</span>
                </div>
              )}
              {belt.process.pidDate && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">PDI Date (Pre Dispatch Inspection)</span>
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
