'use client';

import { useMemo, useState } from 'react';
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
import type { UseFormReturn } from 'react-hook-form';
import { BeltFormData } from '@/types/belt';
import { useAvailableCompoundsQuery } from '@/services/api/queries/compounds/clientAvailableCompounds';
import { CompoundBatchDoc } from '@/model/CompoundBatch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface CompoundInfoStepProps {
  form: UseFormReturn<BeltFormData>;
  onNext: () => void;
  onBack: () => void;
  onBatchesChange: (
    cover: Array<{ batchId: string; batch: CompoundBatchDoc; consumedKg: number }>,
    skim: Array<{ batchId: string; batch: CompoundBatchDoc; consumedKg: number }>
  ) => void;
}

interface SelectedBatch {
  batchId: string;
  batch: CompoundBatchDoc;
  consumedKg: number;
}

const formatCompoundCode = (batch: CompoundBatchDoc): string => {
  const code = batch.compoundCode;
  const producedOnDate = batch.coverCompoundProducedOn || batch.skimCompoundProducedOn;
  const dateToUse = producedOnDate || batch.date;
  const formattedDate = dateToUse ? dateToUse.replace(/-/g, '') : '';
  return `${code}-${formattedDate}`;
};

export const CompoundInfoStep = ({
  form,
  onNext,
  onBack,
  onBatchesChange,
}: CompoundInfoStepProps) => {
  const { control, watch, setValue } = form;
  const { data: availableCompounds } = useAvailableCompoundsQuery();

  const [coverBatches, setCoverBatches] = useState<SelectedBatch[]>([]);
  const [skimBatches, setSkimBatches] = useState<SelectedBatch[]>([]);

  const coverCompoundConsumed = watch('coverCompoundConsumed');
  const skimCompoundConsumed = watch('skimCompoundConsumed');

  // Filter and classify compounds as cover or skim
  const coverBatchesAvailable = useMemo(() => {
    if (!availableCompounds) return [];
    return availableCompounds.filter(
      (batch) => batch.coverCompoundProducedOn && batch.inventoryRemaining > 0
    );
  }, [availableCompounds]);

  const skimBatchesAvailable = useMemo(() => {
    if (!availableCompounds) return [];
    return availableCompounds.filter(
      (batch) => batch.skimCompoundProducedOn && batch.inventoryRemaining > 0
    );
  }, [availableCompounds]);

  const handleCoverBatchToggle = (batch: CompoundBatchDoc, checked: boolean) => {
    if (checked) {
      setCoverBatches((prev) => [...prev, { batchId: batch._id.toString(), batch, consumedKg: 0 }]);
      // Auto-set compound type from batch if not already set
      if (batch.compoundName && !watch('coverCompoundType')) {
        setValue('coverCompoundType', batch.compoundName);
      }
      // Auto-set cover compound produced on date from batch
      if (batch.coverCompoundProducedOn) {
        const date = new Date(batch.coverCompoundProducedOn + 'T00:00:00');
        setValue('coverCompoundProducedOn', date);
      }
    } else {
      setCoverBatches((prev) => {
        const updated = prev.filter((b) => b.batchId !== batch._id.toString());
        // If no batches remain, clear the date; otherwise keep the first batch's date
        if (updated.length === 0) {
          setValue('coverCompoundProducedOn', undefined);
        } else if (updated[0]?.batch.coverCompoundProducedOn) {
          const date = new Date(updated[0].batch.coverCompoundProducedOn + 'T00:00:00');
          setValue('coverCompoundProducedOn', date);
        }
        return updated;
      });
    }
  };

  const handleSkimBatchToggle = (batch: CompoundBatchDoc, checked: boolean) => {
    if (checked) {
      setSkimBatches((prev) => [...prev, { batchId: batch._id.toString(), batch, consumedKg: 0 }]);
      // Auto-set compound type from batch if not already set
      if (batch.compoundName && !watch('skimCompoundType')) {
        setValue('skimCompoundType', batch.compoundName);
      }
      // Auto-set skim compound produced on date from batch
      if (batch.skimCompoundProducedOn) {
        const date = new Date(batch.skimCompoundProducedOn + 'T00:00:00');
        setValue('skimCompoundProducedOn', date);
      }
    } else {
      setSkimBatches((prev) => {
        const updated = prev.filter((b) => b.batchId !== batch._id.toString());
        // If no batches remain, clear the date; otherwise keep the first batch's date
        if (updated.length === 0) {
          setValue('skimCompoundProducedOn', undefined);
        } else if (updated[0]?.batch.skimCompoundProducedOn) {
          const date = new Date(updated[0].batch.skimCompoundProducedOn + 'T00:00:00');
          setValue('skimCompoundProducedOn', date);
        }
        return updated;
      });
    }
  };

  const handleCoverConsumedChange = (batchId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCoverBatches((prev) =>
      prev.map((b) => (b.batchId === batchId ? { ...b, consumedKg: numValue } : b))
    );
  };

  const handleSkimConsumedChange = (batchId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSkimBatches((prev) =>
      prev.map((b) => (b.batchId === batchId ? { ...b, consumedKg: numValue } : b))
    );
  };

  const removeCoverBatch = (batchId: string) => {
    setCoverBatches((prev) => prev.filter((b) => b.batchId !== batchId));
  };

  const removeSkimBatch = (batchId: string) => {
    setSkimBatches((prev) => prev.filter((b) => b.batchId !== batchId));
  };

  const totalCoverConsumed = coverBatches.reduce((sum, b) => sum + b.consumedKg, 0);
  const totalSkimConsumed = skimBatches.reduce((sum, b) => sum + b.consumedKg, 0);

  const handleNext = () => {
    // Validate total consumption - properly handle NaN values
    const parseConsumption = (value: unknown): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const coverConsumed = parseConsumption(coverCompoundConsumed);
    const skimConsumed = parseConsumption(skimCompoundConsumed);

    // At least one compound must be provided
    if (coverConsumed <= 0 && skimConsumed <= 0) {
      toast.error('Please provide at least one compound (cover or skim)');
      return;
    }

    // Validate cover compound if provided
    if (coverConsumed > 0) {
      if (coverBatches.length === 0) {
        toast.error('Please select at least one cover compound batch');
        return;
      }

      // Validate that all selected cover batches have consumption values
      for (const batch of coverBatches) {
        if (batch.consumedKg <= 0) {
          toast.error(
            `Please enter consumption amount for cover batch ${formatCompoundCode(batch.batch)}`
          );
          return;
        }
        if (batch.consumedKg > batch.batch.inventoryRemaining) {
          toast.error(
            `Cover batch ${formatCompoundCode(batch.batch)} only has ${batch.batch.inventoryRemaining} kg remaining, but ${batch.consumedKg} kg is required`
          );
          return;
        }
      }

      // Validate cover totals match
      if (Math.abs(totalCoverConsumed - coverConsumed) > 0.01) {
        toast.error(
          `Cover compound consumption mismatch. Total from batches: ${totalCoverConsumed.toFixed(2)} kg, but form shows: ${coverConsumed} kg`
        );
        return;
      }
    } else {
      // If cover is not provided, clear cover batches
      if (coverBatches.length > 0) {
        setCoverBatches([]);
      }
    }

    // Validate skim compound if provided
    if (skimConsumed > 0) {
      if (skimBatches.length === 0) {
        toast.error('Please select at least one skim compound batch');
        return;
      }

      // Validate that all selected skim batches have consumption values
      for (const batch of skimBatches) {
        if (batch.consumedKg <= 0) {
          toast.error(
            `Please enter consumption amount for skim batch ${formatCompoundCode(batch.batch)}`
          );
          return;
        }
        if (batch.consumedKg > batch.batch.inventoryRemaining) {
          toast.error(
            `Skim batch ${formatCompoundCode(batch.batch)} only has ${batch.batch.inventoryRemaining} kg remaining, but ${batch.consumedKg} kg is required`
          );
          return;
        }
      }

      // Validate skim totals match
      if (Math.abs(totalSkimConsumed - skimConsumed) > 0.01) {
        toast.error(
          `Skim compound consumption mismatch. Total from batches: ${totalSkimConsumed.toFixed(2)} kg, but form shows: ${skimConsumed} kg`
        );
        return;
      }
    } else {
      // If skim is not provided, clear skim batches
      if (skimBatches.length > 0) {
        setSkimBatches([]);
      }
    }

    // Store selected batches via callback
    onBatchesChange(coverBatches, skimBatches);

    onNext();
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <FormField
          control={control}
          name="coverCompoundConsumed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Compound Consumed (kg)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Enter cover compound consumed"
                  autoComplete="off"
                  type="number"
                  step="0.01"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Cover Compound Batches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total Selected: {totalCoverConsumed.toFixed(2)} kg / Required:{' '}
              {typeof coverCompoundConsumed === 'number'
                ? coverCompoundConsumed
                : typeof coverCompoundConsumed === 'string'
                  ? parseFloat(coverCompoundConsumed) || 0
                  : 0}{' '}
              kg
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Compound</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Available (kg)</TableHead>
                    <TableHead>Consumed (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coverBatchesAvailable.map((batch) => {
                    const isSelected = coverBatches.some((b) => b.batchId === batch._id.toString());
                    const selectedBatch = coverBatches.find(
                      (b) => b.batchId === batch._id.toString()
                    );
                    return (
                      <TableRow key={batch._id.toString()}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleCoverBatchToggle(batch, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>{batch.compoundName || batch.compoundCode}</TableCell>
                        <TableCell>{batch.coverCompoundProducedOn || batch.date}</TableCell>
                        <TableCell>{batch.inventoryRemaining.toFixed(2)}</TableCell>
                        <TableCell>
                          {isSelected && (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={batch.inventoryRemaining}
                              value={selectedBatch?.consumedKg || 0}
                              onChange={(e) =>
                                handleCoverConsumedChange(batch._id.toString(), e.target.value)
                              }
                              className="w-24"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {coverBatches.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Selected Batches:</div>
                {coverBatches.map((selected) => (
                  <div
                    key={selected.batchId}
                    className="flex items-center justify-between text-sm border p-2 rounded"
                  >
                    <span>
                      {selected.batch.compoundName || selected.batch.compoundCode} -{' '}
                      {selected.consumedKg.toFixed(2)} kg
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCoverBatch(selected.batchId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <FormField
          control={control}
          name="skimCompoundConsumed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skim Compound Consumed (kg)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Enter skim compound consumed"
                  autoComplete="off"
                  type="number"
                  step="0.01"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Skim Compound Batches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total Selected: {totalSkimConsumed.toFixed(2)} kg / Required:{' '}
              {typeof skimCompoundConsumed === 'number'
                ? skimCompoundConsumed
                : typeof skimCompoundConsumed === 'string'
                  ? parseFloat(skimCompoundConsumed) || 0
                  : 0}{' '}
              kg
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Compound</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Available (kg)</TableHead>
                    <TableHead>Consumed (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skimBatchesAvailable.map((batch) => {
                    const isSelected = skimBatches.some((b) => b.batchId === batch._id.toString());
                    const selectedBatch = skimBatches.find(
                      (b) => b.batchId === batch._id.toString()
                    );
                    return (
                      <TableRow key={batch._id.toString()}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSkimBatchToggle(batch, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>{batch.compoundName || batch.compoundCode}</TableCell>
                        <TableCell>{batch.skimCompoundProducedOn || batch.date}</TableCell>
                        <TableCell>{batch.inventoryRemaining.toFixed(2)}</TableCell>
                        <TableCell>
                          {isSelected && (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={batch.inventoryRemaining}
                              value={selectedBatch?.consumedKg || 0}
                              onChange={(e) =>
                                handleSkimConsumedChange(batch._id.toString(), e.target.value)
                              }
                              className="w-24"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {skimBatches.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Selected Batches:</div>
                {skimBatches.map((selected) => (
                  <div
                    key={selected.batchId}
                    className="flex items-center justify-between text-sm border p-2 rounded"
                  >
                    <span>
                      {selected.batch.compoundName || selected.batch.compoundCode} -{' '}
                      {selected.consumedKg.toFixed(2)} kg
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkimBatch(selected.batchId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button type="button" size="sm" onClick={handleNext}>
            Next
          </Button>
        </div>
      </div>
    </Form>
  );
};
