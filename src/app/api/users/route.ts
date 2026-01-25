import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import bcrypt from 'bcryptjs';

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

// POST /api/users - Create new user (Admin only)
async function createUser(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, mobileNumber, password, role, permissions, isActive } = body;

    // Validate required fields
    if (!name || !mobileNumber || !password) {
      const response: ApiResponse = {
        success: false,
        message: 'Name, mobile number, and password are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate mobile number format (10-digit Indian mobile number)
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      const response: ApiResponse = {
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ mobileNumber });
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User with this mobile number already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await UserModel.create({
      name,
      mobileNumber,
      password: hashedPassword,
      role: role || 'Worker',
      permissions: permissions || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    // Return user without password
    const userResponse = await UserModel.findById(newUser._id).select('-password').lean();

    const response: ApiResponse = {
      success: true,
      message: 'User created successfully',
      data: userResponse,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create user',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Export with RBAC middleware - Only Admin can access
export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.USER_VIEW, getUsers);

export const POST = (request: NextRequest) =>
  withRBAC(request, Permission.USER_CREATE, createUser);
