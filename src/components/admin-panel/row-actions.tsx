'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EditUserDialog from './edit-dialog';
import DeleteUserDialog from './delete-dialog';
import { User } from '@/types/user';
import { useSession } from 'next-auth/react';

export function DataTableRowActions({ row }: { row: Row<User> }) {
  const user = row.original;
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // Don't allow editing/deleting yourself
  const isCurrentUser = currentUserId === user._id;

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpenEdit(true)}
        disabled={isCurrentUser}
        title={isCurrentUser ? 'Cannot edit your own account' : 'Edit user'}
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <Button
        variant="destructive"
        size="icon"
        onClick={() => setOpenDelete(true)}
        disabled={isCurrentUser}
        title={isCurrentUser ? 'Cannot delete your own account' : 'Delete user'}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <EditUserDialog open={openEdit} onOpenChange={setOpenEdit} user={user} />
      <DeleteUserDialog open={openDelete} onOpenChange={setOpenDelete} user={user} />
    </div>
  );
}
