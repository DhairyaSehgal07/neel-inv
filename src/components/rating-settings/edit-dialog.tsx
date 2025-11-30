// src/components/rating-settings/edit-dialog.tsx

'use client';

import { useState } from 'react';
import { Rating } from '@/types/rating';
import {
  useCreateRatingMutation,
  useUpdateRatingMutation,
} from '@/services/api/queries/ratings/clientRatings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EditRatingDialog({
  open,
  onOpenChange,
  rating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating?: Rating;
}) {
  // Use key on Dialog to reset state when rating changes
  // The key forces a remount, which resets the state naturally
  const dialogKey = rating?._id || (open ? 'new' : 'closed');

  // Initialize state from rating prop - key prop ensures remount on change
  const [ratingValue, setRatingValue] = useState(() => rating?.rating ?? '');
  const [strength, setStrength] = useState(() => rating?.strength?.toString() ?? '');

  const isEdit = Boolean(rating);

  const createMutation = useCreateRatingMutation();
  const updateMutation = useUpdateRatingMutation();

  async function handleSubmit() {
    if (!ratingValue.trim()) {
      toast.error('Please enter a rating');
      return;
    }

    const strengthNum = parseFloat(strength);
    if (isNaN(strengthNum) || strengthNum <= 0) {
      toast.error('Please enter a valid strength (must be a positive number)');
      return;
    }

    try {
      if (isEdit && rating) {
        await updateMutation.mutateAsync({
          id: rating._id,
          payload: {
            rating: ratingValue,
            strength: strengthNum,
          },
        });
        toast.success('Rating updated successfully');
      } else {
        await createMutation.mutateAsync({
          rating: ratingValue,
          strength: strengthNum,
        });
        toast.success('Rating created successfully');
      }

      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} rating: ${errorMessage}`);
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Rating' : 'Create Rating'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Rating *</Label>
            <Input
              value={ratingValue}
              onChange={(e) => setRatingValue(e.target.value)}
              placeholder="e.g., 200/2, 315/3"
              disabled={isEdit} // Rating should not be editable
            />
            {isEdit && <p className="text-xs text-muted-foreground mt-1">Rating cannot be changed</p>}
          </div>

          <div>
            <Label>Strength *</Label>
            <Input
              type="number"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder="e.g., 100, 125, 150"
              min="1"
              step="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Belt strength value (e.g., 100, 125, 150, 200, etc.)
            </p>
          </div>

          <Button disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
