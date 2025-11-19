import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundTypeModel from '@/model/CompoundType';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/permissions';

// GET /api/compounds/type - Get all compound types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getCompoundTypes(_request: NextRequest) {
  try {
    await dbConnect();

    const compounds = await CompoundTypeModel.find({ isActive: true }).sort({ createdAt: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Compound types fetched successfully',
      data: compounds,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching compound types:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch compound types',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/compounds/type - Create new compound type
async function createCompoundType(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { name, type } = body;

    if (!name || !type) {
      const response: ApiResponse = {
        success: false,
        message: 'Name and type are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate type enum
    if (type !== 'skim' && type !== 'cover') {
      const response: ApiResponse = {
        success: false,
        message: 'Type must be either "skim" or "cover"',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if compound type with same name already exists
    const existingCompound = await CompoundTypeModel.findOne({ name });
    if (existingCompound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound type with this name already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const compound = await CompoundTypeModel.create({ name, type });

    const response: ApiResponse = {
      success: true,
      message: 'Compound type created successfully',
      data: compound,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating compound type:', error);

    // Handle duplicate key errors (MongoDB duplicate key error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound type with this name already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      message: 'Failed to create compound type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Export with RBAC middleware
export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_TYPE_VIEW, getCompoundTypes);

export const POST = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_TYPE_CREATE, createCompoundType);
