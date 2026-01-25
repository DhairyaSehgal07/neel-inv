'use client';

import { useState } from 'react';
import { useCreateUserMutation } from '@/services/api/queries/users/clientUsers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Permission, PermissionGroups } from '@/lib/rbac/permissions';
import { Role } from '@/model/User';
import { Separator } from '@/components/ui/separator';

export default function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Worker');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateUserMutation();

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
    // Validate required fields
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!mobileNumber.trim()) {
      toast.error('Mobile number is required');
      return;
    }

    // Validate mobile number format (10-digit Indian mobile number)
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        password,
        role,
        permissions,
        isActive,
      });
      toast.success('User created successfully');
      // Reset form
      setName('');
      setMobileNumber('');
      setPassword('');
      setRole('Worker');
      setPermissions([]);
      setIsActive(true);
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to create user: ${errorMessage}`);
    }
  }

  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter user name"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="mobileNumber">Mobile Number *</Label>
            <Input
              id="mobileNumber"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must be a valid 10-digit Indian mobile number
            </p>
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 characters)"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Password must be at least 6 characters long
            </p>
          </div>

          <div>
            <Label>Role *</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)} disabled={isLoading}>
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
                        disabled={isLoading}
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
                            disabled={isLoading}
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
            <Switch checked={isActive} onCheckedChange={setIsActive} disabled={isLoading} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
