// src/components/compound-types/compound-list.tsx

'use client';

import { useEffect, useState } from 'react';
import { fetchCompoundTypes, CompoundType } from '@/lib/api/compound-type';
import { DataTable } from './data-table';
import { columns } from './columns';
import EditCompoundDialog from './edit-dialog';
import { Button } from '@/components/ui/button';

export default function CompoundList() {
  const [data, setData] = useState<CompoundType[]>([]);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    async function load() {
      const list = await fetchCompoundTypes();
      setData(list);
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Compound Types</h2>
        <Button onClick={() => setOpenCreate(true)}>+ Add Compound</Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search by name..."
        filterKey="type"
        filterOptions={[
          { value: 'skim', label: 'Skim' },
          { value: 'cover', label: 'Cover' },
        ]}
        filterPlaceholder="Filter by type"
      />

      <EditCompoundDialog open={openCreate} onOpenChange={setOpenCreate} />
    </div>
  );
}
