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
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { calculateForwardDates } from '@/lib/date-utils';

export default function NewBeltDialog({ onAdd }: { onAdd: (belt: Belt) => void }) {
  const { register, handleSubmit, setValue, watch, reset } = useForm<Belt>();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('step1');

  const rating = watch('rating');
  const calendaringDate = watch('process.calendaringDate');

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

  // Auto-calculate dates when calendaring date is set
  useEffect(() => {
    if (calendaringDate) {
      const calculated = calculateForwardDates(calendaringDate);
      setValue('compound.producedOn', calculated.compoundProducedOn);
      setValue('compound.usedOn', calendaringDate);
      setValue('process.curingDate', calculated.curingDate);
      setValue('process.inspectionDate', calculated.inspectionDate);
      setValue('process.greenBeltDate', calendaringDate);
    }
  }, [calendaringDate, setValue]);

  const onSubmit = (data: Belt) => {
    const newBelt: Belt = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: data.status || 'In Production',
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
                          date={watch('orderDate') ? new Date(watch('orderDate')!) : undefined}
                          onDateChange={(date) =>
                            setValue('orderDate', date ? date.toISOString().split('T')[0] : undefined)
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
                              ? new Date(watch('deliveryDeadline')!)
                              : undefined
                          }
                          onDateChange={(date) =>
                            setValue(
                              'deliveryDeadline',
                              date ? date.toISOString().split('T')[0] : undefined
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
                    onValueChange={(val) =>
                      setValue('status', val as 'Dispatched' | 'In Production')
                    }
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="compoundProducedOn" className="text-sm font-medium">
                        Compound Produced On
                      </Label>
                      <DatePicker
                        id="compoundProducedOn"
                        date={
                          watch('compound.producedOn')
                            ? new Date(watch('compound.producedOn')!)
                            : undefined
                        }
                        onDateChange={(date) =>
                          setValue(
                            'compound.producedOn',
                            date ? date.toISOString().split('T')[0] : undefined
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
                          watch('compound.usedOn') ? new Date(watch('compound.usedOn')!) : undefined
                        }
                        onDateChange={(date) =>
                          setValue(
                            'compound.usedOn',
                            date ? date.toISOString().split('T')[0] : undefined
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
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Production Timeline</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      💡 Enter the calendaring date to auto-calculate dependent dates. Dates
                      automatically skip Sundays and holidays.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calendaringDate" className="text-sm font-medium">
                      Calendaring Date <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      id="calendaringDate"
                      date={calendaringDate ? new Date(calendaringDate) : undefined}
                      onDateChange={(date) => {
                        const dateStr = date ? date.toISOString().split('T')[0] : undefined;
                        setValue('process.calendaringDate', dateStr, { shouldValidate: true });
                      }}
                      placeholder="Select calendaring date"
                    />
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
                          ? new Date(watch('process.greenBeltDate')!)
                          : undefined
                      }
                      onDateChange={(date) =>
                        setValue(
                          'process.greenBeltDate',
                          date ? date.toISOString().split('T')[0] : undefined
                        )
                      }
                      placeholder="Select green belt date"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Auto-filled from calendaring date
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="curingDate" className="text-sm font-medium">
                      Curing (Press) Date
                    </Label>
                    <DatePicker
                      id="curingDate"
                      date={
                        watch('process.curingDate')
                          ? new Date(watch('process.curingDate')!)
                          : undefined
                      }
                      onDateChange={(date) =>
                        setValue(
                          'process.curingDate',
                          date ? date.toISOString().split('T')[0] : undefined
                        )
                      }
                      placeholder="Select curing date"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Auto-calculated: +1 day from calendaring
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inspectionDate" className="text-sm font-medium">
                      Inspection Date
                    </Label>
                    <DatePicker
                      id="inspectionDate"
                      date={
                        watch('process.inspectionDate')
                          ? new Date(watch('process.inspectionDate')!)
                          : undefined
                      }
                      onDateChange={(date) =>
                        setValue(
                          'process.inspectionDate',
                          date ? date.toISOString().split('T')[0] : undefined
                        )
                      }
                      placeholder="Select inspection date"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Auto-calculated: +4 days from calendaring
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pidDate" className="text-sm font-medium">
                      PID Date
                    </Label>
                    <DatePicker
                      id="pidDate"
                      date={
                        watch('process.pidDate') ? new Date(watch('process.pidDate')!) : undefined
                      }
                      onDateChange={(date) =>
                        setValue(
                          'process.pidDate',
                          date ? date.toISOString().split('T')[0] : undefined
                        )
                      }
                      placeholder="Select PID date"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Third party quality check
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packagingDate" className="text-sm font-medium">
                      Packaging Date
                    </Label>
                    <DatePicker
                      id="packagingDate"
                      date={
                        watch('process.packagingDate')
                          ? new Date(watch('process.packagingDate')!)
                          : undefined
                      }
                      onDateChange={(date) =>
                        setValue(
                          'process.packagingDate',
                          date ? date.toISOString().split('T')[0] : undefined
                        )
                      }
                      placeholder="Select packaging date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dispatchDate" className="text-sm font-medium">
                      Dispatch Date
                    </Label>
                    <DatePicker
                      id="dispatchDate"
                      date={
                        watch('process.dispatchDate')
                          ? new Date(watch('process.dispatchDate')!)
                          : undefined
                      }
                      onDateChange={(date) =>
                        setValue(
                          'process.dispatchDate',
                          date ? date.toISOString().split('T')[0] : undefined
                        )
                      }
                      placeholder="Select dispatch date"
                    />
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
