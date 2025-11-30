import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/model/Rating';
import { ApiResponse } from '@/types/apiResponse';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import mongoose from 'mongoose';

// GET /api/ratings/[id] - Get single rating by ID
async function getRating(
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
      console.error('Invalid rating ID:', id);
      const response: ApiResponse = {
        success: false,
        message: 'Invalid rating ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const rating = await Rating.findById(id);

    if (!rating) {
      const response: ApiResponse = {
        success: false,
        message: 'Rating not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Rating fetched successfully',
      data: rating,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching rating:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch rating',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/ratings/[id] - Update rating by ID
async function updateRating(
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
      console.error('Invalid rating ID:', id);
      const response: ApiResponse = {
        success: false,
        message: 'Invalid rating ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate strength if provided
    if (body.strength !== undefined) {
      if (typeof body.strength !== 'number' || body.strength <= 0) {
        const response: ApiResponse = {
          success: false,
          message: 'strength must be a positive number',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Check if rating exists
    const existingRating = await Rating.findById(id);
    if (!existingRating) {
      const response: ApiResponse = {
        success: false,
        message: 'Rating not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if rating value is being changed and if it already exists
    if (body.rating && body.rating !== existingRating.rating) {
      const ratingWithSameValue = await Rating.findOne({
        rating: body.rating,
        _id: { $ne: id },
      });
      if (ratingWithSameValue) {
        const response: ApiResponse = {
          success: false,
          message: 'Rating with this value already exists',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Update rating
    const updatedRating = await Rating.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedRating) {
      const response: ApiResponse = {
        success: false,
        message: 'Rating not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Rating updated successfully',
      data: updatedRating,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating rating:', error);

    // Handle duplicate key errors (MongoDB duplicate key error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'Rating with this value already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      message: 'Failed to update rating',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/ratings/[id] - Delete rating by ID
async function deleteRating(
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
      console.error('Invalid rating ID:', id);
      const response: ApiResponse = {
        success: false,
        message: 'Invalid rating ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Hard delete
    const deletedRating = await Rating.findByIdAndDelete(id);

    if (!deletedRating) {
      const response: ApiResponse = {
        success: false,
        message: 'Rating not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Rating deleted successfully',
      data: deletedRating,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting rating:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete rating',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Export with RBAC middleware
export const GET = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.RATING_VIEW, getRating);

export const PUT = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.RATING_UPDATE, updateRating);

export const DELETE = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) => withRBACParams(request, context.params, Permission.RATING_DELETE, deleteRating);
