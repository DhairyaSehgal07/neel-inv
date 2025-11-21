'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BeltDoc } from '@/model/Belt';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FabricInfo } from '@/types/belt';

interface BeltDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  belt: BeltDoc & { fabric?: FabricInfo };
}

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | React.ReactNode;
}) => (
  <div className="grid grid-cols-2 gap-4 py-2">
    <div className="font-medium text-muted-foreground">{label}:</div>
    <div>{value}</div>
  </div>
);

export default function BeltDetailsDialog({ open, onOpenChange, belt }: BeltDetailsDialogProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCompoundCode = (code?: string, date?: string) => {
    if (!code) return '-';
    if (!date) return code;
    // Format date from YYYY-MM-DD to YYYYMMDD (remove dashes)
    const formattedDate = date.replace(/-/g, '');
    return `${code}-${formattedDate}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Belt Details - {belt.beltNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="space-y-1">
              <DetailRow label="Belt Number" value={belt.beltNumber} />
              <DetailRow label="Rating" value={belt.rating || '-'} />
              <DetailRow
                label="Status"
                value={
                  <Badge variant={belt.status === 'Dispatched' ? 'default' : 'secondary'}>
                    {belt.status}
                  </Badge>
                }
              />
              <DetailRow
                label="Entry Type"
                value={<Badge variant="outline">{belt.entryType}</Badge>}
              />
              <DetailRow label="Edge" value={belt.edge || '-'} />
              <DetailRow label="Cover Grade" value={belt.coverGrade || '-'} />
              <DetailRow label="Breaker Ply" value={belt.breakerPly ? 'Yes' : 'No'} />
              {belt.breakerPly && belt.breakerPlyRemarks && (
                <DetailRow label="Breaker Ply Remarks" value={belt.breakerPlyRemarks} />
              )}
            </div>
          </div>

          <Separator />

          {/* Belt Specifications */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Belt Specifications</h3>
            <div className="space-y-1">
              <DetailRow label="Length" value={belt.beltLengthM ? `${belt.beltLengthM} m` : '-'} />
              <DetailRow label="Width" value={belt.beltWidthMm ? `${belt.beltWidthMm} mm` : '-'} />
              <DetailRow
                label="Top Cover"
                value={belt.topCoverMm ? `${belt.topCoverMm} mm` : '-'}
              />
              <DetailRow
                label="Bottom Cover"
                value={belt.bottomCoverMm ? `${belt.bottomCoverMm} mm` : '-'}
              />
              <DetailRow label="Carcass" value={belt.carcassMm ? `${belt.carcassMm} mm` : '-'} />
            </div>
          </div>

          <Separator />

          {/* Order Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Order Information</h3>
            <div className="space-y-1">
              <DetailRow label="Order Number" value={belt.orderNumber || '-'} />
              <DetailRow label="Buyer Name" value={belt.buyerName || '-'} />
              <DetailRow label="Order Date" value={formatDate(belt.orderDate)} />
              <DetailRow label="Delivery Deadline" value={formatDate(belt.deliveryDeadline)} />
            </div>
          </div>

          <Separator />

          {/* Process Dates */}
          {belt.process && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">Process Dates</h3>
                <div className="space-y-1">
                  {belt.process.calendaringDate && (
                    <DetailRow
                      label="Calendaring Date"
                      value={
                        <div>
                          {formatDate(belt.process.calendaringDate)}
                          {belt.process.calendaringMachine && (
                            <span className="text-muted-foreground ml-2">
                              (Machine: {belt.process.calendaringMachine})
                            </span>
                          )}
                        </div>
                      }
                    />
                  )}
                  {belt.process.greenBeltDate && (
                    <DetailRow
                      label="Green Belt Date"
                      value={
                        <div>
                          {formatDate(belt.process.greenBeltDate)}
                          {belt.process.greenBeltMachine && (
                            <span className="text-muted-foreground ml-2">
                              (Machine: {belt.process.greenBeltMachine})
                            </span>
                          )}
                        </div>
                      }
                    />
                  )}
                  {belt.process.curingDate && (
                    <DetailRow
                      label="Curing Date"
                      value={
                        <div>
                          {formatDate(belt.process.curingDate)}
                          {belt.process.curingMachine && (
                            <span className="text-muted-foreground ml-2">
                              (Machine: {belt.process.curingMachine})
                            </span>
                          )}
                        </div>
                      }
                    />
                  )}
                  {belt.process.inspectionDate && (
                    <DetailRow
                      label="Inspection Date"
                      value={
                        <div>
                          {formatDate(belt.process.inspectionDate)}
                          {belt.process.inspectionMachine && (
                            <span className="text-muted-foreground ml-2">
                              (Machine: {belt.process.inspectionMachine})
                            </span>
                          )}
                        </div>
                      }
                    />
                  )}
                  {belt.process.pidDate && (
                    <DetailRow label="PID Date" value={formatDate(belt.process.pidDate)} />
                  )}
                  {belt.process.packagingDate && (
                    <DetailRow
                      label="Packaging Date"
                      value={formatDate(belt.process.packagingDate)}
                    />
                  )}
                  {belt.process.dispatchDate && (
                    <DetailRow
                      label="Dispatch Date"
                      value={formatDate(belt.process.dispatchDate)}
                    />
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Compound Batches Used */}
          {((belt.coverBatchesUsed && belt.coverBatchesUsed.length > 0) ||
            (belt.skimBatchesUsed && belt.skimBatchesUsed.length > 0)) && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">Compound Batches Used</h3>
                {belt.coverBatchesUsed && belt.coverBatchesUsed.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Cover Batches:</h4>
                    <div className="space-y-2">
                      {belt.coverBatchesUsed.map((batch, index) => (
                        <div key={index} className="p-2 bg-muted rounded-md text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-muted-foreground">Batch ID:</span>
                            <span>
                              {typeof batch.batchId === 'string'
                                ? batch.batchId
                                : batch.batchId.toString()}
                            </span>
                            {batch.compoundCode && (
                              <>
                                <span className="text-muted-foreground">Compound Code:</span>
                                <span>{formatCompoundCode(batch.compoundCode, batch.date)}</span>
                              </>
                            )}
                            {batch.date && (
                              <>
                                <span className="text-muted-foreground">Date:</span>
                                <span>{formatDate(batch.date)}</span>
                              </>
                            )}
                            <span className="text-muted-foreground">Consumed:</span>
                            <span>{batch.consumedKg} kg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {belt.skimBatchesUsed && belt.skimBatchesUsed.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Skim Batches:</h4>
                    <div className="space-y-2">
                      {belt.skimBatchesUsed.map((batch, index) => (
                        <div key={index} className="p-2 bg-muted rounded-md text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-muted-foreground">Batch ID:</span>
                            <span>
                              {typeof batch.batchId === 'string'
                                ? batch.batchId
                                : batch.batchId.toString()}
                            </span>
                            {batch.compoundCode && (
                              <>
                                <span className="text-muted-foreground">Compound Code:</span>
                                <span>{formatCompoundCode(batch.compoundCode, batch.date)}</span>
                              </>
                            )}
                            {batch.date && (
                              <>
                                <span className="text-muted-foreground">Date:</span>
                                <span>{formatDate(batch.date)}</span>
                              </>
                            )}
                            <span className="text-muted-foreground">Consumed:</span>
                            <span>{batch.consumedKg} kg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* Fabric Information */}
          {belt.fabric && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">Fabric Information</h3>
                <div className="space-y-1">
                  <DetailRow label="Type" value={belt.fabric.type || '-'} />
                  <DetailRow label="Rating" value={belt.fabric.rating || '-'} />
                  <DetailRow
                    label="Strength"
                    value={belt.fabric.strength !== undefined ? belt.fabric.strength : '-'}
                  />
                  <DetailRow label="Supplier" value={belt.fabric.supplier || '-'} />
                  <DetailRow label="Roll Number" value={belt.fabric.rollNumber || '-'} />
                  <DetailRow
                    label="Consumed Meters"
                    value={
                      belt.fabric.consumedMeters !== undefined
                        ? `${belt.fabric.consumedMeters} m`
                        : '-'
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
