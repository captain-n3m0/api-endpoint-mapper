import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for scan progress (in production, use Redis or database)
const scanProgress = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const progress = scanProgress.get(sessionId);
    if (!progress) {
      return NextResponse.json(
        {
          error: 'Session not found',
          sessionId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(progress);

  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// WebSocket-like progress updates via Server-Sent Events
export async function POST(request: NextRequest) {
  try {
    const { sessionId, ...progressData } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Store progress update
    scanProgress.set(sessionId, {
      sessionId,
      timestamp: new Date().toISOString(),
      ...progressData,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Progress update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
