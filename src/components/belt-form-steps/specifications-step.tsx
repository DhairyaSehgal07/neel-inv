'use client';

import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Belt, FABRIC_LOOKUP, FabricType, EdgeType } from '@/lib/data';
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
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight } from 'lucide-react';
import { parseDateString, formatDateString } from '@/lib/date-utils';
import { parseNumberOfPliesFromRating } from '@/lib/calculations';

interface SpecificationsStepProps {
  register: UseFormRegister<Belt>;
  watch: UseFormWatch<Belt>;
  setValue: UseFormSetValue<Belt>;
  onNext: () => void;
}

export function SpecificationsStep({
  register,
  watch,
  setValue,
  onNext,
}: SpecificationsStepProps) {
  const rating = watch('rating');
  const beltWidthMm = watch('beltWidthMm');
  const breakerPly = watch('breakerPly');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="beltNumber" className="text-sm font-medium">
            Belt Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="beltNumber"
            {...register('beltNumber', { required: true })}
            placeholder="e.g. Belt #14598"
            className="h-10"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rating" className="text-sm font-medium">
              Rating <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(val) => {
                setValue('rating', val);
                setValue('fabric.rating', val);
              }}
            >
              <SelectTrigger id="rating" className="h-10">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {FABRIC_LOOKUP.map((f) => (
                  <SelectItem key={f.rating} value={f.rating}>
                    {f.rating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Plies: {parseNumberOfPliesFromRating(rating)} — Fabric consumed (m):{' '}
              {watch('fabric.consumedMeters') ?? '-'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabricType" className="text-sm font-medium">
              Fabric Type <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(val) => setValue('fabric.type', val as FabricType)}>
              <SelectTrigger id="fabricType" className="h-10">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EP">EP</SelectItem>
                <SelectItem value="NN">NN</SelectItem>
                <SelectItem value="EE">EE</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="topCover" className="text-sm font-medium">
              Top Cover (mm) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="topCover"
              type="number"
              step="0.1"
              {...register('topCoverMm', { valueAsNumber: true, required: true })}
              className="h-10"
              placeholder="e.g. 5.0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bottomCover" className="text-sm font-medium">
              Bottom Cover (mm) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bottomCover"
              type="number"
              step="0.1"
              {...register('bottomCoverMm', { valueAsNumber: true, required: true })}
              className="h-10"
              placeholder="e.g. 3.0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="beltLength" className="text-sm font-medium">
              Belt Length (m)
            </Label>
            <Input
              id="beltLength"
              type="number"
              step="0.1"
              {...register('beltLengthM', { valueAsNumber: true })}
              className="h-10"
              placeholder="e.g. 100.0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beltWidth" className="text-sm font-medium">
              Belt Width (mm)
            </Label>
            <Input
              id="beltWidth"
              type="number"
              step="0.1"
              value={beltWidthMm ?? ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                // Store in millimeters
                setValue('beltWidthMm', isNaN(value) ? undefined : value);
              }}
              className="h-10"
              placeholder="e.g. 1200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edge" className="text-sm font-medium">
              Edge
            </Label>
            <Select onValueChange={(val) => setValue('edge', val as EdgeType)}>
              <SelectTrigger id="edge" className="h-10">
                <SelectValue placeholder="Select edge type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cut">Cut</SelectItem>
                <SelectItem value="Moulded">Moulded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="carcass" className="text-sm font-medium">
              Carcass (mm) - Optional
            </Label>
            <Input
              id="carcass"
              type="number"
              step="0.1"
              {...register('carcassMm', { valueAsNumber: true })}
              className="h-10"
              placeholder="e.g. 2.0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverGrade" className="text-sm font-medium">
            Cover Grade
          </Label>
          <Input
            id="coverGrade"
            {...register('coverGrade')}
            placeholder="Enter cover grade"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="breakerPly"
              checked={breakerPly || false}
              onCheckedChange={(checked) => {
                setValue('breakerPly', checked);
                if (!checked) {
                  setValue('breakerPlyRemarks', undefined);
                }
              }}
            />
            <Label htmlFor="breakerPly" className="text-sm font-medium cursor-pointer">
              Breaker Ply
            </Label>
          </div>
          {breakerPly && (
            <div className="mt-2">
              <Textarea
                id="breakerPlyRemarks"
                {...register('breakerPlyRemarks')}
                placeholder="Enter remarks for breaker ply..."
                className="min-h-20"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-6 space-y-4">
        <h3 className="text-base font-semibold">Order Information</h3>

        <div className="space-y-2">
          <Label htmlFor="orderNumber" className="text-sm font-medium">
            Order Number
          </Label>
          <Input
            id="orderNumber"
            {...register('orderNumber')}
            placeholder="ORD-2025-001"
            className="h-10"
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyerName" className="text-sm font-medium">
              Buyer Name
            </Label>
            <Input
              id="buyerName"
              {...register('buyerName')}
              className="h-10"
              placeholder="Enter buyer name"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderDate" className="text-sm font-medium">
                Order Date
              </Label>
              <DatePicker
                id="orderDate"
                date={
                  watch('orderDate') ? parseDateString(watch('orderDate')!) : undefined
                }
                onDateChange={(date) =>
                  setValue('orderDate', date ? formatDateString(date) : undefined)
                }
                placeholder="Select"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDeadline" className="text-sm font-medium">
                Delivery Deadline
              </Label>
              <DatePicker
                id="deliveryDeadline"
                date={
                  watch('deliveryDeadline')
                    ? parseDateString(watch('deliveryDeadline')!)
                    : undefined
                }
                onDateChange={(date) =>
                  setValue('deliveryDeadline', date ? formatDateString(date) : undefined)
                }
                placeholder="Select"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">
          Status <span className="text-red-500">*</span>
        </Label>
        <Select
          onValueChange={(val) => {
            setValue('status', val as 'Dispatched' | 'In Production');
          }}
        >
          <SelectTrigger id="status" className="h-10">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="In Production">In Production</SelectItem>
            <SelectItem value="Dispatched">Dispatched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="button" onClick={onNext} size="lg">
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
