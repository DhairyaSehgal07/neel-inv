// src/components/compound-types/edit-dialog.tsx

'use client';

import { useState } from 'react';
import { CompoundType, createCompoundType, updateCompoundType } from '@/lib/api/compound-type';
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

export default function EditCompoundDialog({
  open,
  onOpenChange,
  compound,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compound?: CompoundType;
}) {
  // Use key on DialogContent to reset state when compound changes
  // This avoids setState in useEffect which triggers linter warnings
  const dialogKey = compound?._id || (open ? 'new' : 'closed');

  const [name, setName] = useState(compound?.name ?? '');
  const [type, setType] = useState<'skim' | 'cover'>(compound?.type ?? 'skim');
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(compound);

  const handleTypeChange = (value: string) => {
    if (value === 'skim' || value === 'cover') {
      setType(value);
    }
  };

  async function handleSubmit() {
    setLoading(true);

    try {
      if (isEdit && compound) {
        await updateCompoundType(compound._id, { name, type });
      } else {
        await createCompoundType({ name, type, isActive: true });
      }

      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Compound' : 'Create Compound'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skim">Skim</SelectItem>
                <SelectItem value="cover">Cover</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button disabled={loading} onClick={handleSubmit}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
