import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import BeltModel from "@/model/Belt";
import mongoose from "mongoose";
import { convertBeltDocumentToBelt } from "@/lib/belt-utils";

// GET /api/belts/[id] - Get single belt by ID
export async function GET(
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
      console.error('Invalid belt ID:', id);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid belt ID",
        },
        { status: 400 }
      );
    }

    const belt = await BeltModel.findById(id);

    if (!belt) {
      return NextResponse.json(
        {
          success: false,
          message: "Belt not found",
        },
        { status: 404 }
      );
    }

    const convertedBelt = convertBeltDocumentToBelt(belt);

    return NextResponse.json(
      {
        success: true,
        data: convertedBelt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching belt:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch belt";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch belt",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// PUT /api/belts/[id] - Update belt by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();

    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const body = await request.json();

    // Remove id field if present (MongoDB uses _id internally)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: bodyId, ...beltData } = body;

    // Validate MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid belt ID:', id);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid belt ID",
        },
        { status: 400 }
      );
    }

    // Check if belt exists
    const existingBelt = await BeltModel.findById(id);
    if (!existingBelt) {
      return NextResponse.json(
        {
          success: false,
          message: "Belt not found",
        },
        { status: 404 }
      );
    }

    // Check if belt number is being changed and if it already exists
    if (beltData.beltNumber && beltData.beltNumber !== existingBelt.beltNumber) {
      const beltWithSameNumber = await BeltModel.findOne({
        beltNumber: beltData.beltNumber,
        _id: { $ne: id },
      });
      if (beltWithSameNumber) {
        return NextResponse.json(
          {
            success: false,
            message: "Belt number already exists",
          },
          { status: 400 }
        );
      }
    }

    // Check for unique belt codes if being changed
    if (beltData.compound?.coverBeltCode) {
      const existingCoverCode = await BeltModel.findOne({
        "compound.coverBeltCode": beltData.compound.coverBeltCode,
        _id: { $ne: id },
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
        _id: { $ne: id },
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

    // Update belt
    const updatedBelt = await BeltModel.findByIdAndUpdate(
      id,
      { $set: beltData },
      { new: true, runValidators: true }
    );

    if (!updatedBelt) {
      return NextResponse.json(
        {
          success: false,
          message: "Belt not found",
        },
        { status: 404 }
      );
    }

    const convertedBelt = convertBeltDocumentToBelt(updatedBelt);

    return NextResponse.json(
      {
        success: true,
        data: convertedBelt,
        message: "Belt updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating belt:", error);

    // Handle duplicate key errors (MongoDB duplicate key error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const keyPattern = 'keyPattern' in error && typeof error.keyPattern === 'object' && error.keyPattern !== null
        ? error.keyPattern
        : {};
      const field = Object.keys(keyPattern as Record<string, unknown>)[0] || 'field';
      return NextResponse.json(
        {
          success: false,
          message: `${field} already exists`,
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to update belt";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update belt",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/belts/[id] - Delete belt by ID
export async function DELETE(
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
      console.error('Invalid belt ID:', id);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid belt ID",
        },
        { status: 400 }
      );
    }

    const deletedBelt = await BeltModel.findByIdAndDelete(id);

    if (!deletedBelt) {
      return NextResponse.json(
        {
          success: false,
          message: "Belt not found",
        },
        { status: 404 }
      );
    }

    const convertedBelt = convertBeltDocumentToBelt(deletedBelt);

    return NextResponse.json(
      {
        success: true,
        data: convertedBelt,
        message: "Belt deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting belt:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete belt";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete belt",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
