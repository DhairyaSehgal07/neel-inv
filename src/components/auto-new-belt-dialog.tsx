'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Belt, FABRIC_LOOKUP, CompoundType } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

import {
  parseNumberOfPliesFromRating,
  fabric_consumed,
  cover_weight_kg,
  skim_weight_kg,
  skim_thickness_from_strength,
  process_dates_from_dispatch,
  getSeparateCompoundDates,
} from '@/lib/calculations';
import { generateBeltCodes } from '@/lib/belt-code-utils';
import { SpecificationsStep } from './belt-form-steps/specifications-step';
import { FabricAndCompoundStep } from './belt-form-steps/fabric-and-compound-step';
import { DatesStep } from './belt-form-steps/dates-step';

interface NewBeltDialogAutoProps {
  onAdd?: (belt: Belt) => void;
  onUpdate?: (belt: Belt) => void;
  belt?: Belt;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  existingBelts?: Belt[];
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
  existingBelts = [],
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
  const topCoverMm = watch('topCoverMm');
  const bottomCoverMm = watch('bottomCoverMm');
  const compoundCoverType = watch('compound.coverCompoundType') as CompoundType | undefined;
  const compoundSkimType = watch('compound.skimCompoundType') as CompoundType | undefined;
  const entryDispatchDate = watch('process.dispatchDate');
  const calendaringDate = watch('process.calendaringDate');
  const coverCompoundProducedOn = watch('compound.coverCompoundProducedOn');
  const skimCompoundProducedOn = watch('compound.skimCompoundProducedOn');

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

      // 9) compound produced-on dates: ensure one compound per day policy
      if (pd.compound_date) {
        const separateDates = getSeparateCompoundDates(pd.compound_date);
        if (separateDates.cover_compound_date) {
          setValue('compound.coverCompoundProducedOn', separateDates.cover_compound_date);
        }
        if (separateDates.skim_compound_date) {
          setValue('compound.skimCompoundProducedOn', separateDates.skim_compound_date);
        }
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

  // Generate belt codes when dates and compound types are available
  useEffect(() => {
    // Only generate codes if we have at least one date and type combination
    const hasCover = coverCompoundProducedOn && compoundCoverType;
    const hasSkim = skimCompoundProducedOn && compoundSkimType;

    if (hasCover || hasSkim) {
      const codes = generateBeltCodes(
        coverCompoundProducedOn,
        compoundCoverType,
        skimCompoundProducedOn,
        compoundSkimType,
        existingBelts,
        belt?.id
      );
      if (codes.coverBeltCode) {
        setValue('compound.coverBeltCode', codes.coverBeltCode);
      } else if (hasCover) {
        // Clear code if date/type was removed
        setValue('compound.coverBeltCode', undefined);
      }
      if (codes.skimBeltCode) {
        setValue('compound.skimBeltCode', codes.skimBeltCode);
      } else if (hasSkim) {
        // Clear code if date/type was removed
        setValue('compound.skimBeltCode', undefined);
      }
    } else {
      // Clear codes if no dates/types are available
      setValue('compound.coverBeltCode', undefined);
      setValue('compound.skimBeltCode', undefined);
    }
  }, [
    coverCompoundProducedOn,
    compoundCoverType,
    skimCompoundProducedOn,
    compoundSkimType,
    existingBelts,
    belt?.id,
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
                <SpecificationsStep
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  onNext={handleNext}
                />
              </TabsContent>

              {/* Step 2 */}
              <TabsContent value="step2" className="space-y-6 mt-0">
                <FabricAndCompoundStep
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  calcValues={calcValues}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                />
              </TabsContent>

              {/* Step 3 */}
              <TabsContent value="step3" className="space-y-6 mt-0">
                <DatesStep
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  isEditMode={isEditMode}
                  onPrevious={handlePrevious}
                  onSubmit={handleSubmit(onSubmit)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
