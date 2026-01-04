'use client';

import React, { useState } from 'react';
import { useRawMaterialsQuery, useCreateRawMaterialMutation } from '@/services/api/queries/raw-materials/clientRawMaterials';
import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';

const RawMaterialsPage = () => {
  const { data, isLoading, error } = useRawMaterialsQuery();
  const createMutation = useCreateRawMaterialMutation();

  const [openDialog, setOpenDialog] = useState(false);
  const [materialCode, setMaterialCode] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [rawMaterial, setRawMaterial] = useState('');

  const handleSubmit = async () => {
    if (!materialCode.trim()) {
      toast.error('Please enter a material code');
      return;
    }

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    if (!rawMaterial.trim()) {
      toast.error('Please enter a raw material');
      return;
    }

    try {
      await createMutation.mutateAsync({
        materialCode: materialCode.trim(),
        date,
        rawMaterial: rawMaterial.trim(),
      });

      toast.success('Raw material added successfully');

      // Reset form and close dialog
      setMaterialCode('');
      setDate(undefined);
      setRawMaterial('');
      setOpenDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(`Failed to add raw material: ${errorMessage}`);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open) {
      // Reset form when dialog closes
      setMaterialCode('');
      setDate(undefined);
      setRawMaterial('');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Raw Materials</h2>
          <Button onClick={() => setOpenDialog(true)}>Add Raw Material</Button>
        </div>
        <div className="text-destructive">Error loading raw materials: {error.message}</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Raw Materials</h2>
          <Button onClick={() => setOpenDialog(true)}>Add Raw Material</Button>
        </div>

        <DataTable
          columns={columns}
          data={data || []}
          searchKey="materialCode"
          searchPlaceholder="Search by material code, raw material, or date..."
        />
      </div>

      <Dialog open={openDialog} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Raw Material</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="material-code">Material Code *</Label>
              <Input
                id="material-code"
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                placeholder="Enter material code"
                disabled={createMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <DatePicker
                id="date"
                date={date}
                onDateChange={setDate}
                placeholder="Select a date"
                disabled={createMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="raw-material">Raw Material *</Label>
              <Input
                id="raw-material"
                value={rawMaterial}
                onChange={(e) => setRawMaterial(e.target.value)}
                placeholder="Enter raw material name"
                disabled={createMutation.isPending}
              />
            </div>

            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? 'Adding...' : 'Add Raw Material'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RawMaterialsPage;