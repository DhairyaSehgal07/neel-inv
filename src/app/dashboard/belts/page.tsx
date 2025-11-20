'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const Page = () => {
  const router = useRouter();
  const handleAddBelt = () => {
    router.push('/dashboard/belts/create');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Belts</h1>

        <Button onClick={handleAddBelt}>Add Belt</Button>
      </div>
    </div>
  );
};

export default Page;
