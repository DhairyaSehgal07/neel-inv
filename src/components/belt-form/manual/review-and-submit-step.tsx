'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { UseFormReturn } from 'react-hook-form';
import { BeltFormData } from '@/types/belt';
import { format } from 'date-fns';
import { useCreateManualBeltMutation } from '@/services/api/queries/belts/clientBelts';
import { CompoundBatchDoc } from '@/model/CompoundBatch';

interface ReviewAndSubmitStepProps {
  form: UseFormReturn<BeltFormData>;
  onBack: () => void;
  onSuccess: () => void;
  coverBatches: Array<{ batchId: string; batch: CompoundBatchDoc; consumedKg: number }>;
  skimBatches: Array<{ batchId: string; batch: CompoundBatchDoc; consumedKg: number }>;
}

const formatValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return 'Not provided';
  }
  if (value instanceof Date) {
    return format(value, 'MMM dd, yyyy');
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
};

export const ReviewAndSubmitStep = ({ form, onBack, onSuccess, coverBatches, skimBatches }: ReviewAndSubmitStepProps) => {
  const { getValues } = form;
  const createBeltMutation = useCreateManualBeltMutation();

  const formData = getValues();

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.beltNumber) {
      toast.error('Belt number is required');
      return;
    }

    if (!formData.coverCompoundType) {
      toast.error('Cover compound type is required');
      return;
    }

    if (!formData.skimCompoundType) {
      toast.error('Skim compound type is required');
      return;
    }

    const coverConsumed =
      typeof formData.coverCompoundConsumed === 'number'
        ? formData.coverCompoundConsumed
        : typeof formData.coverCompoundConsumed === 'string'
          ? parseFloat(formData.coverCompoundConsumed)
          : 0;

    const skimConsumed =
      typeof formData.skimCompoundConsumed === 'number'
        ? formData.skimCompoundConsumed
        : typeof formData.skimCompoundConsumed === 'string'
          ? parseFloat(formData.skimCompoundConsumed)
          : 0;

    if (coverConsumed <= 0) {
      toast.error('Cover compound consumed must be greater than 0');
      return;
    }

    if (skimConsumed <= 0) {
      toast.error('Skim compound consumed must be greater than 0');
      return;
    }

    // Prepare payload for API
    const payload = {
      formData,
      coverBatches: coverBatches.map((b) => ({ batchId: b.batchId, consumedKg: b.consumedKg })),
      skimBatches: skimBatches.map((b) => ({ batchId: b.batchId, consumedKg: b.consumedKg })),
    };

    // Call API using mutation
    createBeltMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Belt created successfully!');
        onSuccess();
      },
      onError: (error) => {
        console.error('Error creating belt:', error);
        let errorMessage = 'Failed to create belt';

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        // Show error toast with detailed message
        toast.error(errorMessage, {
          duration: 5000,
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review Your Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please review all the information before submitting. You can go back to make changes if
          needed.
        </p>
      </div>

      <div className="space-y-4">
        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Belt Number:</span> {formatValue(formData.beltNumber)}
              </div>
              <div>
                <span className="font-medium">Rating:</span> {formatValue(formData.rating)}
              </div>
              <div>
                <span className="font-medium">Belt Strength:</span>{' '}
                {formatValue(formData.beltStrength)}
              </div>
              <div>
                <span className="font-medium">Fabric Type:</span> {formatValue(formData.fabricType)}
              </div>
              <div>
                <span className="font-medium">Top Cover (mm):</span>{' '}
                {formatValue(formData.topCover)}
              </div>
              <div>
                <span className="font-medium">Bottom Cover (mm):</span>{' '}
                {formatValue(formData.bottomCover)}
              </div>
              <div>
                <span className="font-medium">Belt Length (m):</span>{' '}
                {formatValue(formData.beltLength)}
              </div>
              <div>
                <span className="font-medium">Belt Width (mm):</span>{' '}
                {formatValue(formData.beltWidth)}
              </div>
              <div>
                <span className="font-medium">Edge:</span> {formatValue(formData.edge)}
              </div>
              <div>
                <span className="font-medium">Carcass (mm):</span> {formatValue(formData.carcass)}
              </div>
              <div>
                <span className="font-medium">Cover Grade:</span> {formatValue(formData.coverGrade)}
              </div>
              <div>
                <span className="font-medium">Breaker Ply:</span> {formatValue(formData.breakerPly)}
              </div>
              {formData.breakerPly && (
                <div className="col-span-2">
                  <span className="font-medium">Breaker Ply Remarks:</span>{' '}
                  {formatValue(formData.breakerPlyRemarks)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Order Number:</span>{' '}
                {formatValue(formData.orderNumber)}
              </div>
              <div>
                <span className="font-medium">Buyer Name:</span> {formatValue(formData.buyerName)}
              </div>
              <div>
                <span className="font-medium">Order Date:</span> {formatValue(formData.orderDate)}
              </div>
              <div>
                <span className="font-medium">Delivery Deadline:</span>{' '}
                {formatValue(formData.deliveryDeadline)}
              </div>
              <div>
                <span className="font-medium">Status:</span> {formatValue(formData.status)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fabric Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fabric Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Fabric Supplier:</span>{' '}
                {formatValue(formData.fabricSupplier)}
              </div>
              <div>
                <span className="font-medium">Roll Number:</span> {formatValue(formData.rollNumber)}
              </div>

              <div>
                <span className="font-medium">Fabric Consumed:</span>{' '}
                {formatValue(formData.fabricConsumed)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compound Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compound Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Cover Compound Consumed:</span>{' '}
                {formatValue(formData.coverCompoundConsumed)} kg
              </div>
              <div>
                <span className="font-medium">Skim Compound Consumed:</span>{' '}
                {formatValue(formData.skimCompoundConsumed)} kg
              </div>
              {coverBatches && coverBatches.length > 0 && (
                <div className="col-span-2">
                  <span className="font-medium">Cover Batches:</span>
                  <ul className="list-disc list-inside mt-1">
                    {coverBatches.map((batch, idx) => (
                      <li key={idx} className="text-xs">
                        {batch.batch.compoundName || batch.batch.compoundCode} - {batch.consumedKg.toFixed(2)} kg
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {skimBatches && skimBatches.length > 0 && (
                <div className="col-span-2">
                  <span className="font-medium">Skim Batches:</span>
                  <ul className="list-disc list-inside mt-1">
                    {skimBatches.map((batch, idx) => (
                      <li key={idx} className="text-xs">
                        {batch.batch.compoundName || batch.batch.compoundCode} - {batch.consumedKg.toFixed(2)} kg
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Production Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Dispatch Date:</span>{' '}
                {formatValue(formData.dispatchDate)}
              </div>
              <div>
                <span className="font-medium">Packaging Date:</span>{' '}
                {formatValue(formData.packagingDate)}
              </div>
              <div>
                <span className="font-medium">PDI Date:</span> {formatValue(formData.pdiDate)}
              </div>
              <div>
                <span className="font-medium">Inspection Date:</span>{' '}
                {formatValue(formData.inspectionDate)}
              </div>
              <div>
                <span className="font-medium">Inspection Station:</span>{' '}
                {formatValue(formData.inspectionStation)}
              </div>
              <div>
                <span className="font-medium">Curing Date:</span> {formatValue(formData.curingDate)}
              </div>
              <div>
                <span className="font-medium">Press Station:</span>{' '}
                {formatValue(formData.pressStation)}
              </div>
              <div>
                <span className="font-medium">Green Belt Date:</span>{' '}
                {formatValue(formData.greenBeltDate)}
              </div>
              <div>
                <span className="font-medium">Green Belt Station:</span>{' '}
                {formatValue(formData.greenBeltStation)}
              </div>
              <div>
                <span className="font-medium">Calendaring Date:</span>{' '}
                {formatValue(formData.calendaringDate)}
              </div>
              <div>
                <span className="font-medium">Calendaring Station:</span>{' '}
                {formatValue(formData.calendaringStation)}
              </div>
              <div>
                <span className="font-medium">Cover Compound Produced On:</span>{' '}
                {formatValue(formData.coverCompoundProducedOn)}
              </div>
              <div>
                <span className="font-medium">Skim Compound Produced On:</span>{' '}
                {formatValue(formData.skimCompoundProducedOn)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-between">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={createBeltMutation.isPending}
          className="min-w-[100px]"
        >
          {createBeltMutation.isPending ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
};
