'use client';

import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Belt, CompoundType } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { ChevronLeft } from 'lucide-react';
import { parseDateString, formatDateString } from '@/lib/date-utils';

interface DatesStepProps {
  register: UseFormRegister<Belt>;
  watch: UseFormWatch<Belt>;
  setValue: UseFormSetValue<Belt>;
  isEditMode: boolean;
  onPrevious: () => void;
  onSubmit: () => void;
}

export function DatesStep({
  register,
  watch,
  setValue,
  isEditMode,
  onPrevious,
  onSubmit,
}: DatesStepProps) {
  const coverCompoundProducedOn = watch('compound.coverCompoundProducedOn');
  const skimCompoundProducedOn = watch('compound.skimCompoundProducedOn');
  const compoundCoverType = watch('compound.coverCompoundType') as CompoundType | undefined;
  const compoundSkimType = watch('compound.skimCompoundType') as CompoundType | undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Production Timeline (auto calculated)</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            💡 Set dispatch date to auto-calculate other dates. Or enter dates manually.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dispatchDate" className="text-sm font-medium">
            Dispatch Date
          </Label>
          <DatePicker
            id="dispatchDate"
            date={
              watch('process.dispatchDate')
                ? parseDateString(watch('process.dispatchDate')!)
                : undefined
            }
            onDateChange={(date) =>
              setValue('process.dispatchDate', date ? formatDateString(date) : undefined)
            }
            placeholder="Select dispatch date"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Enter dispatch date — other dates will be inferred
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="packagingDate" className="text-sm font-medium">
            Packaging Date
          </Label>
          <DatePicker
            id="packagingDate"
            date={
              watch('process.packagingDate')
                ? parseDateString(watch('process.packagingDate')!)
                : undefined
            }
            onDateChange={(date) =>
              setValue('process.packagingDate', date ? formatDateString(date) : undefined)
            }
            placeholder="Select packaging date"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Enter packaging date manually
          </p>
        </div>
        <div className="space-y-2">{/* Empty space for alignment */}</div>

        <div className="space-y-2">
          <Label htmlFor="pidDate" className="text-sm font-medium">
            PDI Date (Pre Dispatch Inspection)
          </Label>
          <DatePicker
            id="pidDate"
            date={
              watch('process.pidDate')
                ? parseDateString(watch('process.pidDate')!)
                : undefined
            }
            onDateChange={(date) =>
              setValue('process.pidDate', date ? formatDateString(date) : undefined)
            }
            placeholder="Select PDI date"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Pre Dispatch Inspection - Third party quality check
          </p>
        </div>
        <div className="space-y-2">{/* Empty space for alignment */}</div>

        <div className="space-y-2">
          <Label htmlFor="inspectionDate" className="text-sm font-medium">
            Inspection Date
          </Label>
          <DatePicker
            id="inspectionDate"
            date={
              watch('process.inspectionDate')
                ? parseDateString(watch('process.inspectionDate')!)
                : undefined
            }
            onDateChange={(date) =>
              setValue(
                'process.inspectionDate',
                date ? formatDateString(date) : undefined
              )
            }
            placeholder="Select inspection date"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Date of internal quality check
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inspectionMachine" className="text-sm font-medium">
            Inspection Station
          </Label>
          <Input
            id="inspectionMachine"
            {...register('process.inspectionMachine')}
            placeholder="Enter inspection station"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="curingDate" className="text-sm font-medium">
            Curing (Press) Date
          </Label>
          <DatePicker
            id="curingDate"
            date={
              watch('process.curingDate')
                ? parseDateString(watch('process.curingDate')!)
                : undefined
            }
            onDateChange={(date) =>
              setValue('process.curingDate', date ? formatDateString(date) : undefined)
            }
            placeholder="Select curing date"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Date when belt was vulcanized
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="curingMachine" className="text-sm font-medium">
            Press #
          </Label>
          <Input
            id="curingMachine"
            {...register('process.curingMachine')}
            placeholder="Enter press number"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="greenBeltDate" className="text-sm font-medium">
            Green Belt Date
          </Label>
          <DatePicker
            id="greenBeltDate"
            date={
              watch('process.greenBeltDate')
                ? parseDateString(watch('process.greenBeltDate')!)
                : undefined
            }
            onDateChange={(date) =>
              setValue('process.greenBeltDate', date ? formatDateString(date) : undefined)
            }
            placeholder="Select green belt date"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Date when uncured belt was assembled
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="greenBeltMachine" className="text-sm font-medium">
            Table #
          </Label>
          <Input
            id="greenBeltMachine"
            {...register('process.greenBeltMachine')}
            placeholder="Enter table number"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="calendaringDate" className="text-sm font-medium">
            Calendaring Date
          </Label>
          <DatePicker
            id="calendaringDate"
            date={
              watch('process.calendaringDate')
                ? parseDateString(watch('process.calendaringDate')!)
                : undefined
            }
            onDateChange={(date) =>
              setValue(
                'process.calendaringDate',
                date ? formatDateString(date) : undefined
              )
            }
            placeholder="Select calendaring date"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Date when fabric and rubber were combined
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="calendaringMachine" className="text-sm font-medium">
            Cal #
          </Label>
          <Input
            id="calendaringMachine"
            {...register('process.calendaringMachine')}
            placeholder="Enter machine number"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverCompoundProducedOn" className="text-sm font-medium">
            Cover Compound Produced On (auto) — Cal − 2 to Cal − 7
          </Label>
          <DatePicker
            id="coverCompoundProducedOn"
            date={
              watch('compound.coverCompoundProducedOn')
                ? parseDateString(watch('compound.coverCompoundProducedOn')!)
                : undefined
            }
            onDateChange={(date) =>
              setValue(
                'compound.coverCompoundProducedOn',
                date ? formatDateString(date) : undefined
              )
            }
            placeholder="Select cover compound produced date"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Auto-calculated from calendaring date (random within -2 to -7 days). Different from skim compound date (one compound per day policy).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="skimCompoundProducedOn" className="text-sm font-medium">
            Skim Compound Produced On (auto) — Cal − 2 to Cal − 7
          </Label>
          <DatePicker
            id="skimCompoundProducedOn"
            date={
              watch('compound.skimCompoundProducedOn')
                ? parseDateString(watch('compound.skimCompoundProducedOn')!)
                : undefined
            }
            onDateChange={(date) =>
              setValue(
                'compound.skimCompoundProducedOn',
                date ? formatDateString(date) : undefined
              )
            }
            placeholder="Select skim compound produced date"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Auto-calculated from calendaring date (random within -2 to -7 days). Different from cover compound date (one compound per day policy).
          </p>
        </div>
      </div>

      {/* Belt Codes Display */}
      {(watch('compound.coverBeltCode') || watch('compound.skimBeltCode')) && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-base font-semibold">Belt Codes (auto-generated)</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-blue-900 font-medium">
              Unique belt codes generated from date and compound type
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {watch('compound.coverBeltCode') && (
                <div className="space-y-2">
                  <Label htmlFor="coverBeltCode" className="text-sm font-medium">
                    Cover Belt Code
                  </Label>
                  <Input
                    id="coverBeltCode"
                    value={watch('compound.coverBeltCode') || ''}
                    readOnly
                    className="h-10 font-mono bg-white"
                  />
                  <p className="text-xs text-muted-foreground">
                    Generated from: {coverCompoundProducedOn} + {compoundCoverType}
                  </p>
                </div>
              )}
              {watch('compound.skimBeltCode') && (
                <div className="space-y-2">
                  <Label htmlFor="skimBeltCode" className="text-sm font-medium">
                    Skim Belt Code
                  </Label>
                  <Input
                    id="skimBeltCode"
                    value={watch('compound.skimBeltCode') || ''}
                    readOnly
                    className="h-10 font-mono bg-white"
                  />
                  <p className="text-xs text-muted-foreground">
                    Generated from: {skimCompoundProducedOn} + {compoundSkimType}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          size="lg"
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isEditMode ? 'Update Belt' : 'Save Belt'}
        </Button>
      </div>
    </div>
  );
}
