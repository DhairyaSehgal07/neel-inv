import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundMaster from '@/model/CompoundMaster';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { roundTo2Decimals } from '@/lib/utils';

// GET /api/compounds/type - Get all compound masters
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getCompoundMasters(_request: NextRequest) {
  try {
    await dbConnect();

    const compounds = await CompoundMaster.find().sort({ createdAt: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Compound masters fetched successfully',
      data: compounds,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching compound masters:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch compound masters',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/compounds/type - Create new compound master
async function createCompoundMaster(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { compoundCode, compoundName, category, defaultWeightPerBatch } = body;

    if (!compoundCode || !compoundName || !category || !defaultWeightPerBatch) {
      const response: ApiResponse = {
        success: false,
        message: 'compoundCode, compoundName, category, and defaultWeightPerBatch are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate category enum
    if (category !== 'skim' && category !== 'cover') {
      const response: ApiResponse = {
        success: false,
        message: 'Category must be either "skim" or "cover"',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate defaultWeightPerBatch
    if (typeof defaultWeightPerBatch !== 'number' || defaultWeightPerBatch <= 0) {
      const response: ApiResponse = {
        success: false,
        message: 'defaultWeightPerBatch must be a positive number',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if compound master with same code already exists
    const existingCompound = await CompoundMaster.findOne({ compoundCode });
    if (existingCompound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound master with this code already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const compound = await CompoundMaster.create({
      compoundCode,
      compoundName,
      category,
      defaultWeightPerBatch: roundTo2Decimals(defaultWeightPerBatch),
    });

    const response: ApiResponse = {
      success: true,
      message: 'Compound master created successfully',
      data: compound,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating compound master:', error);

    // Handle duplicate key errors (MongoDB duplicate key error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound master with this code already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      message: 'Failed to create compound master',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Export with RBAC middleware
export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_MASTER_VIEW, getCompoundMasters);

export const POST = (request: NextRequest) =>
  withRBAC(request, Permission.COMPOUND_MASTER_CREATE, createCompoundMaster);
