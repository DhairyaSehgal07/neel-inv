'use client';

import { useState, useMemo } from 'react';
import { BeltDoc } from '@/model/Belt';
import { useUpdateBeltMutation } from '@/services/api/queries/belts/clientBelts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { BeltFormData } from '@/types/belt';
import { FabricInfo } from '@/types/belt';

interface EditBeltDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  belt: BeltDoc & { fabric?: FabricInfo };
}

// Helper function to initialize form data from belt
function initializeFormData(belt: BeltDoc & { fabric?: FabricInfo }): Partial<BeltFormData> {
  return {
    beltNumber: belt.beltNumber || '',
    rating: belt.rating || '',
    beltStrength: belt.fabric?.strength,
    fabricType: belt.fabric?.type || '',
    topCover: belt.topCoverMm?.toString() || '',
    bottomCover: belt.bottomCoverMm?.toString() || '',
    beltLength: belt.beltLengthM?.toString() || '',
    beltWidth: belt.beltWidthMm?.toString() || '',
    edge: belt.edge || '',
    carcass: belt.carcassMm?.toString() || '',
    coverGrade: belt.coverGrade || '',
    breakerPly: belt.breakerPly || false,
    breakerPlyRemarks: belt.breakerPlyRemarks || '',
    orderNumber: belt.orderNumber || '',
    buyerName: belt.buyerName || '',
    orderDate: belt.orderDate ? new Date(belt.orderDate) : undefined,
    deliveryDeadline: belt.deliveryDeadline ? new Date(belt.deliveryDeadline) : undefined,
    status: belt.status || 'In Production',
    fabricSupplier: belt.fabric?.supplier || '',
    rollNumber: belt.fabric?.rollNumber || '',
    fabricConsumed: belt.fabric?.consumedMeters?.toString() || '',
    calendaringDate: belt.process?.calendaringDate ? new Date(belt.process.calendaringDate) : undefined,
    calendaringStation: belt.process?.calendaringMachine || '',
    greenBeltDate: belt.process?.greenBeltDate ? new Date(belt.process.greenBeltDate) : undefined,
    greenBeltStation: belt.process?.greenBeltMachine || '',
    curingDate: belt.process?.curingDate ? new Date(belt.process.curingDate) : undefined,
    pressStation: belt.process?.curingMachine || '',
    inspectionDate: belt.process?.inspectionDate ? new Date(belt.process.inspectionDate) : undefined,
    inspectionStation: belt.process?.inspectionMachine || '',
    pdiDate: belt.process?.pidDate ? new Date(belt.process.pidDate) : undefined,
    packagingDate: belt.process?.packagingDate ? new Date(belt.process.packagingDate) : undefined,
    dispatchDate: belt.process?.dispatchDate ? new Date(belt.process.dispatchDate) : undefined,
    coverCompoundProducedOn: belt.process?.coverCompoundProducedOn ? new Date(belt.process.coverCompoundProducedOn) : undefined,
    skimCompoundProducedOn: belt.process?.skimCompoundProducedOn ? new Date(belt.process.skimCompoundProducedOn) : undefined,
  };
}

