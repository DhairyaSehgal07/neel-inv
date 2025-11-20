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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import SearchSelect from '@/components/search-select';
import { FABRIC_LOOKUP, FABRIC_TYPES, EDGE_TYPES } from '@/lib/helpers/belts';
import { useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { BeltFormData } from '@/types/belt';

interface BeltSpecsStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
}

export const BeltSpecsStep = ({ form, onNext, onBack }: BeltSpecsStepProps) => {
  const { handleSubmit, control, setValue } = form;
  const breakerPly = useWatch({
    control,
    name: 'breakerPly',
    defaultValue: false,
  });

  const rating = useWatch({
    control,
    name: 'rating',
  });

  // Calculate belt strength from rating
  const beltStrength = useMemo(() => {
    if (!rating) return undefined;
    return FABRIC_LOOKUP.find((f) => f.rating === rating)?.strength;
  }, [rating]);

  // Auto-update beltStrength when rating changes
  useEffect(() => {
    if (beltStrength !== undefined) {
      setValue('beltStrength', beltStrength, { shouldValidate: false, shouldDirty: false });
    } else {
      setValue('beltStrength', undefined, { shouldValidate: false, shouldDirty: false });
    }
  }, [beltStrength, setValue]);

  return (
    <Form {...form}>
      <div className="grid gap-y-4">
        <FormField
          control={control}
          name="beltNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Belt Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter belt number" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <SearchSelect
                  options={FABRIC_LOOKUP.map((f) => ({ label: f.rating, value: f.rating }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select a rating"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="beltStrength"
          render={() => (
            <FormItem>
              <FormLabel>Belt Strength</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Auto-calculated from rating"
                  autoComplete="off"
                  value={beltStrength ?? ''}
                  disabled
                  onChange={() => {}} // Prevent manual changes
                />
              </FormControl>
              <FormDescription>
                Automatically calculated based on the selected rating
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="fabricType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Type</FormLabel>
              <FormControl>
                <SearchSelect
                  options={FABRIC_TYPES.map((f) => ({ label: f, value: f }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select fabric type"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="topCover"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Top Cover (mm)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.0"
                  autoComplete="off"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bottomCover"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bottom Cover (mm)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.0"
                  autoComplete="off"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="beltLength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Belt Length (m)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="number"
                  step="0.1"
                  placeholder="e.g. 100.0"
                  autoComplete="off"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="beltWidth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Belt Width (mm)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} type="number" placeholder="e.g. 1200" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="edge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Edge</FormLabel>
              <FormControl>
                <SearchSelect
                  options={EDGE_TYPES.map((f) => ({ label: f, value: f }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="carcass"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carcass (mm)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.0"
                  autoComplete="off"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="coverGrade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Grade</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter cover grade" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="breakerPly"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Breaker Ply</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (!checked) {
                      setValue('breakerPlyRemarks', undefined);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {breakerPly && (
          <FormField
            control={control}
            name="breakerPlyRemarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Breaker Ply Remarks</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Enter remarks for breaker ply..."
                    className="min-h-20"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onBack} disabled>
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
