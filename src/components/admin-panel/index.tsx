'use client';

import { useState } from 'react';
import { useUsersQuery } from '@/services/api/queries/users/clientUsers';
import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateUserDialog from './create-user-dialog';
import EditUserDialog from './edit-dialog';
import DeleteUserDialog from './delete-dialog';
import { AdminPanelActionsContext } from './admin-actions-context';
import { User } from '@/types/user';

export default function AdminPanel() {
  const { data, isLoading, error } = useUsersQuery();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">User Management</h2>
        </div>
        <div className="text-destructive">Error loading users: {error.message}</div>
      </div>
    );
  }

  return (
    <AdminPanelActionsContext.Provider
      value={{
        onEditUser: (u) => setEditingUser(u),
        onDeleteUser: (u) => setDeletingUser(u),
      }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">User Management</h2>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>

        <DataTable columns={columns} data={data || []} getRowId={(row) => row._id} />

        <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        <EditUserDialog
          open={editingUser !== null}
          onOpenChange={(open) => {
            if (!open) setEditingUser(null);
          }}
          user={editingUser ?? undefined}
        />
        <DeleteUserDialog
          open={deletingUser !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingUser(null);
          }}
          user={deletingUser ?? undefined}
        />
      </div>
    </AdminPanelActionsContext.Provider>
  );
}
