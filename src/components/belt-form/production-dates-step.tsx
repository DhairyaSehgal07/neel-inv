'use client';

import { useEffect, useRef, useState } from 'react';
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
import { DatePicker } from '../ui/date-picker';
import {
  process_dates_from_dispatch,
  process_dates_backward_only,
  validateDateRelationships,
} from '@/lib/helpers/calculations';
import { useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { BeltFormData } from '@/types/belt';
import { toast } from 'sonner';

interface ProductionDatesStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
}

// Helper function to parse a date string (YYYY-MM-DD) as a local date (not UTC)
// This prevents timezone shifts when parsing date-only strings
function parseLocalDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    return dateStr;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date in local timezone (month is 0-indexed in Date constructor)
  return new Date(year, month - 1, day);
}

export const ProductionDatesStep = ({ form, onNext, onBack }: ProductionDatesStepProps) => {
  const { handleSubmit, control, setValue, setError, clearErrors, getValues } = form;
  const manuallyEditedRef = useRef<Set<string>>(new Set());
  const previousErrorsRef = useRef<Set<string>>(new Set());
  const lastEditedDateFieldRef = useRef<string | null>(null);
  const initialDispatchDateRef = useRef<Date | undefined>(undefined);

  const [isManualEditMode, setIsManualEditMode] = useState(false);
  const [hasManualDateEdit, setHasManualDateEdit] = useState(false);

  const dispatchDate = useWatch({ control, name: 'dispatchDate' });
  const packagingDate = useWatch({ control, name: 'packagingDate' });
  const pdiDate = useWatch({ control, name: 'pdiDate' });
  const inspectionDate = useWatch({ control, name: 'inspectionDate' });
  const curingDate = useWatch({ control, name: 'curingDate' });
  const greenBeltDate = useWatch({ control, name: 'greenBeltDate' });
  const calendaringDate = useWatch({ control, name: 'calendaringDate' });
  const coverCompoundProducedOn = useWatch({ control, name: 'coverCompoundProducedOn' });
  const skimCompoundProducedOn = useWatch({ control, name: 'skimCompoundProducedOn' });

  // Helper function to convert Date to YYYY-MM-DD using local timezone (not UTC)
  const toLocalDateString = (date: Date | string): string => {
    if (typeof date === 'string') return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Auto-calculate dates when dispatch date changes (only when not in manual edit mode)
  // Recalculate dependent dates unless they were manually edited
  useEffect(() => {
    if (dispatchDate && !isManualEditMode) {
      // Track initial dispatch date
      if (!initialDispatchDateRef.current) {
        initialDispatchDateRef.current = dispatchDate instanceof Date ? dispatchDate : parseLocalDate(dispatchDate);
      }

      // Convert date to ISO string if it's a Date object (using local timezone, not UTC)
      const dispatchDateIso = dispatchDate instanceof Date
        ? toLocalDateString(dispatchDate)
        : dispatchDate;

      console.log('[Production Dates] Dispatch date selected:', dispatchDate);
      console.log('[Production Dates] Converted to local date string:', dispatchDateIso);

      // Calculate all production dates based on dispatch date
      const dates = process_dates_from_dispatch(dispatchDateIso);

      console.log('all calculated dates are: ', dates);

      // Type guard: check if dates object has the expected properties
      if ('packaging_date' in dates) {
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

        // Set compound dates (both calculated from calendaring date, 7-10 working days before)
        if (
          !manuallyEditedRef.current.has('coverCompoundProducedOn') &&
          dates.cover_compound_date
        ) {
          setValue('coverCompoundProducedOn', new Date(dates.cover_compound_date));
        }
        if (
          !manuallyEditedRef.current.has('skimCompoundProducedOn') &&
          dates.skim_compound_date
        ) {
          setValue('skimCompoundProducedOn', new Date(dates.skim_compound_date));
        }
      }
    }
  }, [dispatchDate, isManualEditMode, setValue]);

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

  // Handle date adjustment based on the last edited date field
  const handleAdjustDates = () => {
    // Determine which date field to use as the base for calculation
    // Priority: last edited field > dispatch date > any other date
    let baseField: string | null = null;
    let baseDate: Date | undefined = undefined;

    // Check if we have a last edited field
    if (lastEditedDateFieldRef.current) {
      const dateValue = getValues()[lastEditedDateFieldRef.current as keyof BeltFormData];
      if (dateValue) {
        baseField = lastEditedDateFieldRef.current;
        baseDate = dateValue instanceof Date ? dateValue : parseLocalDate(dateValue as string);
      }
    }

    // Fallback to dispatch date if no last edited field
    if (!baseField || !baseDate) {
      if (!dispatchDate) {
        toast.error('Please set a date first');
        return;
      }
      baseField = 'dispatchDate';
      baseDate = dispatchDate instanceof Date
        ? dispatchDate
        : parseLocalDate(dispatchDate);
    }

    const baseDateIso = baseDate instanceof Date
      ? toLocalDateString(baseDate)
      : baseDate;

    console.log('[Production Dates Step] Adjusting dates backward from field:', baseField, 'with date:', baseDateIso);

    // Use the backward-only function that only calculates dates before the changed date
    const dates = process_dates_backward_only(baseField, baseDateIso);

    if (Object.keys(dates).length > 0) {
      // Only update dates that were calculated (dates before the changed date)
      // Preserve dates that come after the changed date
      if (dates.dispatch_date) {
        setValue('dispatchDate', parseLocalDate(dates.dispatch_date));
      }
      if (dates.packaging_date) {
        setValue('packagingDate', parseLocalDate(dates.packaging_date));
      }
      if (dates.pdi_date) {
        setValue('pdiDate', parseLocalDate(dates.pdi_date));
      }
      if (dates.internal_inspection_date) {
        setValue('inspectionDate', parseLocalDate(dates.internal_inspection_date));
      }
      if (dates.curing_date) {
        setValue('curingDate', parseLocalDate(dates.curing_date));
      }
      if (dates.green_belt_date) {
        setValue('greenBeltDate', parseLocalDate(dates.green_belt_date));
      }
      if (dates.calendaring_date) {
        setValue('calendaringDate', parseLocalDate(dates.calendaring_date));
      }
      if (dates.cover_compound_date) {
        setValue('coverCompoundProducedOn', parseLocalDate(dates.cover_compound_date));
      }
      if (dates.skim_compound_date) {
        setValue('skimCompoundProducedOn', parseLocalDate(dates.skim_compound_date));
      }

      setHasManualDateEdit(false);
      manuallyEditedRef.current.clear();
      lastEditedDateFieldRef.current = null;
      toast.success('Dates adjusted successfully (only dates before the changed date were updated)');
    } else {
      toast.error('Failed to calculate dates');
    }
  };

  const handleDateChange = (fieldName: keyof BeltFormData, date: Date | undefined) => {
    if (isManualEditMode) {
      // In manual edit mode, track the last edited field and mark as manually edited
      manuallyEditedRef.current.add(fieldName);
      lastEditedDateFieldRef.current = fieldName as string;
      setHasManualDateEdit(true);
    } else {
      // In auto mode, just mark as manually edited to prevent auto-calculation
      manuallyEditedRef.current.add(fieldName);
    }
    setValue(fieldName, date);
  };

  const handleSubmitWithLogging = (data: BeltFormData) => {
    // Get all form values (including unvalidated ones)
    const allFormValues = getValues();

    // Use validated data if available, otherwise use all form values
    const formData = Object.keys(data).length > 0 ? data : allFormValues;

    // Convert Date objects to ISO strings for JSON stringification
    const serializedData = Object.entries(formData).reduce(
      (acc, [key, value]) => {
        if (value instanceof Date) {
          acc[key] = value.toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Handle nested objects
          acc[key] = Object.entries(value).reduce(
            (nestedAcc, [nestedKey, nestedValue]) => {
              if (nestedValue instanceof Date) {
                nestedAcc[nestedKey] = nestedValue.toISOString();
              } else {
                nestedAcc[nestedKey] = nestedValue;
              }
              return nestedAcc;
            },
            {} as Record<string, unknown>
          );
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

    // Print all form values in JSON stringified format
    console.log('All form values:', JSON.stringify(serializedData, null, 2));

    // Call the original onNext handler
    onNext();
  };

  return (
    <Form {...form}>
      <div className="grid gap-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Process Dates</h3>
          <div className="flex gap-2">
            {!isManualEditMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsManualEditMode(true);
                  manuallyEditedRef.current.clear();
                  setHasManualDateEdit(false);
                  lastEditedDateFieldRef.current = null;
                }}
              >
                Manually Edit
              </Button>
            )}
            {isManualEditMode && hasManualDateEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAdjustDates}
              >
                Adjust Dates
              </Button>
            )}
            {isManualEditMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsManualEditMode(false);
                  manuallyEditedRef.current.clear();
                  setHasManualDateEdit(false);
                  lastEditedDateFieldRef.current = null;
                  // Recalculate from dispatch date if available
                  if (dispatchDate) {
                    const dispatchDateIso = dispatchDate instanceof Date
                      ? toLocalDateString(dispatchDate)
                      : dispatchDate;
                    const dates = process_dates_from_dispatch(dispatchDateIso);
                    if ('packaging_date' in dates) {
                      if (dates.packaging_date) setValue('packagingDate', new Date(dates.packaging_date));
                      if (dates.pdi_date) setValue('pdiDate', new Date(dates.pdi_date));
                      if (dates.internal_inspection_date) setValue('inspectionDate', new Date(dates.internal_inspection_date));
                      if (dates.curing_date) setValue('curingDate', new Date(dates.curing_date));
                      if (dates.green_belt_date) setValue('greenBeltDate', new Date(dates.green_belt_date));
                      if (dates.calendaring_date) setValue('calendaringDate', new Date(dates.calendaring_date));
                      if (dates.cover_compound_date) setValue('coverCompoundProducedOn', new Date(dates.cover_compound_date));
                      if (dates.skim_compound_date) setValue('skimCompoundProducedOn', new Date(dates.skim_compound_date));
                    }
                  }
                }}
              >
                Auto Mode
              </Button>
            )}
          </div>
        </div>

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
              <FormLabel>Packaging Date {!isManualEditMode && '(Auto-calculated)'}</FormLabel>
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
              <FormLabel>PDI Date {!isManualEditMode && '(Auto-calculated)'}</FormLabel>
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
              <FormLabel>Inspection Date {!isManualEditMode && '(Auto-calculated)'}</FormLabel>
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
              <FormLabel>Curing (Press) Date {!isManualEditMode && '(Auto-calculated)'}</FormLabel>
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
              <FormLabel>Green Belt Date {!isManualEditMode && '(Auto-calculated)'}</FormLabel>
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
              <FormLabel>Calendaring Date {!isManualEditMode && '(Auto-calculated)'}</FormLabel>
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
              <FormLabel>Cover Compound Produced On {!isManualEditMode && '(Auto-calculated)'}</FormLabel>
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
              <FormLabel>Skim Compound Produced On {!isManualEditMode && '(Auto-calculated)'}</FormLabel>
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
            Next
          </Button>
        </div>
      </div>
    </Form>
  );
};
