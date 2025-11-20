// src/components/compound-types/delete-dialog.tsx

'use client';

// import { CompoundMaster } from '@/lib/api/compound-master';
// import { useDeleteCompoundMaster } from '@/lib/api/hooks/useCompoundMasters';
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
import { CompoundMaster } from '@/types/compound-master';
import { useDeleteCompoundMasterMutation } from '@/services/api/queries/compounds/clientCompoundMasters';

export default function DeleteCompoundDialog({
  open,
  onOpenChange,
  compound,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compound: CompoundMaster;
}) {
      const deleteMutation = useDeleteCompoundMasterMutation();


  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(compound._id);
      toast.success('Compound master deleted successfully');
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to delete compound master: ${errorMessage}`);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Compound</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{compound.compoundName}&quot; (
            {compound.compoundCode})? This action cannot be undone.
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
