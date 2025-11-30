import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/model/Rating';
import { ApiResponse } from '@/types/apiResponse';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

// GET /api/ratings - Get all ratings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getRatings(_request: NextRequest) {
  try {
    await dbConnect();

    const ratings = await Rating.find().sort({ createdAt: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Ratings fetched successfully',
      data: ratings,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch ratings',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/ratings - Create new rating
async function createRating(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { rating, strength } = body;

    if (!rating || strength === undefined) {
      const response: ApiResponse = {
        success: false,
        message: 'rating and strength are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate strength
    if (typeof strength !== 'number' || strength <= 0) {
      const response: ApiResponse = {
        success: false,
        message: 'strength must be a positive number',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if rating with same value already exists
    const existingRating = await Rating.findOne({ rating });
    if (existingRating) {
      const response: ApiResponse = {
        success: false,
        message: 'Rating with this value already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const newRating = await Rating.create({
      rating,
      strength,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Rating created successfully',
      data: newRating,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating rating:', error);

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
      message: 'Failed to create rating',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Export with RBAC middleware
export const GET = (request: NextRequest) =>
  withRBAC(request, Permission.RATING_VIEW, getRatings);

export const POST = (request: NextRequest) =>
  withRBAC(request, Permission.RATING_CREATE, createRating);
