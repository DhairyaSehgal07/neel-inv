// src/components/rating-settings/delete-dialog.tsx

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
import { Rating } from '@/types/rating';
import { useDeleteRatingMutation } from '@/services/api/queries/ratings/clientRatings';

export default function DeleteRatingDialog({
  open,
  onOpenChange,
  rating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating: Rating;
}) {
  const deleteMutation = useDeleteRatingMutation();

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(rating._id);
      toast.success('Rating deleted successfully');
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to delete rating: ${errorMessage}`);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Rating</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{rating.rating}&quot; (Strength: {rating.strength})? This
            action cannot be undone.
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
