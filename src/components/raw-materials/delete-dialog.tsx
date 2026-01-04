'use client';

import { RawMaterialDoc } from '@/model/RawMaterial';
import { useDeleteRawMaterialMutation } from '@/services/api/queries/raw-materials/clientRawMaterials';
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
import { useMemo } from 'react';

interface DeleteRawMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawMaterial: RawMaterialDoc;
}

export default function DeleteRawMaterialDialog({
  open,
  onOpenChange,
  rawMaterial,
}: DeleteRawMaterialDialogProps) {
  const deleteMutation = useDeleteRawMaterialMutation();

  // Get raw material ID as string
  const rawMaterialId = useMemo(() => {
    if (!rawMaterial._id) return '';
    return typeof rawMaterial._id === 'string' ? rawMaterial._id : String(rawMaterial._id);
  }, [rawMaterial._id]);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(rawMaterialId);
      toast.success('Raw material deleted successfully');
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(`Failed to delete raw material: ${errorMessage}`);
    }
  };

  const isLoading = deleteMutation.isPending;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the raw material with code{' '}
            <strong>{rawMaterial.materialCode}</strong> dated <strong>{rawMaterial.date}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
