import { NextRequest } from 'next/server';
import axios from 'axios';

interface QuickScanRequest {
  domain: string;
}

interface EndpointInfo {
  path: string;
  method: string;
  status: number;
  responseTime: number;
  headers?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const { domain }: QuickScanRequest = await request.json();

    if (!domain) {
      return Response.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Normalize domain
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    const endpoints: EndpointInfo[] = [];
    const startTime = Date.now();

    // Quick common API paths to check
    const commonPaths = [
      '/api',
      '/api/v1',
      '/api/v2',
      '/v1',
      '/v2',
      '/graphql',
      '/rest',
      '/health',
      '/status',
      '/ping',
      '/docs',
      '/swagger',
      '/openapi.json',
      '/api-docs',
      '/.well-known/security.txt',
      '/.well-known/openid_configuration',
      '/robots.txt',
      '/sitemap.xml'
    ];

    // Test each path quickly
    const promises = commonPaths.map(async (path) => {
      try {
        const url = `${baseUrl}${path}`;
        const startTime = Date.now();

        const response = await axios.get(url, {
          timeout: 3000,
          validateStatus: () => true, // Don't throw on 4xx/5xx
          maxRedirects: 2
        });

        const endTime = Date.now();

        // Only include if it's not a 404
        if (response.status !== 404) {
          return {
            path,
            method: 'GET',
            status: response.status,
            responseTime: endTime - startTime,
            headers: {
              'content-type': response.headers['content-type'] || '',
              'server': response.headers['server'] || ''
            }
          };
        }
      } catch (error) {
        // Ignore errors for this quick scan
      }
      return null;
    });

    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        endpoints.push(result.value);
      }
    });

    const totalTime = Date.now() - startTime;

    return Response.json({
      domain,
      scanType: 'quick',
      totalTime,
      endpointsFound: endpoints.length,
      endpoints,
      message: `Found ${endpoints.length} endpoints in ${totalTime}ms`
    });

  } catch (error) {
    console.error('Quick scan error:', error);
    return Response.json(
      { error: 'Scan failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
