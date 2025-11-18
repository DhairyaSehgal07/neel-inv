import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import BeltModel from "@/model/Belt";
import { convertBeltDocumentsToBelts, convertBeltDocumentToBelt } from "@/lib/belt-utils";

// GET /api/belts - Get all belts
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

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
        { beltNumber: { $regex: search, $options: "i" } },
        { "fabric.rating": { $regex: search, $options: "i" } },
        { orderNumber: { $regex: search, $options: "i" } },
        { buyerName: { $regex: search, $options: "i" } },
      ];
    }

    const belts = await BeltModel.find(query).sort({ createdAt: -1 });
    const convertedBelts = convertBeltDocumentsToBelts(belts);

    return NextResponse.json(
      {
        success: true,
        data: convertedBelts,
        count: convertedBelts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching belts:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch belts";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch belts",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// POST /api/belts - Create new belt
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Remove id field if present (MongoDB will generate _id)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...beltData } = body;

    // Validate required fields
    if (!beltData.beltNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Belt number is required",
        },
        { status: 400 }
      );
    }

    // Check if belt number already exists
    const existingBelt = await BeltModel.findOne({ beltNumber: beltData.beltNumber });
    if (existingBelt) {
      return NextResponse.json(
        {
          success: false,
          message: "Belt number already exists",
        },
        { status: 400 }
      );
    }

    // Check for unique belt codes if provided
    if (beltData.compound?.coverBeltCode) {
      const existingCoverCode = await BeltModel.findOne({
        "compound.coverBeltCode": beltData.compound.coverBeltCode,
      });
      if (existingCoverCode) {
        return NextResponse.json(
          {
            success: false,
            message: "Cover belt code already exists",
          },
          { status: 400 }
        );
      }
    }

    if (beltData.compound?.skimBeltCode) {
      const existingSkimCode = await BeltModel.findOne({
        "compound.skimBeltCode": beltData.compound.skimBeltCode,
      });
      if (existingSkimCode) {
        return NextResponse.json(
          {
            success: false,
            message: "Skim belt code already exists",
          },
          { status: 400 }
        );
      }
    }

    // Create new belt
    const newBelt = new BeltModel(beltData);
    const savedBelt = await newBelt.save();
    const convertedBelt = convertBeltDocumentToBelt(savedBelt);

    return NextResponse.json(
      {
        success: true,
        data: convertedBelt,
        message: "Belt created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating belt:", error);

    // Handle duplicate key errors (MongoDB duplicate key error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const keyPattern = 'keyPattern' in error && typeof error.keyPattern === 'object' ? error.keyPattern : {};
      const field = Object.keys(keyPattern)[0] || 'field';
      return NextResponse.json(
        {
          success: false,
          message: `${field} already exists`,
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to create belt";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create belt",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
