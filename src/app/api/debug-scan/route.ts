import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Debug scan endpoint hit');
    
    const { domain, config } = await request.json();
    console.log('Received:', { domain, config });

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Just return success for now to test the flow
    const sessionId = `debug_${Date.now()}`;
    
    console.log('Returning sessionId:', sessionId);
    
    return NextResponse.json({
      sessionId,
      message: 'Debug scan started',
      domain: domain,
    });

  } catch (error) {
    console.error('Debug scan API error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'unknown') },
      { status: 500 }
    );
  }
}