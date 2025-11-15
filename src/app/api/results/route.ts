import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for results (in production, use database)
const scanResults = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const format = searchParams.get('format') || 'json';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const results = scanResults.get(sessionId);
    if (!results) {
      return NextResponse.json(
        { error: 'Results not found' },
        { status: 404 }
      );
    }

    if (format === 'csv') {
      const csv = convertToCSV(results);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="api-endpoints-${sessionId}.csv"`,
        },
      });
    }

    if (format === 'openapi') {
      const openapi = convertToOpenAPI(results);
      return NextResponse.json(openapi);
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Results API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, ...resultsData } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Store scan results
    scanResults.set(sessionId, {
      sessionId,
      timestamp: new Date().toISOString(),
      ...resultsData,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Results storage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function convertToCSV(results: any): string {
  if (!results.endpoints || results.endpoints.length === 0) {
    return 'No endpoints found';
  }

  const headers = [
    'URL',
    'Method',
    'Parameters',
    'Source',
    'Depth',
    'Security Risk',
    'Response Time'
  ];

  const rows = results.endpoints.map((endpoint: any) => [
    endpoint.url,
    endpoint.method,
    endpoint.parameters?.map((p: any) => p.name).join('; ') || '',
    endpoint.source,
    endpoint.depth,
    endpoint.security?.riskLevel || 'unknown',
    endpoint.responseTime || ''
  ]);

  return [
    headers.join(','),
    ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
  ].join('\n');
}

function convertToOpenAPI(results: any): any {
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: `API Documentation for ${results.domain}`,
      description: `Auto-generated API documentation from endpoint discovery`,
      version: '1.0.0',
      'x-generated-by': 'API Endpoint Mapper',
      'x-generated-date': new Date().toISOString(),
    },
    servers: [
      {
        url: results.domain,
        description: 'Discovered API server',
      },
    ],
    paths: {} as any,
  };

  if (results.endpoints) {
    results.endpoints.forEach((endpoint: any) => {
      try {
        const url = new URL(endpoint.url);
        const path = url.pathname;
        const method = endpoint.method.toLowerCase();

        if (!openapi.paths[path]) {
          openapi.paths[path] = {};
        }

        openapi.paths[path][method] = {
          summary: `${endpoint.method} ${path}`,
          description: `Discovered endpoint from ${endpoint.source}`,
          parameters: endpoint.parameters?.map((param: any) => ({
            name: param.name,
            in: param.type === 'query' ? 'query' : param.type === 'path' ? 'path' : 'header',
            required: param.required,
            schema: {
              type: 'string',
            },
            description: param.description || `${param.name} parameter`,
          })) || [],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
          'x-discovered-from': endpoint.source,
          'x-security-risk': endpoint.security?.riskLevel,
        };
      } catch (error) {
        // Skip invalid URLs
      }
    });
  }

  return openapi;
}
