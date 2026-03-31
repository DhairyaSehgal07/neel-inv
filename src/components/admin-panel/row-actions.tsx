'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { User } from '@/types/user';
import { useSession } from 'next-auth/react';
import { useAdminPanelActions } from './admin-actions-context';

export function DataTableRowActions({ row }: { row: Row<User> }) {
  const user = row.original;
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { onEditUser, onDeleteUser } = useAdminPanelActions();

  // Don't allow editing/deleting yourself
  const isCurrentUser = currentUserId === user._id;

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEditUser(user);
        }}
        disabled={isCurrentUser}
        title={isCurrentUser ? 'Cannot edit your own account' : 'Edit user'}
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="destructive"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteUser(user);
        }}
        disabled={isCurrentUser}
        title={isCurrentUser ? 'Cannot delete your own account' : 'Delete user'}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
