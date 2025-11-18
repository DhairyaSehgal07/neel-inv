'use client';

import { useForm } from 'react-hook-form';
import { Belt, FABRIC_LOOKUP, FabricType, COMPOUNDS, CompoundType } from '@/lib/data';
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
import { useState, useEffect } from 'react';
import { parseDateString, formatDateString } from '@/lib/date-utils';
import { EdgeType } from '@/lib/data';

interface NewBeltDialogProps {
  onAdd?: (belt: Belt) => void;
  onUpdate?: (belt: Belt) => void;
  belt?: Belt;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function NewBeltDialog({
  onAdd,
  onUpdate,
  belt,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: NewBeltDialogProps) {
  const isEditMode = !!belt;
  const { register, handleSubmit, setValue, watch, reset } = useForm<Belt>({
    defaultValues: belt || {},
  });
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [activeTab, setActiveTab] = useState('step1');

  // Populate form when editing
  useEffect(() => {
    if (belt && open) {
      // Reset form with belt data
      reset(belt);
      setActiveTab('step1');
    } else if (!belt && open) {
      // Reset form for new belt
      reset();
      setActiveTab('step1');
    }
  }, [belt, open, reset]);

  const rating = watch('rating');
  const breakerPly = watch('breakerPly');
  const calendaringDate = watch('process.calendaringDate');
  const beltWidthMm = watch('beltWidthMm');

  // Auto-fill fabric strength when rating is selected
  useEffect(() => {
    if (rating) {
      const fabricData = FABRIC_LOOKUP.find((f) => f.rating === rating);
      if (fabricData) {
        setValue('fabric.rating', rating);
        setValue('fabric.strength', fabricData.strength);
      }
    }
  }, [rating, setValue]);

  const onSubmit = (data: Belt) => {
    const entryType: 'Manual' | 'Auto' = 'Manual';

    if (isEditMode && belt) {
      // Update existing belt
      const updatedBelt: Belt = {
        ...belt,
        ...data,
        id: belt.id,
        createdAt: belt.createdAt,
        status: data.status || belt.status,
        entryType: entryType,
        compound: data.compound ? { ...data.compound } : belt.compound,
      };
      onUpdate?.(updatedBelt);
    } else {
      // Create new belt
      const newBelt: Belt = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: data.status || 'In Production',
        entryType: entryType,
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
            New Belt
          </Button>
        </DialogTrigger>
      )}
      {trigger && !isEditMode && <div onClick={() => setOpen(true)}>{trigger}</div>}
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {isEditMode ? 'Edit Belt - Reverse Tracking' : 'Create New Belt - Reverse Tracking'}
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

              {/* Step 1: Belt Specifications */}
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
                      {rating && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Strength: {FABRIC_LOOKUP.find((f) => f.rating === rating)?.strength}
                        </p>
                      )}
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
                  <Button type="button" onClick={handleNext} size="lg">
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 2: Fabric & Compound */}
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
                      Fabric Consumed (meters)
                    </Label>
                    <Input
                      id="fabricConsumed"
                      type="number"
                      step="0.1"
                      {...register('fabric.consumedMeters', { valueAsNumber: true })}
                      className="h-10"
                      placeholder="e.g. 100.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Enter the amount of fabric consumed in meters
                    </p>
                  </div>

                  {rating && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                      <p className="text-sm font-medium">Selected Fabric Details:</p>
                      <p className="text-sm text-muted-foreground">Rating: {rating}</p>
                      <p className="text-sm text-muted-foreground">
                        Strength: {FABRIC_LOOKUP.find((f) => f.rating === rating)?.strength}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-base font-semibold">Compound Information</h3>

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

                  {/* DISABLED: Manual mode only for now - keeping for future auto mode use */}
                  {/* {compoundId && (
                    <div className="bg-muted/50 border rounded-lg p-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Compound ID</p>
                      <p className="text-sm font-mono font-semibold">{compoundId}</p>
                      <p className="text-xs text-muted-foreground">Auto-generated from cover compound type and produced on date</p>
                    </div>
                  )} */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coverCompoundConsumed" className="text-sm font-medium">
                        Cover Compound Consumed
                      </Label>
                      <Input
                        id="coverCompoundConsumed"
                        type="number"
                        step="0.1"
                        {...register('compound.coverCompoundConsumed', { valueAsNumber: true })}
                        className="h-10"
                        placeholder="Enter amount consumed in kg"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Enter the amount of cover compound consumed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skimCompoundConsumed" className="text-sm font-medium">
                        Skim Compound Consumed
                      </Label>
                      <Input
                        id="skimCompoundConsumed"
                        type="number"
                        step="0.1"
                        {...register('compound.skimCompoundConsumed', { valueAsNumber: true })}
                        className="h-10"
                        placeholder="Enter amount consumed in kg"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Enter the amount of skim compound consumed
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coverCompoundProducedOn" className="text-sm font-medium">
                        Cover Compound Produced On
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
                        Date when cover compound was produced
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skimCompoundProducedOn" className="text-sm font-medium">
                        Skim Compound Produced On
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
                        Date when skim compound was produced
                      </p>
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

              {/* Step 3: Process Dates */}
              <TabsContent value="step3" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Production Timeline</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      💡 Enter dates for all completed stages manually.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calendaringDate" className="text-sm font-medium">
                      Calendaring Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DatePicker
                        id="calendaringDate"
                        date={calendaringDate ? parseDateString(calendaringDate) : undefined}
                        onDateChange={(date) => {
                          const dateStr = date ? formatDateString(date) : undefined;
                          setValue('process.calendaringDate', dateStr, { shouldValidate: true });
                        }}
                        placeholder="Select calendaring date"
                      />
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
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Date when fabric and rubber were combined
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>
                  <div className="space-y-2">{/* Empty space for alignment */}</div>
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
