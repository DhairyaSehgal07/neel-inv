import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

// GET /api/users - Get all users (Admin only)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getUsers(_request: NextRequest) {
  try {
    await dbConnect();

    // Get all users, exclude password field
    const users = await UserModel.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const response: ApiResponse = {
      success: true,
      message: 'Users fetched successfully',
      data: users,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch users',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Export with RBAC middleware - Only Admin can access
export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.USER_VIEW, getUsers);
