'use client';

import { useState, useEffect } from 'react';
import { CompoundBatchDoc } from '@/model/CompoundBatch';
import { useUpdateCompoundBatchMutation } from '@/services/api/queries/compounds/clientCompoundBatches';
import { useCompoundMastersQuery } from '@/services/api/queries/compounds/clientCompoundMasters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MaterialRowsFields, MaterialRow } from './material-rows-fields';

interface EditBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch?: CompoundBatchDoc;
}

function initialMaterialRows(
  batch: CompoundBatchDoc | undefined,
  compoundMasters: { compoundCode: string; rawMaterials: string[] }[] | undefined
): MaterialRow[] {
  if (!batch) {
    return [{ materialName: '', materialCode: '' }];
  }
  if (batch.materialsUsed && batch.materialsUsed.length > 0) {
    return batch.materialsUsed.map((m) => ({
      materialName: m.materialName,
      materialCode: m.materialCode,
    }));
  }
  const master = compoundMasters?.find((m) => m.compoundCode === batch.compoundCode);
  if (master?.rawMaterials?.length) {
    return master.rawMaterials.map((name) => ({ materialName: name, materialCode: '' }));
  }
  return [{ materialName: '', materialCode: '' }];
}

export default function EditBatchDialog({ open, onOpenChange, batch }: EditBatchDialogProps) {
  const updateMutation = useUpdateCompoundBatchMutation();
  const { data: compoundMasters } = useCompoundMastersQuery();

  const [formData, setFormData] = useState({
    compoundCode: batch?.compoundCode || '',
    compoundName: batch?.compoundName || '',
    date: batch?.date || '',
    batches: batch?.batches?.toString() || '',
    weightPerBatch: batch?.weightPerBatch?.toString() || '',
    reducedQty: '',
    materialRows: [{ materialName: '', materialCode: '' }] as MaterialRow[],
  });

  useEffect(() => {
    if (open && batch) {
      setFormData({
        compoundCode: batch.compoundCode || '',
        compoundName: batch.compoundName || '',
        date: batch.date || '',
        batches: batch.batches?.toString() || '',
        weightPerBatch: batch.weightPerBatch?.toString() || '',
        reducedQty: '',
        materialRows: initialMaterialRows(batch, compoundMasters),
      });
    }
  }, [open, batch, compoundMasters]);

  const handleSubmit = async () => {
    if (!formData.compoundCode?.trim()) {
      toast.error('Please enter a compound code');
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

    let reducedQty: number | undefined;
    if (formData.reducedQty?.trim()) {
      reducedQty = parseFloat(formData.reducedQty);
      if (isNaN(reducedQty) || reducedQty < 0) {
        toast.error('Reduced quantity must be a non-negative number');
        return;
      }
      if (reducedQty > (batch.inventoryRemaining || 0)) {
        toast.error('Reduced quantity cannot exceed remaining inventory');
        return;
      }
    }

    for (const r of formData.materialRows) {
      const n = r.materialName.trim();
      const c = r.materialCode.trim();
      if ((n && !c) || (!n && c)) {
        toast.error('For each raw material row, fill both name and code, or leave both empty.');
        return;
      }
    }

    const materialsUsed = formData.materialRows
      .map((r) => ({
        materialName: r.materialName.trim(),
        materialCode: r.materialCode.trim(),
      }))
      .filter((r) => r.materialName && r.materialCode);

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
          batches,
          weightPerBatch,
          ...(reducedQty !== undefined && { reducedQty }),
          materialsUsed: materialsUsed.length > 0 ? materialsUsed : [],
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
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Compound Batch</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
          <div>
            <Label>Compound Code *</Label>
            <Input
              value={formData.compoundCode}
              onChange={(e) => setFormData({ ...formData, compoundCode: e.target.value })}
              placeholder="e.g., nk1, nk8"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Compound Name</Label>
            <Input
              value={formData.compoundName}
              onChange={(e) => setFormData({ ...formData, compoundName: e.target.value })}
              placeholder="e.g., Nk-5, Nk-8"
              className="mt-1"
            />
          </div>

          <MaterialRowsFields
            rows={formData.materialRows}
            onChange={(materialRows) => setFormData((prev) => ({ ...prev, materialRows }))}
            disabled={isLoading}
          />

          <div>
            <Label>Date (YYYY-MM-DD) *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="YYYY-MM-DD"
              className="mt-1"
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
              className="mt-1"
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
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Typically 90 kg for most compounds, 120 kg for Nk-8, Nk-9, Nk-10
            </p>
          </div>

          {batch && (
            <div>
              <Label>Reduce Remaining Inventory (kg) (Optional)</Label>
              <Input
                type="number"
                value={formData.reducedQty}
                onChange={(e) => setFormData({ ...formData, reducedQty: e.target.value })}
                placeholder="Enter quantity to reduce"
                min="0"
                step="0.01"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the quantity (in kg) to reduce from remaining inventory. The number of batches will be automatically reduced based on: (reduced qty / batch weight)
              </p>
              {formData.reducedQty && !isNaN(parseFloat(formData.reducedQty)) && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                  Batches will be reduced by: {((parseFloat(formData.reducedQty) || 0) / (parseFloat(formData.weightPerBatch) || 1)).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {batch && (
            <div className="p-3 bg-muted rounded-md space-y-1.5 text-sm">
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
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                Note: Changing batches or weight per batch will recalculate total inventory and adjust remaining inventory proportionally.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Batch'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
