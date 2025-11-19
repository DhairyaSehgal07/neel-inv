// src/components/compound-types/delete-dialog.tsx

'use client';

import { deleteCompoundType, CompoundType } from '@/lib/api/compound-type';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function DeleteCompoundDialog({
  open,
  onOpenChange,
  compound,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compound: CompoundType;
}) {
  async function handleDelete() {
    await deleteCompoundType(compound._id);
    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Compound</DialogTitle>
        </DialogHeader>

        <p className="mb-4">Are you sure you want to delete “{compound.name}”?</p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
