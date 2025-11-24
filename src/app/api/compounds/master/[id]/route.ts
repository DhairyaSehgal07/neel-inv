import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundMaster from '@/model/CompoundMaster';
import { ApiResponse } from '@/types/apiResponse';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import mongoose from 'mongoose';
import { roundTo2Decimals } from '@/lib/utils';

// GET /api/compounds/master/[id] - Get single compound master by ID
async function getCompoundMaster(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();

    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Validate MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid compound master ID:', id);
      const response: ApiResponse = {
        success: false,
        message: 'Invalid compound master ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const compound = await CompoundMaster.findById(id);

    if (!compound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound master not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Compound master fetched successfully',
      data: compound,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching compound master:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch compound master',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/compounds/master/[id] - Update compound master by ID
async function updateCompoundMaster(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();

    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const body = await request.json();

    // Validate MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid compound master ID:', id);
      const response: ApiResponse = {
        success: false,
        message: 'Invalid compound master ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate category if provided
    if (body.category && body.category !== 'skim' && body.category !== 'cover') {
      const response: ApiResponse = {
        success: false,
        message: 'Category must be either "skim" or "cover"',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate defaultWeightPerBatch if provided
    if (body.defaultWeightPerBatch !== undefined) {
      if (typeof body.defaultWeightPerBatch !== 'number' || body.defaultWeightPerBatch <= 0) {
        const response: ApiResponse = {
          success: false,
          message: 'defaultWeightPerBatch must be a positive number',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Check if compound master exists
    const existingCompound = await CompoundMaster.findById(id);
    if (!existingCompound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound master not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if compoundCode is being changed and if it already exists
    if (body.compoundCode && body.compoundCode !== existingCompound.compoundCode) {
      const compoundWithSameCode = await CompoundMaster.findOne({
        compoundCode: body.compoundCode,
        _id: { $ne: id },
      });
      if (compoundWithSameCode) {
        const response: ApiResponse = {
          success: false,
          message: 'Compound master with this code already exists',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Prepare update data with rounded defaultWeightPerBatch if provided
    const updateData = { ...body };
    if (body.defaultWeightPerBatch !== undefined) {
      updateData.defaultWeightPerBatch = roundTo2Decimals(body.defaultWeightPerBatch);
    }

    // Update compound master
    const updatedCompound = await CompoundMaster.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCompound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound master not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Compound master updated successfully',
      data: updatedCompound,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating compound master:', error);

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
      message: 'Failed to update compound master',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/compounds/master/[id] - Delete compound master by ID
async function deleteCompoundMaster(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();

    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Validate MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid compound master ID:', id);
      const response: ApiResponse = {
        success: false,
        message: 'Invalid compound master ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Hard delete (CompoundMaster doesn't have isActive field)
    const deletedCompound = await CompoundMaster.findByIdAndDelete(id);

    if (!deletedCompound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound master not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Compound master deleted successfully',
      data: deletedCompound,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting compound master:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete compound master',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Export with RBAC middleware
export const GET = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_MASTER_VIEW, getCompoundMaster);

export const PUT = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_MASTER_UPDATE, updateCompoundMaster);

export const DELETE = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_MASTER_DELETE, deleteCompoundMaster);
