import { NextRequest, NextResponse } from 'next/server';

/**
 * Dev Null API Route
 * Handles logging requests without processing them - acts as a no-op endpoint
 * This prevents 404 errors from the logger utility in development
 */

export async function POST(request: NextRequest) {
  try {
    // Read the body to prevent hanging but don't process it
    await request.json();
    
    // Return success without doing anything (true dev/null behavior)
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    // Even if JSON parsing fails, still return success (true dev/null)
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}

// Handle other methods with 200 OK (true dev/null behavior)
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function PUT() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function DELETE() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function PATCH() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}