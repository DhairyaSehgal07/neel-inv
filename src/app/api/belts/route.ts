import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import { createBeltRequestSchema } from '@/schemas/create-belt-schema';
import Belt from '@/model/Belt';
import { BeltFormData } from '@/types/belt';
import { createBelt } from '@/lib/services/belt-service';


async function getBelts(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    const query: {
      status?: string;
      $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
    } = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { beltNumber: { $regex: search, $options: 'i' } },
        { 'fabric.rating': { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { buyerName: { $regex: search, $options: 'i' } },
      ];
    }

    const belts = await Belt.find(query).sort({ createdAt: -1 });
    // const convertedBelts = convertBeltDocumentsToBelts(belts);

    return NextResponse.json(
      {
        success: true,
        data: belts,
        count: belts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching belts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch belts';
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch belts',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function createBeltHandler(req: Request) {
  let session: mongoose.ClientSession | undefined;
  try {
    await dbConnect();

    const body = await req.json();

    // Validate incoming data
    const parsed = createBeltRequestSchema.safeParse(body);
    if (!parsed.success) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        data: parsed.error.flatten(),
      };
      return NextResponse.json(response, { status: 400 });
    }
    const formData: BeltFormData = body.formData;

    // Validate required fields
    if (!formData.beltNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Belt number is required',
        },
        { status: 400 }
      );
    }

    // Check if belt number already exists
    const existingBelt = await Belt.findOne({ beltNumber: formData.beltNumber });
    if (existingBelt) {
      return NextResponse.json(
        {
          success: false,
          message: 'Belt number already exists',
        },
        { status: 400 }
      );
    }

    // Validate compound consumption values
    const coverConsumedKg =
      typeof formData.coverCompoundConsumed === 'number'
        ? formData.coverCompoundConsumed
        : typeof formData.coverCompoundConsumed === 'string'
          ? parseFloat(formData.coverCompoundConsumed)
          : 0;

    const skimConsumedKg =
      typeof formData.skimCompoundConsumed === 'number'
        ? formData.skimCompoundConsumed
        : typeof formData.skimCompoundConsumed === 'string'
          ? parseFloat(formData.skimCompoundConsumed)
          : 0;

    if (coverConsumedKg <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cover compound consumed must be greater than 0',
        },
        { status: 400 }
      );
    }

    if (skimConsumedKg <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Skim compound consumed must be greater than 0',
        },
        { status: 400 }
      );
    }

    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Create belt with compound consumption
    await createBelt(
      {
        formData,
        coverCompoundCode: body.coverCompoundCode,
        skimCompoundCode: body.skimCompoundCode,
        coverConsumedKg,
        skimConsumedKg,
        calendaringDate: formData.calendaringDate
          ? formData.calendaringDate instanceof Date
            ? formData.calendaringDate.toISOString()
            : formData.calendaringDate
          : undefined,
      },
      session
    );

    // Commit transaction
    await session.commitTransaction();

    return NextResponse.json(
      {
        success: true,
        message: 'Belt created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating belt:', error);

    // Rollback transaction on error
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

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
  } finally {
    // End session
    if (session) {
      await session.endSession();
    }
  }
}

export const GET = (request: NextRequest) => withRBAC(request, Permission.BELT_VIEW, getBelts);
export const POST = (request: NextRequest) =>
  withRBAC(request, Permission.BELT_CREATE, createBeltHandler);
