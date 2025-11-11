'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { reverseTrackingData, ReverseTrackingRecord } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

export default function ReverseTrackingPage() {
  const [records, setRecords] = useState(reverseTrackingData);
  const { register, handleSubmit, reset } = useForm<ReverseTrackingRecord>();
  const [open, setOpen] = useState(false);

  const onSubmit = (data: ReverseTrackingRecord) => {
    const newRecord = {
      ...data,
      id: String(records.length + 1),
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };
    setRecords([newRecord, ...records]);
    reset();
    setOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Reverse Tracking</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Reverse Tracking Entry</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Batch Number</Label>
                <Input {...register('batchNumber', { required: true })} />
              </div>

              <div>
                <Label>Product Type</Label>
                <Input {...register('productType', { required: true })} />
              </div>

              <div>
                <Label>Quantity Returned</Label>
                <Input
                  type="number"
                  {...register('quantityReturned', { required: true, valueAsNumber: true })}
                />
              </div>

              <div>
                <Label>Reason</Label>
                <Input {...register('reason', { required: true })} />
              </div>

              <div>
                <Label>Processed By</Label>
                <Input {...register('processedBy', { required: true })} />
              </div>

              <Button type="submit" className="w-full">
                Save
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch No</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Processed By</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.batchNumber}</TableCell>
              <TableCell>{r.date}</TableCell>
              <TableCell>{r.productType}</TableCell>
              <TableCell>{r.quantityReturned}</TableCell>
              <TableCell>{r.reason}</TableCell>
              <TableCell>{r.processedBy}</TableCell>
              <TableCell>{r.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
