'use client';

import { useState } from 'react';
import { User } from '@/types/user';
import { useUpdateUserMutation } from '@/services/api/queries/users/clientUsers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Permission, PermissionGroups } from '@/lib/rbac/permissions';
import { Role } from '@/model/User';
import { Separator } from '@/components/ui/separator';

export default function EditUserDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}) {
  const dialogKey = user?._id || (open ? 'new' : 'closed');

  const [role, setRole] = useState<Role>(() => (user?.role as Role) || 'Worker');
  const [permissions, setPermissions] = useState<string[]>(() => user?.permissions || []);
  const [isActive, setIsActive] = useState(() => user?.isActive ?? true);

  const updateMutation = useUpdateUserMutation();

  const handlePermissionToggle = (permission: Permission) => {
    setPermissions((prev) =>
      prev.includes(permission as string)
        ? prev.filter((p) => p !== (permission as string))
        : [...prev, permission as string]
    );
  };

  const handleGroupToggle = (groupPermissions: readonly Permission[]) => {
    const allSelected = groupPermissions.every((p) => permissions.includes(p as string));
    if (allSelected) {
      // Deselect all in group
      setPermissions((prev) => prev.filter((p) => !groupPermissions.includes(p as Permission)));
    } else {
      // Select all in group
      setPermissions((prev) => {
        const newPerms = [...prev];
        groupPermissions.forEach((p) => {
          if (!newPerms.includes(p as string)) {
            newPerms.push(p as string);
          }
        });
        return newPerms;
      });
    }
  };

  async function handleSubmit() {
    if (!user) return;

    try {
      await updateMutation.mutateAsync({
        id: user._id,
        payload: {
          role,
          permissions,
          isActive,
        },
      });
      toast.success('User updated successfully');
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to update user: ${errorMessage}`);
    }
  }

  const isLoading = updateMutation.isPending;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
            <div>
              <Label>Role *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Operator">Operator</SelectItem>
                  <SelectItem value="Worker">Worker</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Admin users have all permissions by default
              </p>
            </div>

            {role !== 'Admin' && (
              <div>
                <Label>Permissions</Label>
                <div className="space-y-4 mt-2">
                  {Object.entries(PermissionGroups).map(([groupName, groupPermissions]) => (
                    <div key={groupName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">{groupName}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGroupToggle(groupPermissions)}
                          className="h-7 text-xs"
                        >
                          {groupPermissions.every((p) => permissions.includes(p as string))
                            ? 'Deselect All'
                            : 'Select All'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        {groupPermissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={permissions.includes(permission as string)}
                              onCheckedChange={() => handlePermissionToggle(permission)}
                            />
                            <Label
                              htmlFor={permission}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {permission.split(':')[1] || permission}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Account Status</Label>
                <p className="text-xs text-muted-foreground">
                  {isActive ? 'User can access the system' : 'User account is deactivated'}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
