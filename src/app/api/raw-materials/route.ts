import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { ApiResponse } from '@/types/apiResponse';
import dbConnect from '@/lib/dbConnect';
import RawMaterial from '@/model/RawMaterial';
import { formatLocalDate } from '@/lib/helpers/compound-utils';

async function getRawMaterials(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Build query
    const query: {
      $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
    } = {};

    if (search) {
      query.$or = [
        { materialCode: { $regex: search, $options: 'i' } },
        { rawMaterial: { $regex: search, $options: 'i' } },
        { date: { $regex: search, $options: 'i' } },
      ];
    }

    const rawMaterials = await RawMaterial.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json(
      {
        success: true,
        data: rawMaterials,
        count: rawMaterials.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching raw materials:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch raw materials';
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch raw materials',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

async function createRawMaterial(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { materialCode, date, rawMaterial } = body;

    // Validate required fields
    if (!materialCode || !materialCode.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Material code is required',
        },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: 'Date is required',
        },
        { status: 400 }
      );
    }

    if (!rawMaterial || !rawMaterial.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Raw material is required',
        },
        { status: 400 }
      );
    }

    // Format date to YYYY-MM-DD string
    // Handle Date object, ISO string, or YYYY-MM-DD string
    let formattedDate: string;
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

    // Check if material code and date combination already exists
    const existing = await RawMaterial.findOne({
      materialCode: materialCode.trim(),
      date: formattedDate,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Raw material with this code and date already exists',
        },
        { status: 400 }
      );
    }

    // Create raw material
    const newRawMaterial = await RawMaterial.create({
      materialCode: materialCode.trim(),
      date: formattedDate,
      rawMaterial: rawMaterial.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Raw material created successfully',
        data: newRawMaterial,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating raw material:', error);

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
      message: 'Failed to create raw material',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export const GET = (request: NextRequest) => withRBAC(request, Permission.BELT_VIEW, getRawMaterials);
export const POST = (request: NextRequest) => withRBAC(request, Permission.BELT_CREATE, createRawMaterial);
