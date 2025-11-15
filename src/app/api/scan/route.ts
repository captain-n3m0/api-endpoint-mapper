import { NextRequest, NextResponse } from 'next/server';
import { SpiderCrawler } from '@/lib/spider-crawler';
import { isValidDomain } from '@/lib/utils';
import type { ScanProgress } from '@/lib/types';

// Store active crawling sessions
const activeCrawlers = new Map<string, SpiderCrawler>();

export async function POST(request: NextRequest) {
  try {
    const { domain, config } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Validate domain format
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    if (!isValidDomain(cleanDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format. Please use a valid domain name, localhost, or IP address.' },
        { status: 400 }
      );
    }    // Create session ID
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize crawler with configuration and progress callback
    const crawler = new SpiderCrawler(config);
    activeCrawlers.set(sessionId, crawler);

    // Progress callback to update the progress API
    const progressCallback = async (progress: ScanProgress) => {
      try {
        await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''}/api/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            ...progress,
          }),
        });
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    };

    // Start crawling with progress callback (don't await - run in background)
    crawler.crawl(cleanDomain, progressCallback).then(async (result) => {
      // Store the crawl results when completed
      console.log(`Crawl completed for session ${sessionId}, storing results...`, result);
      try {
        const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''}/api/results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            ...result,
            domain: cleanDomain, // Override result.domain with cleanDomain
          }),
        });

        if (response.ok) {
          console.log(`Crawl results stored successfully for session ${sessionId}`);
        } else {
          console.error(`Failed to store results for session ${sessionId}:`, response.status, await response.text());
        }
      } catch (error) {
        console.error(`Failed to store results for session ${sessionId}:`, error);
      }
    }).catch(error => {
      console.error(`Crawler error for session ${sessionId}:`, error);
    }).finally(() => {
      console.log(`Crawl finished (success or error) for session ${sessionId}`);
      // Clean up session after completion
      setTimeout(() => {
        activeCrawlers.delete(sessionId);
      }, 300000); // Keep results for 5 minutes
    });

    return NextResponse.json({
      sessionId,
      message: 'Crawling started',
      domain: cleanDomain,
    });

  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const crawler = activeCrawlers.get(sessionId);
    if (!crawler) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Return current status (this would need to be implemented in the crawler)
    return NextResponse.json({
      sessionId,
      status: 'running',
      message: 'Crawler is active',
    });

  } catch (error) {
    console.error('Scan status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
