import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
    await dbConnect();
  try {
      return NextResponse.json({ message: 'API is running' }, { status: 200 });

  } catch (error) {
      console.log("error is: ", error);
    return NextResponse.json({ message: 'API is not running' }, { status: 500 });
  }
}
