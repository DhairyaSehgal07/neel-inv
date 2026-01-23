import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { ApiResponse } from '@/types/apiResponse';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import { ALL_PERMISSIONS } from '@/lib/rbac/permissions';
import { Role } from '@/model/User';

// PUT /api/users/[id] - Update user (role, permissions, isActive)
async function updateUser(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const body = await request.json();

    const { role, permissions, isActive } = body;

    // Validate role if provided
    if (role !== undefined) {
      const validRoles: Role[] = ['Admin', 'Manager', 'Supervisor', 'Worker', 'Operator'];
      if (!validRoles.includes(role)) {
        const response: ApiResponse = {
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate permissions if provided
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        const response: ApiResponse = {
          success: false,
          message: 'Permissions must be an array',
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Check if all permissions are valid
      const invalidPermissions = permissions.filter(
        (p) => !ALL_PERMISSIONS.includes(p)
      );
      if (invalidPermissions.length > 0) {
        const response: ApiResponse = {
          success: false,
          message: `Invalid permissions: ${invalidPermissions.join(', ')}`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      const response: ApiResponse = {
        success: false,
        message: 'isActive must be a boolean',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get current session to prevent self-modification of critical fields
    const { auth } = await import('@/auth');
    const session = await auth();
    const isCurrentUser = session?.user?.id === id;

    // Find user
    const user = await UserModel.findById(id);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Prevent users from modifying their own role or deactivating themselves
    if (isCurrentUser) {
      if (role !== undefined && role !== user.role) {
        const response: ApiResponse = {
          success: false,
          message: 'You cannot change your own role',
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (isActive !== undefined && isActive === false) {
        const response: ApiResponse = {
          success: false,
          message: 'You cannot deactivate your own account',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Build update object
    const updateData: {
      role?: Role;
      permissions?: string[];
      isActive?: boolean;
    } = {};

    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').lean();

    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update user',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user
async function deleteUser(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Get current session to prevent self-deletion
    const { auth } = await import('@/auth');
    const session = await auth();
    if (session?.user?.id === id) {
      const response: ApiResponse = {
        success: false,
        message: 'You cannot delete your own account',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Find and delete user
    const user = await UserModel.findById(id);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    await UserModel.findByIdAndDelete(id);

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete user',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Export with RBAC middleware - Only Admin can access
export const PUT = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.USER_UPDATE, updateUser);

export const DELETE = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.USER_DELETE, deleteUser);
