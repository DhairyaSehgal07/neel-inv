'use client';

import { useState, useMemo } from 'react';
import { RawMaterialDoc } from '@/model/RawMaterial';
import { useUpdateRawMaterialMutation } from '@/services/api/queries/raw-materials/clientRawMaterials';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';

interface EditRawMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawMaterial: RawMaterialDoc;
}

// Helper function to parse a date string (YYYY-MM-DD) as a local date (not UTC)
function parseLocalDate(dateStr: string | Date | null | undefined): Date | undefined {
  if (dateStr instanceof Date) {
    // Validate the Date object
    return isNaN(dateStr.getTime()) ? undefined : dateStr;
  }
  if (!dateStr) return undefined;
  
  if (typeof dateStr !== 'string') {
    // Try to convert to string if it's not already
    try {
      dateStr = String(dateStr);
    } catch {
      return undefined;
    }
  }

  const trimmed = dateStr.trim();
  if (!trimmed) return undefined;

  try {
    // Check if it's in YYYY-MM-DD format (primary format from database)
    const yyyyMMddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const yyyyMMddMatch = trimmed.match(yyyyMMddRegex);
    
    if (yyyyMMddMatch) {
      const year = parseInt(yyyyMMddMatch[1], 10);
      const month = parseInt(yyyyMMddMatch[2], 10);
      const day = parseInt(yyyyMMddMatch[3], 10);

      // Validate the numbers
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return undefined;
      }

      // Validate reasonable date ranges
      if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
        return undefined;
      }

      // Create date in local timezone (month is 0-indexed in Date constructor)
      const date = new Date(year, month - 1, day);

      // Validate the created date (check if it's a valid date)
      if (isNaN(date.getTime())) {
        return undefined;
      }

      // Double-check that the date components match (handles invalid dates like Feb 30)
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return undefined;
      }

      return date;
    }

    // Try DD/MM/YYYY or DD.MM.YYYY format (display format)
    const ddmmyyyyRegex = /^(\d{2})[./](\d{2})[./](\d{4})$/;
    const ddmmyyyyMatch = trimmed.match(ddmmyyyyRegex);
    
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10);
      const year = parseInt(ddmmyyyyMatch[3], 10);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && 
            date.getFullYear() === year && 
            date.getMonth() === month - 1 && 
            date.getDate() === day) {
          return date;
        }
      }
    }

    // Fallback: try to parse as ISO date string
    const isoDate = new Date(trimmed);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function EditRawMaterialFormContent({
  rawMaterial,
  rawMaterialId,
  onClose,
}: {
  rawMaterial: RawMaterialDoc;
  rawMaterialId: string;
  onClose: () => void;
}) {
  const updateMutation = useUpdateRawMaterialMutation();

  // Use function initializer to ensure we get the latest values when component remounts
  const [materialCode, setMaterialCode] = useState(() => rawMaterial.materialCode || '');
  const [date, setDate] = useState<Date | undefined>(() => parseLocalDate(rawMaterial.date));
  const [rawMaterialName, setRawMaterialName] = useState(() => rawMaterial.rawMaterial || '');

  const handleSubmit = async () => {
    if (!materialCode.trim()) {
      toast.error('Please enter a material code');
      return;
    }

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    if (!rawMaterialName.trim()) {
      toast.error('Please enter a raw material');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: rawMaterialId,
        payload: {
          materialCode: materialCode.trim(),
          date,
          rawMaterial: rawMaterialName.trim(),
        },
      });

      toast.success('Raw material updated successfully');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(`Failed to update raw material: ${errorMessage}`);
    }
  };

  const isLoading = updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="edit-material-code">Material Code *</Label>
        <Input
          id="edit-material-code"
          value={materialCode}
          onChange={(e) => setMaterialCode(e.target.value)}
          placeholder="Enter material code"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="edit-date">Date *</Label>
        <DatePicker
          id="edit-date"
          date={date}
          onDateChange={setDate}
          placeholder="Select a date"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="edit-raw-material">Raw Material *</Label>
        <Input
          id="edit-raw-material"
          value={rawMaterialName}
          onChange={(e) => setRawMaterialName(e.target.value)}
          placeholder="Enter raw material name"
          disabled={isLoading}
        />
      </div>

      <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
        {isLoading ? 'Updating...' : 'Update Raw Material'}
      </Button>
    </div>
  );
}

export default function EditRawMaterialDialog({
  open,
  onOpenChange,
  rawMaterial,
}: EditRawMaterialDialogProps) {
  // Get raw material ID as string for key and mutation
  const rawMaterialId = useMemo(() => {
    if (!rawMaterial._id) return '';
    return typeof rawMaterial._id === 'string' ? rawMaterial._id : String(rawMaterial._id);
  }, [rawMaterial._id]);

  // Create a unique key that includes the date to force remount when switching items
  const componentKey = useMemo(() => {
    return `${rawMaterialId}-${rawMaterial.date || ''}`;
  }, [rawMaterialId, rawMaterial.date]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Raw Material</DialogTitle>
        </DialogHeader>

        {open && (
          <EditRawMaterialFormContent
            key={componentKey}
            rawMaterial={rawMaterial}
            rawMaterialId={rawMaterialId}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
