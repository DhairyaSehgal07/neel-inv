'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BeltSpecsStep } from './belt-specs-step';
import { OrderInfoStep } from './order-info-step';
import { FabricInfoStep } from './fabric-info-step';
import { CompoundInfoStep } from './compound-info-step';
import { ProductionDatesStep } from './production-dates-step';
import type { BeltFormData } from './types';

// Main Form Component
export const GeneratedForm = () => {
  const [step, setStep] = useState(0);
  const totalSteps = 5;

  const form = useForm<BeltFormData>({
    defaultValues: {
      beltNumber: '',
      rating: '',
      fabricType: '',
      topCover: undefined,
      bottomCover: undefined,
      beltLength: undefined,
      beltWidth: undefined,
      edge: '',
      carcass: undefined,
      coverGrade: '',
      breakerPly: false,
      orderNumber: '',
      buyerName: '',
      orderDate: undefined,
      deliveryDeadline: undefined,
      status: '',
      fabricSupplier: '',
      rollNumber: '',
      numberOfPlies: undefined,
      fabricConsumed: undefined,
      coverCompoundType: '',
      skimCompoundType: '',
      coverCompoundConsumed: undefined,
      skimCompoundConsumed: undefined,
      dispatchDate: undefined,
      packagingDate: undefined,
      pdiDate: undefined,
      inspectionDate: undefined,
      inspectionStation: '',
      curingDate: undefined,
      pressStation: '',
      greenBeltDate: undefined,
      greenBeltStation: '',
      calendaringDate: undefined,
      calendaringStation: '',
      coverCompoundProducedOn: undefined,
      skimCompoundProducedOn: undefined,
    },
  });

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      console.log('Form Data:', form.getValues());
      toast.success('Form successfully submitted');
      setStep(0);
      form.reset();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const stepTitles = [
    'Belt Specifications',
    'Order Information',
    'Fabric Information',
    'Compound Information',
    'Production & Dispatch',
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-center">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                'w-4 h-4 rounded-full transition-all duration-300 ease-in-out',
                index <= step ? 'bg-primary' : 'bg-primary/30'
              )}
            />
            {index < totalSteps - 1 && (
              <div className={cn('w-8 h-0.5', index < step ? 'bg-primary' : 'bg-primary/30')} />
            )}
          </div>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{stepTitles[step]}</CardTitle>
          <CardDescription>
            Step {step + 1} of {totalSteps}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && <BeltSpecsStep form={form} onNext={handleNext} onBack={handleBack} />}
          {step === 1 && <OrderInfoStep form={form} onNext={handleNext} onBack={handleBack} />}
          {step === 2 && <FabricInfoStep form={form} onNext={handleNext} onBack={handleBack} />}
          {step === 3 && <CompoundInfoStep form={form} onNext={handleNext} onBack={handleBack} />}
          {step === 4 && (
            <ProductionDatesStep form={form} onNext={handleNext} onBack={handleBack} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
