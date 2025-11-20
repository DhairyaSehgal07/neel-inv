import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import { createBeltSchema } from '@/schemas/create-belt-schema';
import Belt from '@/model/Belt';

export async function createBeltHandler(req: Request) {
  try {
    await dbConnect();

    const json = await req.json();

    // Validate incoming data
    const parsed = createBeltSchema.safeParse(json);
    if (!parsed.success) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        data: parsed.error.flatten(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create the belt
    const belt = await Belt.create(parsed.data);

    const response: ApiResponse = {
      success: true,
      message: 'Belt created successfully',
      data: belt,
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating belt:', error);

    // Handle duplicate key errors (MongoDB duplicate key error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'Belt with this code already exists',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      message: 'Failed to create belt',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export const POST = (request: NextRequest) =>
  withRBAC(request, Permission.BELT_CREATE, createBeltHandler);
