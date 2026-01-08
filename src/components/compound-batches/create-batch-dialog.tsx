'use client';

import { useState } from 'react';
import { useCreateCompoundBatchMutation } from '@/services/api/queries/compounds/clientCompoundBatches';
import { useCompoundMastersQuery } from '@/services/api/queries/compounds/clientCompoundMasters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import SearchSelect from '@/components/search-select';

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateBatchDialog({ open, onOpenChange }: CreateBatchDialogProps) {
  const createMutation = useCreateCompoundBatchMutation();
  const { data: compoundMasters } = useCompoundMastersQuery();

  // Initialize form state
  const [formData, setFormData] = useState({
    compoundCode: '',
    compoundName: '',
    batches: '',
    weightPerBatch: '',
    coverCompoundProducedOn: '',
    skimCompoundProducedOn: '',
  });

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        compoundCode: '',
        compoundName: '',
        batches: '',
        weightPerBatch: '',
        coverCompoundProducedOn: '',
        skimCompoundProducedOn: '',
      });
    }
    onOpenChange(newOpen);
  };

  // Handle compound code change and auto-fill related fields
  const handleCompoundCodeChange = (value: string) => {
    let compoundName = '';
    let weightPerBatch = '';

    if (value && compoundMasters) {
      const master = compoundMasters.find((m) => m.compoundCode === value);
      if (master) {
        compoundName = master.compoundName;
        weightPerBatch = master.defaultWeightPerBatch.toString();
      }
    }

    setFormData((prev) => ({
      ...prev,
      compoundCode: value,
      compoundName,
      weightPerBatch,
    }));
  };

  // Prepare compound options for dropdown
  const compoundOptions =
    compoundMasters?.map((master) => ({
      label: `${master.compoundName} (${master.compoundCode})`,
      value: master.compoundCode,
    })) || [];

  const handleSubmit = async () => {
    if (!formData.compoundCode?.trim()) {
      toast.error('Please select a compound');
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

    // Validate production dates if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (formData.coverCompoundProducedOn && !dateRegex.test(formData.coverCompoundProducedOn)) {
      toast.error('Cover compound produced on date must be in YYYY-MM-DD format');
      return;
    }

    if (formData.skimCompoundProducedOn && !dateRegex.test(formData.skimCompoundProducedOn)) {
      toast.error('Skim compound produced on date must be in YYYY-MM-DD format');
      return;
    }

    // Auto-generate date as today's date in YYYY-MM-DD format
    const today = new Date();
    const date = today.toISOString().split('T')[0];

    try {
      await createMutation.mutateAsync({
        compoundCode: formData.compoundCode,
        compoundName: formData.compoundName || undefined,
        date,
        batches,
        weightPerBatch,
        coverCompoundProducedOn: formData.coverCompoundProducedOn || undefined,
        skimCompoundProducedOn: formData.skimCompoundProducedOn || undefined,
      });

      toast.success('Compound batch created successfully');
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to create compound batch: ${errorMessage}`);
    }
  };

  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Create New Compound Batch</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
          <div>
            <Label>Compound Code *</Label>
            <SearchSelect
              options={compoundOptions}
              value={formData.compoundCode}
              onChange={handleCompoundCodeChange}
              placeholder="Select a compound"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Select the compound master to use for this batch
            </p>
          </div>

          <div>
            <Label>Compound Name</Label>
            <Input
              value={formData.compoundName}
              onChange={(e) => setFormData({ ...formData, compoundName: e.target.value })}
              placeholder="Auto-filled from compound master"
              className="mt-1"
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-filled from selected compound master
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
              Typically 90 kg for most compounds, 120 kg for Nk-8, Nk-9, Nk-10. Auto-filled from compound master.
            </p>
          </div>

          <div>
            <Label>Cover Compound Produced On (YYYY-MM-DD) (Optional)</Label>
            <Input
              type="date"
              value={formData.coverCompoundProducedOn}
              onChange={(e) => setFormData({ ...formData, coverCompoundProducedOn: e.target.value })}
              placeholder="YYYY-MM-DD"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Date when this compound was produced for cover use
            </p>
          </div>

          <div>
            <Label>Skim Compound Produced On (YYYY-MM-DD) (Optional)</Label>
            <Input
              type="date"
              value={formData.skimCompoundProducedOn}
              onChange={(e) => setFormData({ ...formData, skimCompoundProducedOn: e.target.value })}
              placeholder="YYYY-MM-DD"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Date when this compound was produced for skim use
            </p>
          </div>

          <div className="p-3 bg-muted rounded-md space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Inventory:</span>
              <span className="font-medium">
                {formData.batches && formData.weightPerBatch
                  ? (parseFloat(formData.batches) * parseFloat(formData.weightPerBatch)).toFixed(2)
                  : '0.00'}{' '}
                kg
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              Total inventory is calculated as: batches × weight per batch
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Batch'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