// Inner component that holds form state - will remount when key changes
function EditBeltFormContent({
  belt,
  beltId,
  onClose,
}: {
  belt: BeltDoc & { fabric?: FabricInfo };
  beltId: string;
  onClose: () => void;
}) {
  const updateMutation = useUpdateBeltMutation();
  const [formData, setFormData] = useState<Partial<BeltFormData>>(() =>
    initializeFormData(belt)
  );

  const handleSubmit = async () => {
    if (!formData.beltNumber?.trim()) {
      toast.error('Please enter a belt number');
      return;
    }

    if (!beltId) {
      toast.error('Invalid belt ID');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: beltId,
        payload: {
          formData: formData as BeltFormData,
        },
      });
      toast.success('Belt updated successfully');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to update belt: ${errorMessage}`);
    }
  };

  const isLoading = updateMutation.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Belt - {belt.beltNumber}</DialogTitle>
      </DialogHeader>

      <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Belt Number *</Label>
                <Input
                  value={formData.beltNumber || ''}
                  onChange={(e) => setFormData({ ...formData, beltNumber: e.target.value })}
                  placeholder="Belt number"
                />
              </div>
              <div>
                <Label>Rating</Label>
                <Input
                  value={formData.rating || ''}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="Rating"
                />
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  value={formData.status || 'In Production'}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Production">In Production</SelectItem>
                    <SelectItem value="Dispatched">Dispatched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Edge</Label>
                <Select
                  value={formData.edge || ''}
                  onValueChange={(value) => setFormData({ ...formData, edge: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select edge type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cut">Cut</SelectItem>
                    <SelectItem value="Moulded">Moulded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cover Grade</Label>
                <Input
                  value={formData.coverGrade || ''}
                  onChange={(e) => setFormData({ ...formData, coverGrade: e.target.value })}
                  placeholder="Cover grade"
                />
              </div>
            </div>
          </div>

          {/* Belt Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Belt Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Length (m)</Label>
                <Input
                  type="number"
                  value={formData.beltLength || ''}
                  onChange={(e) => setFormData({ ...formData, beltLength: e.target.value })}
                  placeholder="Length in meters"
                />
              </div>
              <div>
                <Label>Width (mm)</Label>
                <Input
                  type="number"
                  value={formData.beltWidth || ''}
                  onChange={(e) => setFormData({ ...formData, beltWidth: e.target.value })}
                  placeholder="Width in mm"
                />
              </div>
              <div>
                <Label>Top Cover (mm)</Label>
                <Input
                  type="number"
                  value={formData.topCover || ''}
                  onChange={(e) => setFormData({ ...formData, topCover: e.target.value })}
                  placeholder="Top cover in mm"
                />
              </div>
              <div>
                <Label>Bottom Cover (mm)</Label>
                <Input
                  type="number"
                  value={formData.bottomCover || ''}
                  onChange={(e) => setFormData({ ...formData, bottomCover: e.target.value })}
                  placeholder="Bottom cover in mm"
                />
              </div>
              <div>
                <Label>Carcass (mm)</Label>
                <Input
                  type="number"
                  value={formData.carcass || ''}
                  onChange={(e) => setFormData({ ...formData, carcass: e.target.value })}
                  placeholder="Carcass in mm"
                />
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Order Number</Label>
                <Input
                  value={formData.orderNumber || ''}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  placeholder="Order number"
                />
              </div>
              <div>
                <Label>Buyer Name</Label>
                <Input
                  value={formData.buyerName || ''}
                  onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                  placeholder="Buyer name"
                />
              </div>
              <div>
                <Label>Order Date</Label>
                <Input
                  type="date"
                  value={
                    formData.orderDate
                      ? new Date(formData.orderDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orderDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Delivery Deadline</Label>
                <Input
                  type="date"
                  value={
                    formData.deliveryDeadline
                      ? new Date(formData.deliveryDeadline).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryDeadline: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Fabric Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fabric Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fabric Type</Label>
                <Input
                  value={formData.fabricType || ''}
                  onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}
                  placeholder="Fabric type"
                />
              </div>
              <div>
                <Label>Roll Number</Label>
                <Input
                  value={formData.rollNumber || ''}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  placeholder="Roll number"
                />
              </div>
              <div>
                <Label>Fabric Supplier</Label>
                <Input
                  value={formData.fabricSupplier || ''}
                  onChange={(e) => setFormData({ ...formData, fabricSupplier: e.target.value })}
                  placeholder="Fabric supplier"
                />
              </div>
              <div>
                <Label>Fabric Consumed (m)</Label>
                <Input
                  type="number"
                  value={formData.fabricConsumed || ''}
                  onChange={(e) => setFormData({ ...formData, fabricConsumed: e.target.value })}
                  placeholder="Fabric consumed in meters"
                />
              </div>
            </div>
          </div>

          {/* Process Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Process Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Calendaring Date</Label>
                <Input
                  type="date"
                  value={
                    formData.calendaringDate
                      ? new Date(formData.calendaringDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      calendaringDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Calendaring Station</Label>
                <Input
                  value={formData.calendaringStation || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, calendaringStation: e.target.value })
                  }
                  placeholder="Calendaring station"
                />
              </div>
              <div>
                <Label>Green Belt Date</Label>
                <Input
                  type="date"
                  value={
                    formData.greenBeltDate
                      ? new Date(formData.greenBeltDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      greenBeltDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Green Belt Station</Label>
                <Input
                  value={formData.greenBeltStation || ''}
                  onChange={(e) => setFormData({ ...formData, greenBeltStation: e.target.value })}
                  placeholder="Green belt station"
                />
              </div>
              <div>
                <Label>Curing Date</Label>
                <Input
                  type="date"
                  value={
                    formData.curingDate
                      ? new Date(formData.curingDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      curingDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Press Station</Label>
                <Input
                  value={formData.pressStation || ''}
                  onChange={(e) => setFormData({ ...formData, pressStation: e.target.value })}
                  placeholder="Press station"
                />
              </div>
              <div>
                <Label>Inspection Date</Label>
                <Input
                  type="date"
                  value={
                    formData.inspectionDate
                      ? new Date(formData.inspectionDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inspectionDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Inspection Station</Label>
                <Input
                  value={formData.inspectionStation || ''}
                  onChange={(e) => setFormData({ ...formData, inspectionStation: e.target.value })}
                  placeholder="Inspection station"
                />
              </div>
              <div>
                <Label>PDI Date</Label>
                <Input
                  type="date"
                  value={
                    formData.pdiDate ? new Date(formData.pdiDate).toISOString().split('T')[0] : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pdiDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Packaging Date</Label>
                <Input
                  type="date"
                  value={
                    formData.packagingDate
                      ? new Date(formData.packagingDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packagingDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Dispatch Date</Label>
                <Input
                  type="date"
                  value={
                    formData.dispatchDate
                      ? new Date(formData.dispatchDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dispatchDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Cover Compound Produced On</Label>
                <Input
                  type="date"
                  value={
                    formData.coverCompoundProducedOn
                      ? new Date(formData.coverCompoundProducedOn).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coverCompoundProducedOn: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Skim Compound Produced On</Label>
                <Input
                  type="date"
                  value={
                    formData.skimCompoundProducedOn
                      ? new Date(formData.skimCompoundProducedOn).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skimCompoundProducedOn: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Belt'}
          </Button>
        </div>
      </div>
    </>
  );
}

export default function EditBeltDialog({ open, onOpenChange, belt }: EditBeltDialogProps) {
  // Get belt ID as string for key and mutation
  const beltId = useMemo(() => {
    if (!belt._id) return '';
    return typeof belt._id === 'string' ? belt._id : String(belt._id);
  }, [belt._id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <EditBeltFormContent
          key={beltId}
          belt={belt}
          beltId={beltId}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
