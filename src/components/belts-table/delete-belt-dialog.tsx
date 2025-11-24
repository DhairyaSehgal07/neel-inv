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
import { BeltDoc } from '@/model/Belt';
import { FabricInfo } from '@/types/belt';
import { useDeleteBeltMutation } from '@/services/api/queries/belts/clientBelts';

export default function DeleteBeltDialog({
  open,
  onOpenChange,
  belt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  belt: BeltDoc & { fabric?: FabricInfo };
}) {
  const deleteMutation = useDeleteBeltMutation();

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(belt._id.toString());
      toast.success('Belt deleted successfully');
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete belt';
      toast.error(`Failed to delete belt: ${errorMessage}`);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Belt</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete belt &quot;{belt.beltNumber}&quot;? This action will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Return all consumed compound stock back to batches</li>
              <li>Recalculate all subsequent belts that used the same compounds</li>
              <li>Permanently delete this belt record</li>
            </ul>
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
