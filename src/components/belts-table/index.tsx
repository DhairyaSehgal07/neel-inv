'use client';

import { useState } from 'react';
import { useBeltsQuery } from '@/services/api/queries/belts/clientBelts';
import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { BeltsPDFReportButton } from './BeltsPDFReport';
import { MasterBeltReportButton } from './MasterBeltReport';
import { useSession } from 'next-auth/react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

export default function BeltsTable() {
  const router = useRouter();
  const { data, isLoading, error } = useBeltsQuery();
  const { data: session } = useSession();

  const role = session?.user?.role;
  const isAdmin = role === 'Admin';
  const isOperator = role === 'Operator';

  const [openModeDialog, setOpenModeDialog] = useState(false);

  const handleAddBelt = () => {
    if (isAdmin) {
      setOpenModeDialog(true);
      return;
    }

    if (isOperator) {
      router.push('/dashboard/belts/create');
      return;
    }

    // Any other role
    router.push('/dashboard/belts/create/auto');
  };

  const handleManual = () => {
    setOpenModeDialog(false);
    router.push('/dashboard/belts/create');
  };

  const handleAuto = () => {
    setOpenModeDialog(false);
    router.push('/dashboard/belts/create/auto');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Belts</h2>
          <Button onClick={handleAddBelt}>Add Belt</Button>
        </div>
        <div className="text-destructive">Error loading belts: {error.message}</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Belts</h2>
          <div className="flex gap-2">
            <BeltsPDFReportButton belts={data || []} />
            <MasterBeltReportButton belts={data || []} />
            <Button onClick={handleAddBelt}>Add Belt</Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data || []}
          searchKey="beltNumber"
          searchPlaceholder="Search by belt number, order number, buyer name, or rating..."
          filterKey="status"
          filterOptions={[
            { value: 'In Production', label: 'In Production' },
            { value: 'Dispatched', label: 'Dispatched' },
          ]}
          filterPlaceholder="Filter by status"
        />
      </div>

      {/* Admin Mode Selection Dialog */}
      <Dialog open={openModeDialog} onOpenChange={setOpenModeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Belt Creation Mode</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Card onClick={handleManual} className="cursor-pointer hover:border-primary transition">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold">Manual</h3>
                <p className="text-sm text-muted-foreground mt-2">Create belt manually</p>
              </CardContent>
            </Card>

            <Card onClick={handleAuto} className="cursor-pointer hover:border-primary transition">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold">Auto</h3>
                <p className="text-sm text-muted-foreground mt-2">Auto-generate belt</p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
