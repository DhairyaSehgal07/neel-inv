import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import RawMaterial from '@/model/RawMaterial';
import { formatLocalDate } from '@/lib/helpers/compound-utils';

async function updateRawMaterial(
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
      const response: ApiResponse = {
        success: false,
        message: 'Invalid raw material ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body = await request.json();
    const { materialCode, date, rawMaterial } = body;

    // Check if raw material exists
    const existing = await RawMaterial.findById(id);
    if (!existing) {
      const response: ApiResponse = {
        success: false,
        message: 'Raw material not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Format date to YYYY-MM-DD string if provided
    let formattedDate = existing.date;
    if (date !== undefined) {
      // Handle Date object, ISO string, or YYYY-MM-DD string
      if (date instanceof Date) {
        formattedDate = formatLocalDate(date);
      } else if (typeof date === 'string') {
        // If it's already in YYYY-MM-DD format, use it directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          formattedDate = date;
        } else {
          // Otherwise, parse as ISO string and format
          formattedDate = formatLocalDate(new Date(date));
        }
      } else {
        formattedDate = formatLocalDate(new Date(date));
      }
    }

    // Check if material code and date combination already exists (excluding current record)
    if (materialCode || date) {
      const checkCode = materialCode?.trim() || existing.materialCode;
      const checkDate = formattedDate;

      const duplicate = await RawMaterial.findOne({
        materialCode: checkCode,
        date: checkDate,
        _id: { $ne: id },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: 'Raw material with this code and date already exists',
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Partial<typeof existing> = {};
    if (materialCode !== undefined) updateData.materialCode = materialCode.trim();
    if (date !== undefined) updateData.date = formattedDate;
    if (rawMaterial !== undefined) updateData.rawMaterial = rawMaterial.trim();

    // Update raw material
    const updated = await RawMaterial.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      const response: ApiResponse = {
        success: false,
        message: 'Raw material not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Raw material updated successfully',
      data: updated,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating raw material:', error);

    // Handle duplicate key errors (MongoDB duplicate key error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'Raw material with this code and date already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update raw material',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

async function deleteRawMaterial(
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
      const response: ApiResponse = {
        success: false,
        message: 'Invalid raw material ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if raw material exists
    const existing = await RawMaterial.findById(id);
    if (!existing) {
      const response: ApiResponse = {
        success: false,
        message: 'Raw material not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Delete raw material
    await RawMaterial.findByIdAndDelete(id);

    const response: ApiResponse = {
      success: true,
      message: 'Raw material deleted successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting raw material:', error);

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete raw material',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export const PUT = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.BELT_UPDATE, updateRawMaterial);

export const DELETE = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.BELT_DELETE, deleteRawMaterial);
