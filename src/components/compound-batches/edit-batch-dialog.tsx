'use client';

import { useState, useEffect } from 'react';
import { CompoundBatchDoc } from '@/model/CompoundBatch';
import { useUpdateCompoundBatchMutation } from '@/services/api/queries/compounds/clientCompoundBatches';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface EditBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch?: CompoundBatchDoc;
}

export default function EditBatchDialog({ open, onOpenChange, batch }: EditBatchDialogProps) {
  const updateMutation = useUpdateCompoundBatchMutation();

  // Initialize form state from batch prop
  const [formData, setFormData] = useState({
    compoundCode: batch?.compoundCode || '',
    compoundName: batch?.compoundName || '',
    date: batch?.date || '',
    batches: batch?.batches?.toString() || '',
    weightPerBatch: batch?.weightPerBatch?.toString() || '',
  });

  // Reset form when batch changes
  useEffect(() => {
    if (open && batch) {
      setFormData({
        compoundCode: batch.compoundCode || '',
        compoundName: batch.compoundName || '',
        date: batch.date || '',
        batches: batch.batches?.toString() || '',
        weightPerBatch: batch.weightPerBatch?.toString() || '',
      });
    }
  }, [open, batch]);

  const handleSubmit = async () => {
    if (!formData.compoundCode?.trim()) {
      toast.error('Please enter a compound code');
      return;
    }

    if (!formData.date?.trim()) {
      toast.error('Please enter a date');
      return;
    }

    const batches = parseFloat(formData.batches);
    if (isNaN(batches) || batches <= 0) {
      toast.error('Please enter a valid number of batches (must be greater than 0)');
      return;
    }

    const weightPerBatch = parseFloat(formData.weightPerBatch);
    if (isNaN(weightPerBatch) || weightPerBatch <= 0) {
      toast.error('Please enter a valid weight per batch (must be greater than 0)');
      return;
    }

    if (!batch) {
      toast.error('Batch not found');
      return;
    }

    try {
      let batchId: string;
      if (typeof batch._id === 'string') {
        batchId = batch._id;
      } else if (batch._id && typeof batch._id === 'object' && 'toString' in batch._id) {
        batchId = batch._id.toString();
      } else {
        throw new Error('Invalid batch ID');
      }
      await updateMutation.mutateAsync({
        id: batchId,
        payload: {
          compoundCode: formData.compoundCode,
          compoundName: formData.compoundName,
          date: formData.date,
          batches,
          weightPerBatch,
        },
      });
      toast.success('Compound batch updated successfully');
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to update compound batch: ${errorMessage}`);
    }
  };

  const isLoading = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Compound Batch</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Compound Code *</Label>
            <Input
              value={formData.compoundCode}
              onChange={(e) => setFormData({ ...formData, compoundCode: e.target.value })}
              placeholder="e.g., nk1, nk8"
            />
          </div>

          <div>
            <Label>Compound Name</Label>
            <Input
              value={formData.compoundName}
              onChange={(e) => setFormData({ ...formData, compoundName: e.target.value })}
              placeholder="e.g., Nk-5, Nk-8"
            />
          </div>

          <div>
            <Label>Date (YYYY-MM-DD) *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="YYYY-MM-DD"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Note: Date must be unique across all batches
            </p>
          </div>

          <div>
            <Label>Number of Batches *</Label>
            <Input
              type="number"
              value={formData.batches}
              onChange={(e) => setFormData({ ...formData, batches: e.target.value })}
              placeholder="80-90"
              min="1"
              step="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Typically between 80-90 batches
            </p>
          </div>

          <div>
            <Label>Weight Per Batch (kg) *</Label>
            <Input
              type="number"
              value={formData.weightPerBatch}
              onChange={(e) => setFormData({ ...formData, weightPerBatch: e.target.value })}
              placeholder="90 or 120"
              min="1"
              step="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Typically 90 kg for most compounds, 120 kg for Nk-8, Nk-9, Nk-10
            </p>
          </div>

          {batch && (
            <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Total Inventory:</span>
                <span className="font-medium">{batch.totalInventory} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Remaining:</span>
                <span className="font-medium">{batch.inventoryRemaining} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Consumed:</span>
                <span className="font-medium">{batch.consumed} kg</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Changing batches or weight per batch will recalculate total inventory and adjust remaining inventory proportionally.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Batch'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
