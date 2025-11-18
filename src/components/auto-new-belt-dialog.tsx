'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Belt, FABRIC_LOOKUP, FabricType, COMPOUNDS, CompoundType, EdgeType } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { parseDateString, formatDateString } from '@/lib/date-utils';

import {
  parseNumberOfPliesFromRating,
  fabric_consumed,
  cover_weight_kg,
  skim_weight_kg,
  skim_thickness_from_strength,
  process_dates_from_dispatch,
} from '@/lib/calculations';

interface NewBeltDialogAutoProps {
  onAdd?: (belt: Belt) => void;
  onUpdate?: (belt: Belt) => void;
  belt?: Belt;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * NewBeltDialogAuto
 * - Same fields and casing as original component
 * - Automatic calculations:
 *   - fabric.consumedMeters
 *   - compound.coverCompoundConsumed
 *   - compound.skimCompoundConsumed
 *   - compound.coverBatches
 *   - compound.skimBatches
 *   - compound.randomValue
 *   - process.* dates inferred from dispatch_date when provided
 */
export default function NewBeltDialogAuto({
  onAdd,
  onUpdate,
  belt,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: NewBeltDialogAutoProps) {
  const isEditMode = !!belt;
  const { register, handleSubmit, setValue, watch, reset } = useForm<Belt>({
    defaultValues: belt || {},
  });

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [activeTab, setActiveTab] = useState('step1');

  // State for displaying calculation intermediate values
  const [calcValues, setCalcValues] = useState({
    numberOfPlies: 0,
    beltWidthM: undefined as number | undefined,
    coverThicknessMm: 0,
    coverSG: 0,
    skimThicknessMm: 0,
    skimSG: 0,
  });

  // watches
  const rating = watch('rating');
  const beltLengthM = watch('beltLengthM');
  const beltWidthMm = watch('beltWidthMm');
  const beltWidthM = beltWidthMm ? beltWidthMm / 1000 : undefined;
  const topCoverMm = watch('topCoverMm');
  const bottomCoverMm = watch('bottomCoverMm');
  const compoundCoverType = watch('compound.coverCompoundType') as CompoundType | undefined;
  const compoundSkimType = watch('compound.skimCompoundType') as CompoundType | undefined;
  const entryDispatchDate = watch('process.dispatchDate');
  const calendaringDate = watch('process.calendaringDate');
  const breakerPly = watch('breakerPly');

  // populate form when editing or opening
  useEffect(() => {
    if (belt && open) {
      reset(belt);
      setActiveTab('step1');
    } else if (!belt && open) {
      reset();
      setActiveTab('step1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [belt, open]);

  // set fabric rating autofill (same as original)
  useEffect(() => {
    if (rating) {
      const fabricData = FABRIC_LOOKUP.find((f) => f.rating === rating);
      if (fabricData) {
        setValue('fabric.rating', rating);
        setValue('fabric.strength', fabricData.strength);
      }
    }
  }, [rating, setValue]);

  // Derived values effect — compute and set automatic fields whenever inputs change
  useEffect(() => {
    // number_of_plies from rating
    const number_of_plies = parseNumberOfPliesFromRating(rating);

    // beltWidth in meters (convert from mm stored value)
    const beltWidthM = beltWidthMm ? beltWidthMm / 1000 : undefined;

    // Cover thickness = top + bottom (mm)
    const coverThickness = (topCoverMm || 0) + (bottomCoverMm || 0);

    // Update display values for calculations
    setCalcValues((prev) => ({
      ...prev,
      numberOfPlies: number_of_plies || 0,
      beltWidthM: beltWidthM,
      coverThicknessMm: coverThickness,
    }));

    // 1) fabric.consumedMeters
    const fabricConsumed = fabric_consumed(beltLengthM, number_of_plies);
    setValue(
      'fabric.consumedMeters',
      Number.isFinite(fabricConsumed) ? +fabricConsumed.toFixed(3) : undefined
    );

    // 2) specific gravities - use 1.5 as per document (Step 3: Compound Tracking)
    const coverSG = 1.5;
    const skimSG = 1.5;

    // Get fabric strength from rating for skim thickness calculation
    const fabricStrength = rating
      ? FABRIC_LOOKUP.find((f) => f.rating === rating)?.strength
      : undefined;

    // 3) cover_weight_kg
    const coverKg = cover_weight_kg(topCoverMm, bottomCoverMm, coverSG, beltWidthM, beltLengthM);
    setValue(
      'compound.coverCompoundConsumed',
      Number.isFinite(coverKg) ? +coverKg.toFixed(3) : undefined
    );

    // 4) skim_weight_kg - use fabric strength to get skim thickness per ply
    const skimThicknessPerPly = skim_thickness_from_strength(fabricStrength);
    const totalSkimThickness = skimThicknessPerPly * number_of_plies;
    const skimKg = skim_weight_kg(
      skimThicknessPerPly,
      number_of_plies,
      skimSG,
      beltWidthM,
      beltLengthM
    );
    setValue(
      'compound.skimCompoundConsumed',
      Number.isFinite(skimKg) ? +skimKg.toFixed(3) : undefined
    );

    // Update skim calculation values for display
    setCalcValues((prev) => ({
      ...prev,
      coverSG: coverSG,
      skimSG: skimSG,
      skimThicknessMm: totalSkimThickness,
    }));

    // 5) batches (not part of Belt type, skipping)
    // const coverB = cover_batches(coverKg);
    // const skimB = skim_batches(skimKg, compoundSkimType);

    // 6) random value (not part of Belt type, skipping)
    // 7) machine breakdown next failure (not part of Belt type, skipping)

    // 8) process dates from dispatch_date (reverse timeline)
    if (entryDispatchDate) {
      const pd = process_dates_from_dispatch(entryDispatchDate);
      // set each process.* field only if defined
      if (pd.packaging_date) setValue('process.packagingDate', pd.packaging_date);
      if (pd.pdi_date) setValue('process.pidDate', pd.pdi_date); // PDI
      if (pd.internal_inspection_date)
        setValue('process.inspectionDate', pd.internal_inspection_date);
      if (pd.curing_date) setValue('process.curingDate', pd.curing_date);
      if (pd.green_belt_date) setValue('process.greenBeltDate', pd.green_belt_date);
      if (pd.calendaring_date) setValue('process.calendaringDate', pd.calendaring_date);

      // 9) compound produced-on dates: use the compound date from process dates (D - 26 to D - 13)
      if (pd.compound_date) {
        setValue('compound.coverCompoundProducedOn', pd.compound_date);
        setValue('compound.skimCompoundProducedOn', pd.compound_date);
      }
    }
  }, [
    rating,
    beltLengthM,
    beltWidthMm,
    topCoverMm,
    bottomCoverMm,
    compoundCoverType,
    compoundSkimType,
    entryDispatchDate,
    calendaringDate,
    setValue,
  ]);

  const onSubmit = (data: Belt) => {
    const entryType: 'Manual' | 'Auto' = 'Auto';

    if (isEditMode && belt) {
      const updatedBelt: Belt = {
        ...belt,
        ...data,
        id: belt.id,
        createdAt: belt.createdAt,
        status: data.status || belt.status,
        entryType,
        compound: data.compound ? { ...data.compound } : belt.compound,
      };
      onUpdate?.(updatedBelt);
    } else {
      const newBelt: Belt = {
        ...data,
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `belt-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: data.status || 'In Production',
        entryType,
        compound: data.compound ? { ...data.compound } : undefined,
      };
      onAdd?.(newBelt);
    }
    reset();
    setOpen(false);
    setActiveTab('step1');
  };

  const handleNext = () => {
    if (activeTab === 'step1') setActiveTab('step2');
    else if (activeTab === 'step2') setActiveTab('step3');
  };

  const handlePrevious = () => {
    if (activeTab === 'step2') setActiveTab('step1');
    else if (activeTab === 'step3') setActiveTab('step2');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && !trigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Belt (Auto)
          </Button>
        </DialogTrigger>
      )}
      {trigger && !isEditMode && <div onClick={() => setOpen(true)}>{trigger}</div>}
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {isEditMode ? 'Edit Belt - Auto Calculated' : 'Create New Belt - Auto Calculated'}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 pb-6">
          <div className="space-y-6 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 gap-2 mb-6 h-auto">
                <TabsTrigger
                  value="step1"
                  className="text-sm px-3 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="hidden sm:inline">Specifications</span>
                  <span className="sm:hidden">Specs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="step2"
                  className="text-sm px-3 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="hidden sm:inline">Fabric & Compound</span>
                  <span className="sm:hidden">Materials</span>
                </TabsTrigger>
                <TabsTrigger
                  value="step3"
                  className="text-sm px-3 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Dates
                </TabsTrigger>
              </TabsList>

              {/* Step 1 */}
              <TabsContent value="step1" className="space-y-6 mt-0">
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
                        Belt Width (m)
                      </Label>
                      <Input
                        id="beltWidth"
                        type="number"
                        step="0.001"
                        value={beltWidthM ?? ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          // Convert meters to millimeters for storage
                          setValue('beltWidthMm', isNaN(value) ? undefined : value * 1000);
                        }}
                        className="h-10"
                        placeholder="e.g. 1.2"
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
                  <Button type="button" onClick={handleNext} size="lg">
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 2 */}
              <TabsContent value="step2" className="space-y-6 mt-0">
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
                    onClick={handlePrevious}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button type="button" onClick={handleNext} size="lg" className="w-full sm:w-auto">
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 3 */}
              <TabsContent value="step3" className="space-y-6 mt-0">
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
                      Cover Compound Produced On (auto) — D − 26 to D − 13
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
                      Auto-calculated from dispatch date (random within -26 to -13 days)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skimCompoundProducedOn" className="text-sm font-medium">
                      Skim Compound Produced On (auto) — D − 26 to D − 13
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
                      Auto-calculated from dispatch date (random within -26 to -13 days)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {isEditMode ? 'Update Belt' : 'Save Belt'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
