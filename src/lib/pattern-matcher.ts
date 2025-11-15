import type { PatternMatch } from './types';

// Common API endpoint patterns
const API_PATTERNS = [
  // RESTful patterns
  /\/api\/v?\d*\/[a-zA-Z]+/g,
  /\/rest\/[a-zA-Z]+/g,
  /\/graphql/g,

  // Common API paths
  /\/users?\/?\d*/g,
  /\/auth\/[a-zA-Z]+/g,
  /\/login|\/register|\/logout/g,
  /\/search\?/g,
  /\/upload|\/download/g,

  // Parameter patterns
  /\?[a-zA-Z_]+=|&[a-zA-Z_]+=/g,
  /\/\{[a-zA-Z_]+\}/g,
  /\/:\w+/g,

  // File extensions that might contain APIs
  /\.json(\?|$)/g,
  /\.xml(\?|$)/g,
  /\.php(\?|$)/g,
  /\.asp(\?|$)/g,
  /\.jsp(\?|$)/g,
];

// JavaScript patterns for API calls
const JS_API_PATTERNS = [
  /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /axios\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*['"`]([^'"`]+)['"`]/g,
  /XMLHttpRequest.*open\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]([^'"`]+)['"`]/g,
];

class PatternMatcher {
  private static instance: PatternMatcher;

  static getInstance(): PatternMatcher {
    if (!PatternMatcher.instance) {
      PatternMatcher.instance = new PatternMatcher();
    }
    return PatternMatcher.instance;
  }

  extractEndpoints(content: string, baseUrl: string): PatternMatch[] {
    const results: PatternMatch[] = [];

    for (const pattern of API_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern))
        .map(match => this.normalizeEndpoint(match[0], baseUrl))
        .filter(Boolean) as string[];

      if (matches.length > 0) {
        results.push({
          pattern: pattern.source,
          matches: [...new Set(matches)], // Remove duplicates
          confidence: this.calculateConfidence(pattern, matches),
        });
      }
    }

    return results;
  }

  extractJavaScriptAPIs(jsContent: string, baseUrl: string): PatternMatch[] {
    const results: PatternMatch[] = [];

    for (const pattern of JS_API_PATTERNS) {
      const matches = Array.from(jsContent.matchAll(pattern))
        .map(match => this.normalizeEndpoint(match[1], baseUrl))
        .filter(Boolean) as string[];

      if (matches.length > 0) {
        results.push({
          pattern: pattern.source,
          matches: [...new Set(matches)],
          confidence: this.calculateConfidence(pattern, matches),
        });
      }
    }

    return results;
  }

  private normalizeEndpoint(endpoint: string, baseUrl: string): string | null {
    try {
      // Handle relative URLs
      if (endpoint.startsWith('/')) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}${endpoint}`;
      }

      // Handle absolute URLs
      if (endpoint.startsWith('http')) {
        return endpoint;
      }

      // Handle relative paths without leading slash
      if (!endpoint.includes('://')) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}/${endpoint}`;
      }

      return endpoint;
    } catch {
      return null;
    }
  }

  private calculateConfidence(pattern: RegExp, matches: string[]): number {
    // Base confidence on pattern complexity and match quality
    let confidence = 0.5; // Base confidence

    // Boost confidence based on pattern specificity
    if (pattern.source.includes('api')) confidence += 0.3;
    if (pattern.source.includes('rest')) confidence += 0.2;
    if (pattern.source.includes('graphql')) confidence += 0.3;

    // Boost confidence based on number of matches
    if (matches.length > 1) confidence += 0.1;
    if (matches.length > 5) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  // Method to extract parameters from URLs
  extractParameters(url: string): { name: string; type: 'query' | 'path' }[] {
    const params: { name: string; type: 'query' | 'path' }[] = [];

    try {
      const urlObj = new URL(url);

      // Extract query parameters
      urlObj.searchParams.forEach((_, key) => {
        params.push({ name: key, type: 'query' });
      });

      // Extract path parameters (simple heuristics)
      const pathParams = url.match(/\{(\w+)\}|:(\w+)/g);
      if (pathParams) {
        pathParams.forEach(param => {
          const cleanParam = param.replace(/[{}:]/g, '');
          params.push({ name: cleanParam, type: 'path' });
        });
      }
    } catch {
      // Invalid URL, skip parameter extraction
    }

    return params;
  }

  // Method to detect HTTP methods from JavaScript code
  detectHttpMethods(jsContent: string): { [url: string]: string[] } {
    const methods: { [url: string]: string[] } = {};

    const methodPatterns = [
      { method: 'GET', pattern: /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g },
      { method: 'POST', pattern: /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{[^}]*method\s*:\s*['"`]POST['"`]/g },
      { method: 'PUT', pattern: /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{[^}]*method\s*:\s*['"`]PUT['"`]/g },
      { method: 'DELETE', pattern: /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{[^}]*method\s*:\s*['"`]DELETE['"`]/g },
    ];

    methodPatterns.forEach(({ method, pattern }) => {
      const matches = Array.from(jsContent.matchAll(pattern));
      matches.forEach(match => {
        const url = match[1];
        if (!methods[url]) methods[url] = [];
        if (!methods[url].includes(method)) {
          methods[url].push(method);
        }
      });
    });

    return methods;
  }
}

export default PatternMatcher;
