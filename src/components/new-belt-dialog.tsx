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
import { calculateBackwardDates, parseDateString, formatDateString } from '@/lib/date-utils';
import { EdgeType, TrackingMode } from '@/lib/data';

export default function NewBeltDialog({ onAdd }: { onAdd: (belt: Belt) => void }) {
  const { register, handleSubmit, setValue, watch, reset } = useForm<Belt>();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('step1');

  const rating = watch('rating');
  const calendaringDate = watch('process.calendaringDate');
  const status = watch('status');
  const trackingMode = watch('trackingMode') as TrackingMode | undefined;
  const breakerPly = watch('breakerPly');
  const greenBeltDate = watch('process.greenBeltDate');
  const curingDate = watch('process.curingDate');
  const inspectionDate = watch('process.inspectionDate');
  const compoundProducedOn = watch('compound.producedOn');
  const compoundUsedOn = watch('compound.usedOn');
  const compoundType = watch('compound.type');

  // Generate compoundId when both type and producedOn date are available
  const generateCompoundId = (type?: CompoundType, date?: string): string | undefined => {
    if (type && date) {
      // Format: M-24_2025-11-03
      return `${type}_${date}`;
    }
    return undefined;
  };

  const compoundId = generateCompoundId(compoundType, compoundProducedOn);

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

  // Auto-calculate dates based on mode and latest stage
  // Only calculate in Auto Mode for In Production belts
  useEffect(() => {
    if (status !== 'In Production' || trackingMode !== 'auto') {
      return; // Manual mode or dispatched - no auto calculation
    }

    // Determine latest stage entered
    let latestStage: 'calendaringDate' | 'greenBeltDate' | 'curingDate' | 'inspectionDate' | null = null;
    let latestDate: string | null = null;

    if (inspectionDate) {
      latestStage = 'inspectionDate';
      latestDate = inspectionDate;
    } else if (curingDate) {
      latestStage = 'curingDate';
      latestDate = curingDate;
    } else if (greenBeltDate) {
      latestStage = 'greenBeltDate';
      latestDate = greenBeltDate;
    } else if (calendaringDate) {
      latestStage = 'calendaringDate';
      latestDate = calendaringDate;
    }

    // Calculate backward only (never forward in Auto Mode)
    if (latestStage && latestDate) {
      const calculated = calculateBackwardDates(latestStage, latestDate);
      if (calculated.calendaringDate && !calendaringDate) {
        setValue('process.calendaringDate', calculated.calendaringDate);
      }
      if (calculated.greenBeltDate && !greenBeltDate) {
        setValue('process.greenBeltDate', calculated.greenBeltDate);
      }
      if (calculated.compoundProducedOn && !compoundProducedOn) {
        setValue('compound.producedOn', calculated.compoundProducedOn);
      }
      if (calculated.compoundUsedOn && !compoundUsedOn) {
        setValue('compound.usedOn', calculated.compoundUsedOn);
      }
      if (calculated.curingDate && !curingDate && latestStage !== 'curingDate') {
        setValue('process.curingDate', calculated.curingDate);
      }
      if (calculated.inspectionDate && !inspectionDate && latestStage !== 'inspectionDate') {
        setValue('process.inspectionDate', calculated.inspectionDate);
      }
    }
  }, [status, trackingMode, calendaringDate, greenBeltDate, curingDate, inspectionDate, compoundProducedOn, compoundUsedOn, setValue]);

  const onSubmit = (data: Belt) => {
    // Generate compoundId if not already set
    const finalCompoundId = data.compound?.compoundId || generateCompoundId(data.compound?.type, data.compound?.producedOn);

    const newBelt: Belt = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: data.status || 'In Production',
      compound: data.compound ? {
        ...data.compound,
        compoundId: finalCompoundId,
      } : undefined,
    };
    onAdd(newBelt);
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
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Belt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Create New Belt - Reverse Tracking
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
                          className="min-h-[80px]"
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
                          date={watch('orderDate') ? parseDateString(watch('orderDate')!) : undefined}
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
                            setValue(
                              'deliveryDeadline',
                              date ? formatDateString(date) : undefined
                            )
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
                      const newStatus = val as 'Dispatched' | 'In Production';
                      setValue('status', newStatus);
                      // Set default tracking mode for In Production
                      if (newStatus === 'In Production' && !trackingMode) {
                        setValue('trackingMode', 'auto');
                      }
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

                  <div className="space-y-2">
                    <Label htmlFor="compoundType" className="text-sm font-medium">
                      Compound Type
                    </Label>
                    <Select onValueChange={(val) => setValue('compound.type', val as CompoundType)}>
                      <SelectTrigger id="compoundType" className="h-10">
                        <SelectValue placeholder="Select compound type" />
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

                  {compoundId && (
                    <div className="bg-muted/50 border rounded-lg p-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Compound ID</p>
                      <p className="text-sm font-mono font-semibold">{compoundId}</p>
                      <p className="text-xs text-muted-foreground">Auto-generated from compound type and production date</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="compoundLotSize" className="text-sm font-medium">
                      Compound Lot Size / Batch Weight (Optional)
                    </Label>
                    <Input
                      id="compoundLotSize"
                      type="number"
                      step="0.1"
                      {...register('compound.lotSize', { valueAsNumber: true })}
                      className="h-10"
                      placeholder="Enter batch weight"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Enter the batch weight for this compound lot
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="compoundProducedOn" className="text-sm font-medium">
                        Compound Produced On
                      </Label>
                      <DatePicker
                        id="compoundProducedOn"
                        date={
                          watch('compound.producedOn')
                            ? parseDateString(watch('compound.producedOn')!)
                            : undefined
                        }
                        onDateChange={(date) =>
                          setValue(
                            'compound.producedOn',
                            date ? formatDateString(date) : undefined
                          )
                        }
                        placeholder="Select production date"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Typically 7 days before calendaring
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compoundUsedOn" className="text-sm font-medium">
                        Compound Used On
                      </Label>
                      <DatePicker
                        id="compoundUsedOn"
                        date={
                          watch('compound.usedOn') ? parseDateString(watch('compound.usedOn')!) : undefined
                        }
                        onDateChange={(date) =>
                          setValue(
                            'compound.usedOn',
                            date ? formatDateString(date) : undefined
                          )
                        }
                        placeholder="Select usage date"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Same as calendaring date
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
                {status === 'In Production' && (
                  <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Tracking Mode</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Choose how dates are calculated for this belt
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm ${trackingMode === 'auto' ? 'font-semibold' : 'text-muted-foreground'}`}>
                          Auto
                        </span>
                        <Switch
                          checked={trackingMode === 'manual'}
                          onCheckedChange={(checked) => {
                            setValue('trackingMode', checked ? 'manual' : 'auto');
                          }}
                        />
                        <span className={`text-sm ${trackingMode === 'manual' ? 'font-semibold' : 'text-muted-foreground'}`}>
                          Manual
                        </span>
                      </div>
                    </div>
                    <div className="bg-background rounded p-3">
                      <p className="text-xs text-muted-foreground">
                        {trackingMode === 'auto' ? (
                          <>🔵 <strong>Auto Mode:</strong> Enter the latest completed stage date. System will calculate backward only (no future dates).</>
                        ) : (
                          <>🟡 <strong>Manual Mode:</strong> Enter all dates manually. No automatic calculations will be performed.</>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Production Timeline</h3>
                  {status === 'In Production' && trackingMode === 'auto' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        💡 Enter the latest completed stage date. The system will automatically calculate backward dates only. Dates skip Sundays and holidays.
                      </p>
                    </div>
                  )}
                  {status === 'Dispatched' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        💡 Enter dates for all completed stages. Dates automatically skip Sundays and holidays.
                      </p>
                    </div>
                  )}

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
                        setValue(
                          'process.greenBeltDate',
                          date ? formatDateString(date) : undefined
                        )
                      }
                      placeholder="Select green belt date"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {trackingMode === 'auto' ? 'Auto-calculated from calendaring' : 'Date when uncured belt was assembled'}
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
                        setValue(
                          'process.curingDate',
                          date ? formatDateString(date) : undefined
                        )
                      }
                      placeholder="Select curing date"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {trackingMode === 'auto' ? 'Auto-calculated: +1 day from calendaring' : 'Date when belt was vulcanized'}
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
                      {trackingMode === 'auto' ? 'Auto-calculated: +4 days from calendaring' : 'Date of internal quality check'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inspectionMachine" className="text-sm font-medium">
                      Inspection Press#
                    </Label>
                    <Input
                      id="inspectionMachine"
                      {...register('process.inspectionMachine')}
                      placeholder="Enter inspection press number"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pidDate" className="text-sm font-medium">
                      PID Date
                    </Label>
                    <DatePicker
                      id="pidDate"
                      date={
                        watch('process.pidDate') ? parseDateString(watch('process.pidDate')!) : undefined
                      }
                      onDateChange={(date) =>
                        setValue(
                          'process.pidDate',
                          date ? formatDateString(date) : undefined
                        )
                      }
                      placeholder="Select PID date"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Third party quality check
                    </p>
                  </div>
                  <div className="space-y-2">
                    {/* Empty space for alignment */}
                  </div>

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
                        setValue(
                          'process.packagingDate',
                          date ? formatDateString(date) : undefined
                        )
                      }
                      placeholder="Select packaging date"
                    />
                  </div>
                  <div className="space-y-2">
                    {/* Empty space for alignment */}
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
                        setValue(
                          'process.dispatchDate',
                          date ? formatDateString(date) : undefined
                        )
                      }
                      placeholder="Select dispatch date"
                    />
                  </div>
                  <div className="space-y-2">
                    {/* Empty space for alignment */}
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
            Save Belt
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
