import { Role } from '@/model/User';
import { Permission } from '@/lib/rbac/permissions';

export interface User {
  _id: string;
  name: string;
  mobileNumber: string;
  role: Role;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
