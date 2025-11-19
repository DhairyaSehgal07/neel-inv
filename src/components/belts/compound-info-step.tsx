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
import {
  cover_weight_kg,
  skim_weight_kg,
  parseNumberOfPliesFromRating,
  skim_thickness_from_strength,
} from '@/lib/calculations';
import { FABRIC_LOOKUP } from '@/lib/data';
import type { UseFormReturn } from 'react-hook-form';
import type { BeltFormData } from './types';

interface CompoundInfoStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
}

export const CompoundInfoStep = ({ form, onNext, onBack }: CompoundInfoStepProps) => {
  const { handleSubmit, control, watch, setValue } = form;

  const topCover = watch('topCover');
  const bottomCover = watch('bottomCover');
  const beltWidth = watch('beltWidth');
  const beltLength = watch('beltLength');
  const rating = watch('rating');

  const fabricStrength = useMemo(() => {
    if (!rating) return undefined;
    return FABRIC_LOOKUP.find((f) => f.rating === rating)?.strength;
  }, [rating]);

  // Calculate intermediate values for cover compound
  const coverCalculationValues = useMemo(() => {
    if (!beltWidth || !beltLength || !topCover || !bottomCover) return null;
    return {
      topCoverMm: parseFloat(topCover),
      bottomCoverMm: parseFloat(bottomCover),
      coverSG: 1.5,
      beltWidthM: parseFloat(beltWidth) / 1000,
      beltLengthM: parseFloat(beltLength),
    };
  }, [topCover, bottomCover, beltWidth, beltLength]);

  // Calculate intermediate values for skim compound
  const skimCalculationValues = useMemo(() => {
    if (!beltWidth || !beltLength || !rating || !fabricStrength) return null;
    return {
      fabricStrength,
      numberOfPlies: parseNumberOfPliesFromRating(rating),
      skimThicknessMmPerPly: skim_thickness_from_strength(fabricStrength),
      skimSG: 1.5,
      beltWidthM: parseFloat(beltWidth) / 1000,
      beltLengthM: parseFloat(beltLength),
    };
  }, [beltWidth, beltLength, rating, fabricStrength]);

  useEffect(() => {
    if (beltWidth && beltLength && topCover && bottomCover) {
      // Convert belt width from mm to m
      const beltWidthM = parseFloat(beltWidth) / 1000;
      const beltLengthM = parseFloat(beltLength);
      const topCoverMm = parseFloat(topCover);
      const bottomCoverMm = parseFloat(bottomCover);

      // Get cover compound specific gravity
      const coverSG = 1.5;

      // Calculate cover weight
      const coverWeight = cover_weight_kg(
        topCoverMm,
        bottomCoverMm,
        coverSG,
        beltWidthM,
        beltLengthM
      );
      setValue('coverCompoundConsumed', coverWeight.toFixed(2));
    }
  }, [topCover, bottomCover, beltWidth, beltLength, setValue]);

  useEffect(() => {
    if (beltWidth && beltLength && rating && fabricStrength) {
      // Convert belt width from mm to m
      const beltWidthM = parseFloat(beltWidth) / 1000;
      const beltLengthM = parseFloat(beltLength);

      // Extract number of plies from rating
      const numberOfPlies = parseNumberOfPliesFromRating(rating);

      // Get skim thickness per ply based on fabric strength
      const skimThicknessMmPerPly = skim_thickness_from_strength(fabricStrength);

      // Get skim compound specific gravity
      const skimSG = 1.5;

      // Calculate skim weight
      const skimWeight = skim_weight_kg(
        skimThicknessMmPerPly,
        numberOfPlies,
        skimSG,
        beltWidthM,
        beltLengthM
      );
      setValue('skimCompoundConsumed', skimWeight.toFixed(2));
    }
  }, [beltWidth, beltLength, rating, fabricStrength, setValue]);

  return (
    <Form {...form}>
      <div className="grid gap-y-4">
        <FormField
          control={control}
          name="coverCompoundType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Compound Type</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Select compound type" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="skimCompoundType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skim Compound Type</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Select compound type" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="coverCompoundConsumed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Compound Consumed (kg)</FormLabel>
              <FormControl>
                <Input {...field} disabled placeholder="Auto-calculated" autoComplete="off" />
              </FormControl>
              <FormDescription>
                Calculated: thickness_mm × SG × 1.06 × 1.02 × belt_width_m × belt_length_m
              </FormDescription>
              {coverCalculationValues && (
                <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm space-y-1">
                  <div className="font-medium text-xs text-muted-foreground mb-2">
                    Calculation Values:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      Top Cover:{' '}
                      <span className="font-medium">{coverCalculationValues.topCoverMm} mm</span>
                    </div>
                    <div>
                      Bottom Cover:{' '}
                      <span className="font-medium">{coverCalculationValues.bottomCoverMm} mm</span>
                    </div>
                    <div>
                      Cover SG:{' '}
                      <span className="font-medium">{coverCalculationValues.coverSG}</span>
                    </div>
                    <div>
                      Belt Width:{' '}
                      <span className="font-medium">
                        {coverCalculationValues.beltWidthM.toFixed(3)} m
                      </span>
                    </div>
                    <div className="col-span-2">
                      Belt Length:{' '}
                      <span className="font-medium">{coverCalculationValues.beltLengthM} m</span>
                    </div>
                  </div>
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="skimCompoundConsumed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skim Compound Consumed (kg)</FormLabel>
              <FormControl>
                <Input {...field} disabled placeholder="Auto-calculated" autoComplete="off" />
              </FormControl>
              <FormDescription>
                Calculated: (skim_thickness_mm_per_ply × plies) × SG × 1.06 × 1.02 × belt_width_m ×
                belt_length_m
              </FormDescription>
              {skimCalculationValues && (
                <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm space-y-1">
                  <div className="font-medium text-xs text-muted-foreground mb-2">
                    Calculation Values:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      Fabric Strength:{' '}
                      <span className="font-medium">
                        {skimCalculationValues.fabricStrength} N/mm
                      </span>
                    </div>
                    <div>
                      Number of Plies:{' '}
                      <span className="font-medium">{skimCalculationValues.numberOfPlies}</span>
                    </div>
                    <div>
                      Skim Thickness/Ply:{' '}
                      <span className="font-medium">
                        {skimCalculationValues.skimThicknessMmPerPly} mm
                      </span>
                    </div>
                    <div>
                      Skim SG: <span className="font-medium">{skimCalculationValues.skimSG}</span>
                    </div>
                    <div>
                      Belt Width:{' '}
                      <span className="font-medium">
                        {skimCalculationValues.beltWidthM.toFixed(3)} m
                      </span>
                    </div>
                    <div>
                      Belt Length:{' '}
                      <span className="font-medium">{skimCalculationValues.beltLengthM} m</span>
                    </div>
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
