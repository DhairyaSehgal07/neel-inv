'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import SearchSelect from '@/components/search-select';
import { FABRIC_LOOKUP, FABRIC_TYPES, EDGE_TYPES } from '@/lib/data';
import type { UseFormReturn } from 'react-hook-form';
import type { BeltFormData } from './types';

interface BeltSpecsStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
}

export const BeltSpecsStep = ({ form, onNext, onBack }: BeltSpecsStepProps) => {
  const { handleSubmit, control } = form;

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
                <Input {...field} type="number" placeholder="e.g. 1200" autoComplete="off" />
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
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

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
