'use client';

import { createContext, useContext } from 'react';
import { User } from '@/types/user';

export type AdminPanelActions = {
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
};

export const AdminPanelActionsContext = createContext<AdminPanelActions | null>(null);

export function useAdminPanelActions() {
  const ctx = useContext(AdminPanelActionsContext);
  if (!ctx) {
    throw new Error('useAdminPanelActions must be used within AdminPanelActionsContext.Provider');
  }
  return ctx;
}
