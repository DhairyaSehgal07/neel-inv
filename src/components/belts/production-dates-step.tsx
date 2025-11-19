'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePicker } from '../ui/date-picker';
import { process_dates_from_dispatch, getSeparateCompoundDates, validateDateRelationships } from '@/lib/calculations';
import type { UseFormReturn } from 'react-hook-form';
import type { BeltFormData } from './types';

interface ProductionDatesStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
}

export const ProductionDatesStep = ({ form, onNext, onBack }: ProductionDatesStepProps) => {
  const { handleSubmit, control, watch, setValue, setError, clearErrors, getValues } = form;
  const manuallyEditedRef = useRef<Set<string>>(new Set());
  const previousErrorsRef = useRef<Set<string>>(new Set());

  const dispatchDate = watch('dispatchDate');
  const packagingDate = watch('packagingDate');
  const pdiDate = watch('pdiDate');
  const inspectionDate = watch('inspectionDate');
  const curingDate = watch('curingDate');
  const greenBeltDate = watch('greenBeltDate');
  const calendaringDate = watch('calendaringDate');
  const coverCompoundProducedOn = watch('coverCompoundProducedOn');
  const skimCompoundProducedOn = watch('skimCompoundProducedOn');

  // Auto-calculate dates when dispatch date changes
  // Recalculate dependent dates unless they were manually edited
  useEffect(() => {
    if (dispatchDate) {
      // Convert date to ISO string if it's a Date object
      const dispatchDateIso =
        dispatchDate instanceof Date ? dispatchDate.toISOString().split('T')[0] : dispatchDate;

      // Calculate all production dates based on dispatch date
      const dates = process_dates_from_dispatch(dispatchDateIso);

      console.log("all calculated dates are: ", dates);

      // Only set dates that haven't been manually edited
      if (!manuallyEditedRef.current.has('packagingDate') && dates.packaging_date) {
        setValue('packagingDate', new Date(dates.packaging_date));
      }
      if (!manuallyEditedRef.current.has('pdiDate') && dates.pdi_date) {
        setValue('pdiDate', new Date(dates.pdi_date));
      }
      if (!manuallyEditedRef.current.has('inspectionDate') && dates.internal_inspection_date) {
        setValue('inspectionDate', new Date(dates.internal_inspection_date));
      }
      if (!manuallyEditedRef.current.has('curingDate') && dates.curing_date) {
        setValue('curingDate', new Date(dates.curing_date));
      }
      if (!manuallyEditedRef.current.has('greenBeltDate') && dates.green_belt_date) {
        setValue('greenBeltDate', new Date(dates.green_belt_date));
      }
      if (!manuallyEditedRef.current.has('calendaringDate') && dates.calendaring_date) {
        setValue('calendaringDate', new Date(dates.calendaring_date));
      }

      // Get separate compound dates
      const compoundDates = getSeparateCompoundDates(dates.compound_date);
      if (!manuallyEditedRef.current.has('coverCompoundProducedOn') && compoundDates.cover_compound_date) {
        setValue('coverCompoundProducedOn', new Date(compoundDates.cover_compound_date));
      }
      if (!manuallyEditedRef.current.has('skimCompoundProducedOn') && compoundDates.skim_compound_date) {
        setValue('skimCompoundProducedOn', new Date(compoundDates.skim_compound_date));
      }
    }
  }, [dispatchDate, setValue]);

  // Validate dates whenever they change
  useEffect(() => {
    const errors = validateDateRelationships({
      dispatchDate,
      packagingDate,
      pdiDate,
      inspectionDate,
      curingDate,
      greenBeltDate,
      calendaringDate,
      coverCompoundProducedOn,
      skimCompoundProducedOn,
    });

    const currentErrorKeys = new Set(Object.keys(errors));

    // Clear errors for fields that are now valid
    previousErrorsRef.current.forEach((key) => {
      if (!currentErrorKeys.has(key)) {
        clearErrors(key as keyof BeltFormData);
      }
    });

    // Set form errors for react-hook-form
    Object.keys(errors).forEach((key) => {
      setError(key as keyof BeltFormData, { type: 'manual', message: errors[key] });
    });

    previousErrorsRef.current = currentErrorKeys;
  }, [
    dispatchDate,
    packagingDate,
    pdiDate,
    inspectionDate,
    curingDate,
    greenBeltDate,
    calendaringDate,
    coverCompoundProducedOn,
    skimCompoundProducedOn,
    setError,
    clearErrors,
  ]);

  const handleDateChange = (fieldName: keyof BeltFormData, date: Date | undefined) => {
    manuallyEditedRef.current.add(fieldName);
    setValue(fieldName, date);
  };

  const handleSubmitWithLogging = (data: BeltFormData) => {
    // Get all form values (including unvalidated ones)
    const allFormValues = getValues();

    // Use validated data if available, otherwise use all form values
    const formData = Object.keys(data).length > 0 ? data : allFormValues;

    // Convert Date objects to ISO strings for JSON stringification
    const serializedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value instanceof Date) {
        acc[key] = value.toISOString();
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Handle nested objects
        acc[key] = Object.entries(value).reduce((nestedAcc, [nestedKey, nestedValue]) => {
          if (nestedValue instanceof Date) {
            nestedAcc[nestedKey] = nestedValue.toISOString();
          } else {
            nestedAcc[nestedKey] = nestedValue;
          }
          return nestedAcc;
        }, {} as Record<string, unknown>);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    // Print all form values in JSON stringified format
    console.log('All form values:', JSON.stringify(serializedData, null, 2));

    // Call the original onNext handler
    onNext();
  };

  return (
    <Form {...form}>
      <div className="grid gap-y-4">
        <FormField
          control={control}
          name="dispatchDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dispatch Date</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={(date) => handleDateChange('dispatchDate', date)}
                />
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
              <FormLabel>Packaging Date (Auto-calculated)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={(date) => handleDateChange('packagingDate', date)}
                />
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
              <FormLabel>PDI Date (Auto-calculated)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={(date) => handleDateChange('pdiDate', date)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="inspectionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection Date (Auto-calculated)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={(date) => handleDateChange('inspectionDate', date)}
                />
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
          name="curingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Curing (Press) Date (Auto-calculated)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={(date) => handleDateChange('curingDate', date)}
                />
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
          name="greenBeltDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Green Belt Date (Auto-calculated)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={(date) => handleDateChange('greenBeltDate', date)}
                />
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
          name="calendaringDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calendaring Date (Auto-calculated)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={(date) => handleDateChange('calendaringDate', date)}
                />
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
          name="coverCompoundProducedOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Compound Produced On (Auto-calculated)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={(date) => handleDateChange('coverCompoundProducedOn', date)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="skimCompoundProducedOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skim Compound Produced On (Auto-calculated)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={(date) => handleDateChange('skimCompoundProducedOn', date)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit(handleSubmitWithLogging)}>
            Submit
          </Button>
        </div>
      </div>
    </Form>
  );
};
