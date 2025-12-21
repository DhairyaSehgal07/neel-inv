'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import type { UseFormReturn } from 'react-hook-form';
import { BeltFormData } from '@/types/belt';

interface ProductionDatesStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
}

export const ProductionDatesStep = ({ form, onNext, onBack }: ProductionDatesStepProps) => {
  const { handleSubmit, control } = form;

  return (
    <Form {...form}>
      <div className="grid gap-y-4">
        <h3 className="text-lg font-semibold mb-2">Process Dates</h3>

        <FormField
          control={control}
          name="skimCompoundProducedOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skim Compound Produced On</FormLabel>
              <FormControl>
                <DatePicker date={field.value} onDateChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="coverCompoundProducedOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Compound Produced On</FormLabel>
              <FormControl>
                <DatePicker date={field.value} onDateChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="calendaringStation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calendaring Station</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter calendaring station" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="calendaringDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calendaring Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} onDateChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="greenBeltStation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Green Belt Station</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter green belt station" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="greenBeltDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Green Belt Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} onDateChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="pressStation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Press Station</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter press station" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="curingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Curing (Press) Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} onDateChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="inspectionStation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection Station</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter inspection station" autoComplete="off" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="inspectionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} onDateChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="pdiDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PDI Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} onDateChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="packagingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Packaging Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} onDateChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="dispatchDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dispatch Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} onDateChange={field.onChange} />
              </FormControl>
              <FormMessage />
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
