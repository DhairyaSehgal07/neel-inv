'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BeltSpecsStep } from './belt-specs-step';
import { OrderInfoStep } from './order-info-step';
import { FabricInfoStep } from './fabric-info-step';
import { CompoundInfoStep } from './compound-info-step';
import { ProductionDatesStep } from './production-dates-step';
import { ReviewAndSubmitStep } from './review-and-submit-step';
import { BeltFormData } from '@/types/belt';

// Main Form Component
export const GeneratedForm = () => {
  const [activeTab, setActiveTab] = useState('step1');

  const form = useForm<BeltFormData>({
    defaultValues: {
      beltNumber: '',
      rating: '',
      beltStrength: undefined,
      fabricType: '',
      topCover: undefined,
      bottomCover: undefined,
      beltLength: undefined,
      beltWidth: undefined,
      edge: '',
      carcass: undefined,
      coverGrade: '',
      breakerPly: false,
      breakerPlyRemarks: undefined,
      orderNumber: '',
      buyerName: '',
      orderDate: undefined,
      deliveryDeadline: undefined,
      status: '',
      fabricSupplier: '',
      rollNumber: '',
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
    if (activeTab === 'step1') setActiveTab('step2');
    else if (activeTab === 'step2') setActiveTab('step3');
    else if (activeTab === 'step3') setActiveTab('step4');
    else if (activeTab === 'step4') setActiveTab('step5');
    else if (activeTab === 'step5') setActiveTab('step6');
  };

  const handleBack = () => {
    if (activeTab === 'step2') setActiveTab('step1');
    else if (activeTab === 'step3') setActiveTab('step2');
    else if (activeTab === 'step4') setActiveTab('step3');
    else if (activeTab === 'step5') setActiveTab('step4');
    else if (activeTab === 'step6') setActiveTab('step5');
  };

  const handleSubmitSuccess = () => {
    setActiveTab('step1');
    form.reset();
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Create New Belt</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 gap-2 mb-6 h-auto">
              <TabsTrigger
                value="step1"
                className="text-sm px-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">Specifications</span>
                <span className="sm:hidden">Specs</span>
              </TabsTrigger>
              <TabsTrigger
                value="step2"
                className="text-sm px-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">Order Info</span>
                <span className="sm:hidden">Order</span>
              </TabsTrigger>
              <TabsTrigger
                value="step3"
                className="text-sm px-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">Fabric</span>
                <span className="sm:hidden">Fabric</span>
              </TabsTrigger>
              <TabsTrigger
                value="step4"
                className="text-sm px-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">Compound</span>
                <span className="sm:hidden">Compound</span>
              </TabsTrigger>
              <TabsTrigger
                value="step5"
                className="text-sm px-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">Production</span>
                <span className="sm:hidden">Dates</span>
              </TabsTrigger>
              <TabsTrigger
                value="step6"
                className="text-sm px-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">Review</span>
                <span className="sm:hidden">Review</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="step1" className="space-y-6 mt-0">
              <BeltSpecsStep form={form} onNext={handleNext} onBack={handleBack} />
            </TabsContent>

            <TabsContent value="step2" className="space-y-6 mt-0">
              <OrderInfoStep form={form} onNext={handleNext} onBack={handleBack} />
            </TabsContent>

            <TabsContent value="step3" className="space-y-6 mt-0">
              <FabricInfoStep form={form} onNext={handleNext} onBack={handleBack} />
            </TabsContent>

            <TabsContent value="step4" className="space-y-6 mt-0">
              <CompoundInfoStep form={form} onNext={handleNext} onBack={handleBack} />
            </TabsContent>

            <TabsContent value="step5" className="space-y-6 mt-0">
              <ProductionDatesStep form={form} onNext={handleNext} onBack={handleBack} />
            </TabsContent>

            <TabsContent value="step6" className="space-y-6 mt-0">
              <ReviewAndSubmitStep
                form={form}
                onBack={handleBack}
                onSuccess={handleSubmitSuccess}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
