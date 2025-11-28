'use client';

import { useState, useMemo, useRef } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { BeltFormData } from '@/types/belt';
import { FabricInfo } from '@/types/belt';
import { process_dates_from_dispatch } from '@/lib/helpers/calculations';
import { DatePicker } from '@/components/ui/date-picker';

interface EditBeltDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  belt: BeltDoc & { fabric?: FabricInfo };
}

// Helper function to parse a date string (YYYY-MM-DD) as a local date (not UTC)
// This prevents timezone shifts when parsing date-only strings
function parseLocalDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    return dateStr;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date in local timezone (month is 0-indexed in Date constructor)
  return new Date(year, month - 1, day);
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
    orderDate: belt.orderDate ? parseLocalDate(belt.orderDate) : undefined,
    deliveryDeadline: belt.deliveryDeadline ? parseLocalDate(belt.deliveryDeadline) : undefined,
    status: belt.status || 'In Production',
    fabricSupplier: belt.fabric?.supplier || '',
    rollNumber: belt.fabric?.rollNumber || '',
    fabricConsumed: belt.fabric?.consumedMeters?.toString() || '',
    calendaringDate: belt.process?.calendaringDate ? parseLocalDate(belt.process.calendaringDate) : undefined,
    calendaringStation: belt.process?.calendaringMachine || '',
    greenBeltDate: belt.process?.greenBeltDate ? parseLocalDate(belt.process.greenBeltDate) : undefined,
    greenBeltStation: belt.process?.greenBeltMachine || '',
    curingDate: belt.process?.curingDate ? parseLocalDate(belt.process.curingDate) : undefined,
    pressStation: belt.process?.curingMachine || '',
    inspectionDate: belt.process?.inspectionDate ? parseLocalDate(belt.process.inspectionDate) : undefined,
    inspectionStation: belt.process?.inspectionMachine || '',
    pdiDate: belt.process?.pidDate ? parseLocalDate(belt.process.pidDate) : undefined,
    packagingDate: belt.process?.packagingDate ? parseLocalDate(belt.process.packagingDate) : undefined,
    dispatchDate: belt.process?.dispatchDate ? parseLocalDate(belt.process.dispatchDate) : undefined,
    coverCompoundProducedOn: belt.process?.coverCompoundProducedOn ? parseLocalDate(belt.process.coverCompoundProducedOn) : undefined,
    skimCompoundProducedOn: belt.process?.skimCompoundProducedOn ? parseLocalDate(belt.process.skimCompoundProducedOn) : undefined,
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
  const [hasManualDateEdit, setHasManualDateEdit] = useState(false);
  const [datesAdjusted, setDatesAdjusted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const manuallyEditedRef = useRef<Set<string>>(new Set());
  const initialFormDataRef = useRef<Partial<BeltFormData>>(initializeFormData(belt));

  // Helper function to convert Date to YYYY-MM-DD using local timezone (not UTC)
  const toLocalDateString = (date: Date | string): string => {
    if (typeof date === 'string') return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle date adjustment based on dispatch date
  const handleAdjustDates = () => {
    if (!formData.dispatchDate) {
      toast.error('Please set a dispatch date first');
      return;
    }

    const dispatchDateIso = formData.dispatchDate instanceof Date
      ? toLocalDateString(formData.dispatchDate)
      : formData.dispatchDate;

    const dates = process_dates_from_dispatch(dispatchDateIso);

    if ('packaging_date' in dates) {
      setFormData((prev) => ({
        ...prev,
        packagingDate: dates.packaging_date ? parseLocalDate(dates.packaging_date) : prev.packagingDate,
        pdiDate: dates.pdi_date ? parseLocalDate(dates.pdi_date) : prev.pdiDate,
        inspectionDate: dates.internal_inspection_date ? parseLocalDate(dates.internal_inspection_date) : prev.inspectionDate,
        curingDate: dates.curing_date ? parseLocalDate(dates.curing_date) : prev.curingDate,
        greenBeltDate: dates.green_belt_date ? parseLocalDate(dates.green_belt_date) : prev.greenBeltDate,
        calendaringDate: dates.calendaring_date ? parseLocalDate(dates.calendaring_date) : prev.calendaringDate,
        coverCompoundProducedOn: dates.cover_compound_date ? parseLocalDate(dates.cover_compound_date) : prev.coverCompoundProducedOn,
        skimCompoundProducedOn: dates.skim_compound_date ? parseLocalDate(dates.skim_compound_date) : prev.skimCompoundProducedOn,
      }));
      setDatesAdjusted(true);
      setHasManualDateEdit(false);
      manuallyEditedRef.current.clear();
      toast.success('Dates adjusted successfully');
    }
  };

  // Handle date field change
  const handleDateChange = (fieldName: keyof BeltFormData, date: Date | undefined) => {
    manuallyEditedRef.current.add(fieldName);
    const newFormData = {
      ...formData,
      [fieldName]: date,
    };
    setFormData(newFormData);

    // Check for manual edits with the new form data
    const dateFields: (keyof BeltFormData)[] = [
      'dispatchDate',
      'packagingDate',
      'pdiDate',
      'inspectionDate',
      'curingDate',
      'greenBeltDate',
      'calendaringDate',
      'coverCompoundProducedOn',
      'skimCompoundProducedOn',
    ];

    const hasEdit = dateFields.some((field) => {
      const currentValue = newFormData[field];
      const initialValue = initialFormDataRef.current[field];

      if (!currentValue && !initialValue) return false;
      if (!currentValue || !initialValue) return true;

      const currentStr = currentValue instanceof Date
        ? toLocalDateString(currentValue)
        : String(currentValue);
      const initialStr = initialValue instanceof Date
        ? toLocalDateString(initialValue)
        : String(initialValue);

      return currentStr !== initialStr;
    });

    setHasManualDateEdit(hasEdit);
  };

  const handleSubmit = async () => {
    if (!formData.beltNumber?.trim()) {
      toast.error('Please enter a belt number');
      return;
    }

    if (!beltId) {
      toast.error('Invalid belt ID');
      return;
    }

    // Check if dates were manually edited but not adjusted
    if (hasManualDateEdit && !datesAdjusted) {
      setShowConfirmDialog(true);
      return;
    }

    await performSubmit();
  };

  const performSubmit = async () => {
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
                <DatePicker
                  date={formData.orderDate}
                  onDateChange={(date) =>
                    setFormData({
                      ...formData,
                      orderDate: date,
                    })
                  }
                  placeholder="Select order date"
                />
              </div>
              <div>
                <Label>Delivery Deadline</Label>
                <DatePicker
                  date={formData.deliveryDeadline}
                  onDateChange={(date) =>
                    setFormData({
                      ...formData,
                      deliveryDeadline: date,
                    })
                  }
                  placeholder="Select delivery deadline"
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Process Dates</h3>
              {hasManualDateEdit && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAdjustDates}
                  disabled={isLoading || !formData.dispatchDate}
                >
                  Adjust Dates
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Calendaring Date</Label>
                <DatePicker
                  date={formData.calendaringDate}
                  onDateChange={(date) => handleDateChange('calendaringDate', date)}
                  placeholder="Select calendaring date"
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
                <DatePicker
                  date={formData.greenBeltDate}
                  onDateChange={(date) => handleDateChange('greenBeltDate', date)}
                  placeholder="Select green belt date"
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
                <DatePicker
                  date={formData.curingDate}
                  onDateChange={(date) => handleDateChange('curingDate', date)}
                  placeholder="Select curing date"
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
                <DatePicker
                  date={formData.inspectionDate}
                  onDateChange={(date) => handleDateChange('inspectionDate', date)}
                  placeholder="Select inspection date"
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
                <DatePicker
                  date={formData.pdiDate}
                  onDateChange={(date) => handleDateChange('pdiDate', date)}
                  placeholder="Select PDI date"
                />
              </div>
              <div>
                <Label>Packaging Date</Label>
                <DatePicker
                  date={formData.packagingDate}
                  onDateChange={(date) => handleDateChange('packagingDate', date)}
                  placeholder="Select packaging date"
                />
              </div>
              <div>
                <Label>Dispatch Date</Label>
                <DatePicker
                  date={formData.dispatchDate}
                  onDateChange={(date) => handleDateChange('dispatchDate', date)}
                  placeholder="Select dispatch date"
                />
              </div>
              <div>
                <Label>Cover Compound Produced On</Label>
                <DatePicker
                  date={formData.coverCompoundProducedOn}
                  onDateChange={(date) => handleDateChange('coverCompoundProducedOn', date)}
                  placeholder="Select cover compound date"
                />
              </div>
              <div>
                <Label>Skim Compound Produced On</Label>
                <DatePicker
                  date={formData.skimCompoundProducedOn}
                  onDateChange={(date) => handleDateChange('skimCompoundProducedOn', date)}
                  placeholder="Select skim compound date"
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              You have adjusted dates but haven&apos;t clicked the &quot;Adjust Dates&quot; button.
              Are you sure you want to submit the form without adjusting the dates?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performSubmit}>Yes, Submit Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
