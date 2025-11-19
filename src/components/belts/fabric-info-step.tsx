'use client';

import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { UseFormReturn } from 'react-hook-form';
import type { BeltFormData } from './types';

interface FabricInfoStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
}

export const FabricInfoStep = ({ form, onNext, onBack }: FabricInfoStepProps) => {
  const { handleSubmit, control, watch, setValue } = form;

  const beltLength = watch('beltLength');
  const rating = watch('rating');

  // Calculate intermediate values for fabric consumed
  const fabricCalculationValues = useMemo(() => {
    if (!beltLength || !rating) return null;
    // Extract the denominator (number of plies) from rating format "250/2"
    const denominator = parseInt(rating.split('/')[1], 10);
    const numberOfPlies = isNaN(denominator) ? 1 : denominator;

    return {
      beltLengthM: parseFloat(beltLength),
      numberOfPlies,
      factor: 1.02,
    };
  }, [beltLength, rating]);

  useEffect(() => {
    if (beltLength && rating) {
      // Extract the denominator (number of plies) from rating format "250/2"
      const denominator = parseInt(rating.split('/')[1], 10);
      const numberOfPlies = isNaN(denominator) ? 1 : denominator;

      const fabricConsumed = parseFloat(beltLength) * numberOfPlies * 1.02;
      setValue('fabricConsumed', fabricConsumed.toFixed(2));
    }
  }, [beltLength, rating, setValue]);

  return (
    <Form {...form}>
      <div className="grid gap-y-4">
        <FormField
          control={control}
          name="fabricSupplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Supplier</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter supplier name" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="rollNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roll Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter roll number" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="fabricConsumed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Consumed (meters)</FormLabel>
              <FormControl>
                <Input {...field} disabled placeholder="Auto-calculated" autoComplete="off" />
              </FormControl>
              <FormDescription>Calculated: belt_length × rating_plies × 1.02</FormDescription>
              {fabricCalculationValues && (
                <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm space-y-1">
                  <div className="font-medium text-xs text-muted-foreground mb-2">Calculation Values:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Belt Length: <span className="font-medium">{fabricCalculationValues.beltLengthM} m</span></div>
                    <div>Number of Plies: <span className="font-medium">{fabricCalculationValues.numberOfPlies}</span></div>
                    <div className="col-span-2">Factor: <span className="font-medium">{fabricCalculationValues.factor}</span></div>
                  </div>
                </div>
              )}
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit(onNext)}>
            Next
          </Button>
        </div>
      </div>
    </Form>
  );
};
