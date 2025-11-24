'use client';

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
import { CompoundBatchDoc } from '@/model/CompoundBatch';
import { useDeleteCompoundBatchMutation } from '@/services/api/queries/compounds/clientCompoundBatches';

export default function DeleteBatchDialog({
  open,
  onOpenChange,
  batch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: CompoundBatchDoc;
}) {
  const deleteMutation = useDeleteCompoundBatchMutation();

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(batch._id.toString());
      toast.success('Compound batch deleted successfully');
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete compound batch';
      toast.error(`Failed to delete compound batch: ${errorMessage}`);
    }
  }

  const batchIdentifier = `${batch.compoundCode}-${batch.date?.replace(/-/g, '') || ''}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Compound Batch</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete batch &quot;{batchIdentifier}&quot; ({batch.compoundName})? This action will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Return all consumed stock back to this batch</li>
              <li>Find all belts that used this batch</li>
              <li>Recalculate those belts using FIFO from other batches</li>
              <li>Permanently delete this batch record</li>
            </ul>
            {batch.consumed > 0 && (
              <span className="font-semibold text-destructive mt-2 block">
                Warning: This batch has {batch.consumed} kg consumed. All affected belts will be recalculated.
              </span>
            )}
            <span className="font-semibold text-destructive mt-2 block">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
