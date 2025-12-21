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
} from '@/lib/helpers/calculations';
import type { UseFormReturn } from 'react-hook-form';
import { BeltFormData } from '@/types/belt';
import SearchSelect from '@/components/search-select';
import { useCompoundMastersQuery } from '@/services/api/queries/compounds/clientCompoundMasters';
import { useRatingsQuery } from '@/services/api/queries/ratings/clientRatings';
import { useSession } from 'next-auth/react';
import { roundToNearest5 } from '@/lib/utils';

interface CompoundInfoStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
}

export const CompoundInfoStep = ({ form, onNext, onBack }: CompoundInfoStepProps) => {
  const { handleSubmit, control, watch, setValue } = form;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'Admin';
  const { data } = useCompoundMastersQuery();
  const { data: ratings } = useRatingsQuery();

  // Filter and transform compound masters for cover compounds
  const coverCompoundOptions = useMemo(() => {
    if (!data) return [];
    return data
      .filter((compound) => compound.category === 'cover')
      .map((compound) => ({
        label: compound.compoundName,
        value: compound.compoundName, // Store compoundName for belt service to convert to code
      }));
  }, [data]);

  // Filter and transform compound masters for skim compounds
  const skimCompoundOptions = useMemo(() => {
    if (!data) return [];
    return data
      .filter((compound) => compound.category === 'skim')
      .map((compound) => ({
        label: compound.compoundName,
        value: compound.compoundName, // Store compoundName for belt service to convert to code
      }));
  }, [data]);

  const topCover = watch('topCover');
  const bottomCover = watch('bottomCover');
  const beltWidth = watch('beltWidth');
  const beltLength = watch('beltLength');
  const rating = watch('rating');

  const fabricStrength = useMemo(() => {
    if (!rating || !ratings) return undefined;
    return ratings.find((r) => r.rating === rating)?.strength;
  }, [rating, ratings]);

  // Calculate intermediate values for cover compound
  const coverCalculationValues = useMemo(() => {
    if (!beltWidth || !beltLength || !topCover || !bottomCover) return null;
    return {
      topCoverMm: parseFloat(String(topCover)),
      bottomCoverMm: parseFloat(String(bottomCover)),
      coverSG: 1.5,
      beltWidthM: parseFloat(String(beltWidth)) / 1000,
      beltLengthM: parseFloat(String(beltLength)),
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
      beltWidthM: parseFloat(String(beltWidth)) / 1000,
      beltLengthM: parseFloat(String(beltLength)),
    };
  }, [beltWidth, beltLength, rating, fabricStrength]);

  useEffect(() => {
    if (beltWidth && beltLength && topCover && bottomCover) {
      // Convert belt width from mm to m
      const beltWidthM = parseFloat(String(beltWidth)) / 1000;
      const beltLengthM = parseFloat(String(beltLength));
      const topCoverMm = parseFloat(String(topCover));
      const bottomCoverMm = parseFloat(String(bottomCover));

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
      setValue('coverCompoundConsumed', roundToNearest5(coverWeight).toFixed(2));
    }
  }, [topCover, bottomCover, beltWidth, beltLength, setValue]);

  useEffect(() => {
    if (beltWidth && beltLength && rating && fabricStrength) {
      // Convert belt width from mm to m
      const beltWidthM = parseFloat(String(beltWidth)) / 1000;
      const beltLengthM = parseFloat(String(beltLength));

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
      setValue('skimCompoundConsumed', roundToNearest5(skimWeight).toFixed(2));
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
                <SearchSelect
                  options={coverCompoundOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select a cover compound"
                />
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
                <SearchSelect
                  options={skimCompoundOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select a skim compound"
                />
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
                <Input {...field} value={field.value ?? ''} disabled placeholder="Auto-calculated" autoComplete="off" />
              </FormControl>
              {isAdmin && (<FormDescription>Calculated: thickness_mm × SG × 1.06 × 1.02 × belt_width_m × belt_length_m</FormDescription>)}
              {isAdmin && coverCalculationValues && (
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
                <Input {...field} value={field.value ?? ''} disabled placeholder="Auto-calculated" autoComplete="off" />
              </FormControl>
              {isAdmin && (<FormDescription>Calculated: (skim_thickness_mm_per_ply × plies) × SG × 1.06 × 1.02 × belt_width_m × belt_length_m</FormDescription>)}
              {isAdmin && skimCalculationValues && (
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
