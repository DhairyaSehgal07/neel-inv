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
function parseLocalDate(dateStr: string | Date): Date | undefined {
  if (dateStr instanceof Date) {
    return dateStr;
  }
  if (!dateStr) return undefined;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed in Date constructor)
    return new Date(year, month - 1, day);
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

  const [materialCode, setMaterialCode] = useState(rawMaterial.materialCode || '');
  const [date, setDate] = useState<Date | undefined>(parseLocalDate(rawMaterial.date));
  const [rawMaterialName, setRawMaterialName] = useState(rawMaterial.rawMaterial || '');

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Raw Material</DialogTitle>
        </DialogHeader>

        <EditRawMaterialFormContent
          key={rawMaterialId}
          rawMaterial={rawMaterial}
          rawMaterialId={rawMaterialId}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
