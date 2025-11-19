'use client';

import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Belt, FABRIC_LOOKUP, COMPOUNDS, CompoundType } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface CalcValues {
  numberOfPlies: number;
  beltWidthM: number | undefined;
  coverThicknessMm: number;
  coverSG: number;
  skimThicknessMm: number;
  skimSG: number;
}

interface FabricAndCompoundStepProps {
  register: UseFormRegister<Belt>;
  watch: UseFormWatch<Belt>;
  setValue: UseFormSetValue<Belt>;
  calcValues: CalcValues;
  onNext: () => void;
  onPrevious: () => void;
}

export function FabricAndCompoundStep({
  register,
  watch,
  setValue,
  calcValues,
  onNext,
  onPrevious,
}: FabricAndCompoundStepProps) {
  const rating = watch('rating');
  const beltLengthM = watch('beltLengthM');
  const topCoverMm = watch('topCoverMm');
  const bottomCoverMm = watch('bottomCoverMm');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Fabric Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fabricSupplier" className="text-sm font-medium">
              Fabric Supplier (Optional)
            </Label>
            <Input
              id="fabricSupplier"
              {...register('fabric.supplier')}
              placeholder="Enter supplier name"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fabricRollNumber" className="text-sm font-medium">
              Roll Number (Optional)
            </Label>
            <Input
              id="fabricRollNumber"
              {...register('fabric.rollNumber')}
              placeholder="Enter roll number"
              className="h-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fabricConsumed" className="text-sm font-medium">
            Fabric Consumed (meters) — (auto)
          </Label>
          <Input
            id="fabricConsumed"
            {...register('fabric.consumedMeters')}
            className="h-10"
            readOnly
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Calculated: belt_length * number_of_plies * 1.02
          </p>
        </div>

        {rating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">
              Fabric Calculation Values:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Rating:</p>
                <p className="font-mono font-medium">{rating}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Number of Plies:</p>
                <p className="font-mono font-medium">{calcValues.numberOfPlies}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Belt Length (m):</p>
                <p className="font-mono font-medium">{beltLengthM ?? '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Strength:</p>
                <p className="font-mono font-medium">
                  {FABRIC_LOOKUP.find((f) => f.rating === rating)?.strength ?? '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-6 space-y-4">
        <h3 className="text-base font-semibold">Compound Information (auto)</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="coverCompoundType" className="text-sm font-medium">
              Cover Compound Type
            </Label>
            <Select
              onValueChange={(val) =>
                setValue('compound.coverCompoundType', val as CompoundType)
              }
            >
              <SelectTrigger id="coverCompoundType" className="h-10">
                <SelectValue placeholder="Select cover compound type" />
              </SelectTrigger>
              <SelectContent>
                {COMPOUNDS.map((compound) => (
                  <SelectItem key={compound} value={compound}>
                    {compound}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skimCompoundType" className="text-sm font-medium">
              Skim Compound Type
            </Label>
            <Select
              onValueChange={(val) =>
                setValue('compound.skimCompoundType', val as CompoundType)
              }
            >
              <SelectTrigger id="skimCompoundType" className="h-10">
                <SelectValue placeholder="Select skim compound type" />
              </SelectTrigger>
              <SelectContent>
                {COMPOUNDS.map((compound) => (
                  <SelectItem key={compound} value={compound}>
                    {compound}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="coverCompoundConsumed" className="text-sm font-medium">
              Cover Compound Consumed (kg) — (auto)
            </Label>
            <Input
              id="coverCompoundConsumed"
              {...register('compound.coverCompoundConsumed')}
              className="h-10"
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Calculated by cover weight formula
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="skimCompoundConsumed" className="text-sm font-medium">
              Skim Compound Consumed (kg) — (auto)
            </Label>
            <Input
              id="skimCompoundConsumed"
              {...register('compound.skimCompoundConsumed')}
              className="h-10"
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Calculated by skim weight formula
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-green-900">
            Compound Calculation Values:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Top Cover (mm):</p>
              <p className="font-mono font-medium">{topCoverMm ?? '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bottom Cover (mm):</p>
              <p className="font-mono font-medium">{bottomCoverMm ?? '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cover Thickness (mm):</p>
              <p className="font-mono font-medium">
                {calcValues.coverThicknessMm.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Belt Width (m):</p>
              <p className="font-mono font-medium">
                {calcValues.beltWidthM?.toFixed(3) ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Belt Length (m):</p>
              <p className="font-mono font-medium">{beltLengthM ?? '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cover SG:</p>
              <p className="font-mono font-medium">{calcValues.coverSG.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Skim SG:</p>
              <p className="font-mono font-medium">{calcValues.skimSG.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Skim Thickness (mm):</p>
              <p className="font-mono font-medium">
                {calcValues.skimThicknessMm.toFixed(3)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Number of Plies:</p>
              <p className="font-mono font-medium">{calcValues.numberOfPlies}</p>
            </div>
          </div>
        </div>
      </div>

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
        <Button type="button" onClick={onNext} size="lg" className="w-full sm:w-auto">
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
