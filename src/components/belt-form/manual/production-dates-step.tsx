'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';

interface ProductionDatesStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
}

export const ProductionDatesStep = ({ form, onNext, onBack }: ProductionDatesStepProps) => {
  const { handleSubmit, control, watch, setValue } = form;
  const coverDate = watch('coverCompoundProducedOn');
  const skimDate = watch('skimCompoundProducedOn');
  const calendaringDate = watch('calendaringDate');

  const [coverDateUsed, setCoverDateUsed] = useState(false);
  const [skimDateUsed, setSkimDateUsed] = useState(false);
  const [datesConflict, setDatesConflict] = useState(false);
  const [isCheckingCover, setIsCheckingCover] = useState(false);
  const [isCheckingSkim, setIsCheckingSkim] = useState(false);
  const [isFixingCover, setIsFixingCover] = useState(false);
  const [isFixingSkim, setIsFixingSkim] = useState(false);

  // Format date to YYYY-MM-DD string
  const formatDateToString = (date: Date | undefined): string | null => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a date is already used
  const checkDateUsed = async (date: string | null): Promise<boolean> => {
    if (!date) return false;
    try {
      const response = await fetch(`/api/compounds/check-date?date=${date}`);
      const data = await response.json();
      return data.success && data.isUsed;
    } catch (error) {
      console.error('Error checking date:', error);
      return false;
    }
  };

  // Check cover date when it changes
  useEffect(() => {
    const dateStr = formatDateToString(coverDate);
    if (dateStr) {
      setIsCheckingCover(true);
      checkDateUsed(dateStr).then((used) => {
        setCoverDateUsed(used);
        setIsCheckingCover(false);
      });
    } else {
      setCoverDateUsed(false);
    }
  }, [coverDate]);

  // Check skim date when it changes
  useEffect(() => {
    const dateStr = formatDateToString(skimDate);
    if (dateStr) {
      setIsCheckingSkim(true);
      checkDateUsed(dateStr).then((used) => {
        setSkimDateUsed(used);
        setIsCheckingSkim(false);
      });
    } else {
      setSkimDateUsed(false);
    }
  }, [skimDate]);

  // Check if cover and skim dates are the same
  useEffect(() => {
    const coverStr = formatDateToString(coverDate);
    const skimStr = formatDateToString(skimDate);
    if (coverStr && skimStr && coverStr === skimStr) {
      setDatesConflict(true);
    } else {
      setDatesConflict(false);
    }
  }, [coverDate, skimDate]);

  // Fix cover date
  const handleFixCoverDate = async () => {
    if (!calendaringDate) {
      toast.error('Calendaring date is required to find an available date');
      return;
    }

    setIsFixingCover(true);
    try {
      const calendaringDateStr = formatDateToString(calendaringDate);
      const currentSkimDateStr = formatDateToString(skimDate);

      const response = await fetch('/api/compounds/find-available-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendaringDate: calendaringDateStr,
          excludeDate: currentSkimDateStr, // Exclude the skim date to ensure uniqueness
        }),
      });

      const data = await response.json();
      if (data.success && data.availableDate) {
        const newDate = new Date(data.availableDate + 'T00:00:00');
        setValue('coverCompoundProducedOn', newDate);
        setCoverDateUsed(false);
        setDatesConflict(false);
        toast.success('Cover compound date fixed successfully');
      } else {
        toast.error(data.message || 'Failed to find an available date');
      }
    } catch (error) {
      console.error('Error fixing cover date:', error);
      toast.error('Failed to fix cover compound date');
    } finally {
      setIsFixingCover(false);
    }
  };

  // Fix skim date
  const handleFixSkimDate = async () => {
    if (!calendaringDate) {
      toast.error('Calendaring date is required to find an available date');
      return;
    }

    setIsFixingSkim(true);
    try {
      const calendaringDateStr = formatDateToString(calendaringDate);
      const currentCoverDateStr = formatDateToString(coverDate);

      const response = await fetch('/api/compounds/find-available-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendaringDate: calendaringDateStr,
          excludeDate: currentCoverDateStr, // Exclude the cover date to ensure uniqueness
        }),
      });

      const data = await response.json();
      if (data.success && data.availableDate) {
        const newDate = new Date(data.availableDate + 'T00:00:00');
        setValue('skimCompoundProducedOn', newDate);
        setSkimDateUsed(false);
        setDatesConflict(false);
        toast.success('Skim compound date fixed successfully');
      } else {
        toast.error(data.message || 'Failed to find an available date');
      }
    } catch (error) {
      console.error('Error fixing skim date:', error);
      toast.error('Failed to fix skim compound date');
    } finally {
      setIsFixingSkim(false);
    }
  };

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
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <DatePicker date={field.value} onDateChange={field.onChange} />
                  </div>
                  {(skimDateUsed || (datesConflict && formatDateToString(skimDate) === formatDateToString(coverDate))) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFixSkimDate}
                      disabled={isFixingSkim || !calendaringDate}
                    >
                      {isFixingSkim ? 'Fixing...' : 'Fix Date'}
                    </Button>
                  )}
                </div>
              </FormControl>
              {skimDateUsed && (
                <p className="text-sm text-destructive">
                  This date is already used. Click &quot;Fix Date&quot; to find an available date.
                </p>
              )}
              {datesConflict && formatDateToString(skimDate) === formatDateToString(coverDate) && (
                <p className="text-sm text-destructive">
                  Cover and skim compound dates cannot be the same. Click &quot;Fix Date&quot; to find an available date.
                </p>
              )}
              {isCheckingSkim && (
                <p className="text-sm text-muted-foreground">Checking date availability...</p>
              )}
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
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <DatePicker date={field.value} onDateChange={field.onChange} />
                  </div>
                  {(coverDateUsed || (datesConflict && formatDateToString(coverDate) === formatDateToString(skimDate))) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFixCoverDate}
                      disabled={isFixingCover || !calendaringDate}
                    >
                      {isFixingCover ? 'Fixing...' : 'Fix Date'}
                    </Button>
                  )}
                </div>
              </FormControl>
              {coverDateUsed && (
                <p className="text-sm text-destructive">
                  This date is already used. Click &quot;Fix Date&quot; to find an available date.
                </p>
              )}
              {datesConflict && formatDateToString(coverDate) === formatDateToString(skimDate) && (
                <p className="text-sm text-destructive">
                  Cover and skim compound dates cannot be the same. Click &quot;Fix Date&quot; to find an available date.
                </p>
              )}
              {isCheckingCover && (
                <p className="text-sm text-muted-foreground">Checking date availability...</p>
              )}
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
