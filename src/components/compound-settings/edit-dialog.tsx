// src/components/compound-types/edit-dialog.tsx

'use client';

import { useState } from 'react';
import { CompoundMaster } from '@/types/compound-master';
import {
  useCreateCompoundMasterMutation,
  useUpdateCompoundMasterMutation,
} from '@/services/api/queries/compounds/clientCompoundMasters';
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
import { X, Plus } from 'lucide-react';

export default function EditCompoundDialog({
  open,
  onOpenChange,
  compound,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compound?: CompoundMaster;
}) {
  // Use key on Dialog to reset state when compound changes
  // The key forces a remount, which resets the state naturally
  const dialogKey = compound?._id || (open ? 'new' : 'closed');

  // Initialize state from compound prop - key prop ensures remount on change
  const [compoundCode, setCompoundCode] = useState(() => compound?.compoundCode ?? '');
  const [compoundName, setCompoundName] = useState(() => compound?.compoundName ?? '');
  const [category, setCategory] = useState<'skim' | 'cover'>(() => {
    const cat = compound?.category;
    return cat === 'skim' || cat === 'cover' ? cat : 'skim';
  });
  const [defaultWeightPerBatch, setDefaultWeightPerBatch] = useState(
    () => compound?.defaultWeightPerBatch?.toString() ?? '90'
  );
  const [rawMaterials, setRawMaterials] = useState<string[]>(
    () => compound?.rawMaterials || []
  );
  const [newMaterial, setNewMaterial] = useState('');

  const isEdit = Boolean(compound);

  const createMutation = useCreateCompoundMasterMutation();
  const updateMutation = useUpdateCompoundMasterMutation();

  const handleCategoryChange = (value: string) => {
    if (value === 'skim' || value === 'cover') {
      setCategory(value);
    }
  };

  const handleAddMaterial = () => {
    const trimmed = newMaterial.trim();
    if (!trimmed) {
      toast.error('Please enter a raw material name');
      return;
    }
    if (rawMaterials.includes(trimmed)) {
      toast.error('This raw material already exists');
      return;
    }
    setRawMaterials([...rawMaterials, trimmed]);
    setNewMaterial('');
  };

  const handleRemoveMaterial = (index: number) => {
    setRawMaterials(rawMaterials.filter((_, i) => i !== index));
  };

  const handleUpdateMaterial = (index: number, newValue: string) => {
    const trimmed = newValue.trim();
    if (!trimmed) {
      handleRemoveMaterial(index);
      return;
    }
    const updated = [...rawMaterials];
    updated[index] = trimmed;
    setRawMaterials(updated);
  };

  async function handleSubmit() {
    if (!compoundCode.trim()) {
      toast.error('Please enter a compound code');
      return;
    }

    if (!compoundName.trim()) {
      toast.error('Please enter a compound name');
      return;
    }

    const weight = parseFloat(defaultWeightPerBatch);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Please enter a valid weight per batch (must be a positive number)');
      return;
    }

    try {
      if (isEdit && compound) {
        await updateMutation.mutateAsync({
          id: compound._id,
          payload: {
            compoundCode,
            compoundName,
            category,
            defaultWeightPerBatch: weight,
            rawMaterials,
          },
        });
        toast.success('Compound master updated successfully');
      } else {
        await createMutation.mutateAsync({
          compoundCode,
          compoundName,
          category,
          defaultWeightPerBatch: weight,
          rawMaterials,
        });
        toast.success('Compound master created successfully');
      }

      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} compound master: ${errorMessage}`);
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Compound Master' : 'Create Compound Master'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Compound Code *</Label>
            <Input
              value={compoundCode}
              onChange={(e) => setCompoundCode(e.target.value)}
              placeholder="e.g., nk1, nk8"
              disabled={isEdit} // Code should not be editable
            />
            {isEdit && <p className="text-xs text-muted-foreground mt-1">Code cannot be changed</p>}
          </div>

          <div>
            <Label>Compound Name *</Label>
            <Input
              value={compoundName}
              onChange={(e) => setCompoundName(e.target.value)}
              placeholder="e.g., Nk-5, Nk-8"
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skim">Skim</SelectItem>
                <SelectItem value="cover">Cover</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Default Weight Per Batch (kg) *</Label>
            <Input
              type="number"
              value={defaultWeightPerBatch}
              onChange={(e) => setDefaultWeightPerBatch(e.target.value)}
              placeholder="90 or 120"
              min="1"
              step="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Typically 90 kg for most compounds, 120 kg for Nk-8, Nk-9, Nk-10
            </p>
          </div>

          <div>
            <Label>Raw Materials</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  placeholder="Enter raw material name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMaterial();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddMaterial}
                  disabled={!newMaterial.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {rawMaterials.length > 0 && (
                <div className="space-y-2 border rounded-md p-3">
                  {rawMaterials.map((material, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={material}
                        onChange={(e) => handleUpdateMaterial(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMaterial(index)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {rawMaterials.length === 0 && (
                <p className="text-xs text-muted-foreground">No raw materials added yet</p>
              )}
            </div>
          </div>

          <Button disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
