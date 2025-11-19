import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CompoundTypeModel from '@/model/CompoundType';
import { ApiResponse } from '@/types/apiResponse';
import { withRBACParams } from '@/lib/rbac-params';
import { Permission } from '@/lib/permissions';
import mongoose from 'mongoose';

// GET /api/compounds/type/[id] - Get single compound type by ID
async function getCompoundType(
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
      console.error('Invalid compound type ID:', id);
      const response: ApiResponse = {
        success: false,
        message: 'Invalid compound type ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const compound = await CompoundTypeModel.findById(id);

    if (!compound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Compound type fetched successfully',
      data: compound,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching compound type:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch compound type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/compounds/type/[id] - Update compound type by ID
async function updateCompoundType(
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
      console.error('Invalid compound type ID:', id);
      const response: ApiResponse = {
        success: false,
        message: 'Invalid compound type ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate type if provided
    if (body.type && body.type !== 'skim' && body.type !== 'cover') {
      const response: ApiResponse = {
        success: false,
        message: 'Type must be either "skim" or "cover"',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if compound type exists
    const existingCompound = await CompoundTypeModel.findById(id);
    if (!existingCompound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if name is being changed and if it already exists
    if (body.name && body.name !== existingCompound.name) {
      const compoundWithSameName = await CompoundTypeModel.findOne({
        name: body.name,
        _id: { $ne: id },
      });
      if (compoundWithSameName) {
        const response: ApiResponse = {
          success: false,
          message: 'Compound type with this name already exists',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Update compound type
    const updatedCompound = await CompoundTypeModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedCompound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Compound type updated successfully',
      data: updatedCompound,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating compound type:', error);

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
      message: 'Failed to update compound type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/compounds/type/[id] - Delete compound type by ID
async function deleteCompoundType(
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
      console.error('Invalid compound type ID:', id);
      const response: ApiResponse = {
        success: false,
        message: 'Invalid compound type ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Soft delete by setting isActive to false (recommended approach)
    const deletedCompound = await CompoundTypeModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    // Alternatively, hard delete:
    // const deletedCompound = await CompoundTypeModel.findByIdAndDelete(id);

    if (!deletedCompound) {
      const response: ApiResponse = {
        success: false,
        message: 'Compound type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Compound type deleted successfully',
      data: deletedCompound,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting compound type:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete compound type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Export with RBAC middleware
export const GET = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_TYPE_VIEW, getCompoundType);

export const PUT = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_TYPE_UPDATE, updateCompoundType);

export const DELETE = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.COMPOUND_TYPE_DELETE, deleteCompoundType);
