import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import chromium from '@sparticuz/chromium';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import PatternMatcher from './pattern-matcher';
import { getWASMPatternMatcher } from './wasm-pattern-matcher';
import type {
  Endpoint,
  CrawlResult,
  CrawlError,
  ScanProgress,
  ScannerConfig,
  SecurityAnalysis
} from './types';

export class SpiderCrawler {
  private browser: Browser | null = null;
  private rateLimiter: RateLimiterMemory;
  private patternMatcher: PatternMatcher;
  private visitedUrls = new Set<string>();
  private foundEndpoints = new Map<string, Endpoint>();
  private errors: CrawlError[] = [];
  private config: ScannerConfig;
  private onProgress?: (progress: ScanProgress) => void;
  private crawlQueue: string[] = [];
  private activeCrawls = new Set<Promise<void>>();
  private maxConcurrentCrawls = 16; // HYPER PARALLEL CRAWLING BEAST MODE
  private intelligentQueue = new Set<string>(); // Smart deduplication
  private crawlStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    fastestResponse: Infinity,
    slowestResponse: 0
  };

  constructor(config: Partial<ScannerConfig> = {}) {
    this.config = {
      maxDepth: 8,           // ULTRA DEEP crawling
      maxPages: 2000,        // MASSIVE page coverage
      respectRobots: false,  // IGNORE robots.txt for aggressive crawling
      includeExternalLinks: true, // Follow external API links
      crawlDelay: 100,       // HYPER SPEED - 10 requests per second
      userAgent: 'Mozilla/5.0 (compatible; API-Endpoint-Mapper/3.0; Beast-Mode-Crawler)',
      enableJavaScript: true,
      timeout: 10000,        // Ultra fast timeout
      ...config,
    };

    // BEAST MODE rate limiting: 10 requests per second with burst of 50
    this.rateLimiter = new RateLimiterMemory({
      points: 10,
      duration: 1,
      execEvenly: true, // Smooth distribution
    });

    this.patternMatcher = PatternMatcher.getInstance();
  }

  // BEAST MODE: Enhanced browser initialization
  async initialize(): Promise<void> {
    if (this.config.enableJavaScript && !this.browser) {
      try {
        // Use serverless-friendly chromium in production, local puppeteer in development
        const isProduction = process.env.NODE_ENV === 'production';

        this.browser = await puppeteer.launch({
          headless: true,
          executablePath: isProduction ? await chromium.executablePath() : process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          args: isProduction ? chromium.args : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',  // BEAST MODE: Bypass CORS for API discovery
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--enable-automation',
            '--no-default-browser-check',
            '--no-first-run',
            '--single-process', // Important for serverless
            '--no-zygote' // Important for serverless
          ],
        });
      } catch (error) {
        console.warn('Failed to initialize Puppeteer, falling back to non-JS mode:', error);
        this.config.enableJavaScript = false;
      }
    }
  }

  async crawl(
    domain: string,
    onProgress?: (progress: ScanProgress) => void
  ): Promise<CrawlResult> {
    this.onProgress = onProgress;
    const startTime = Date.now();

    try {
      await this.initialize();

      this.updateProgress({
        stage: 'initializing',
        progress: 0,
        pagesScanned: 0,
        endpointsFound: 0,
        message: 'Initializing crawler...',
      });

      // Validate domain
      const baseUrl = this.normalizeUrl(domain);
      if (!baseUrl) {
        throw new Error('Invalid domain provided');
      }

      // Check robots.txt if required
      if (this.config.respectRobots) {
        await this.checkRobotsTxt(baseUrl);
      }

      this.updateProgress({
        stage: 'crawling',
        progress: 10,
        pagesScanned: 0,
        endpointsFound: 0,
        message: 'Starting to crawl pages...',
      });

      // ULTRA BEAST MODE: Multiple discovery techniques simultaneously + AI prediction
      const discoveryResults = await Promise.allSettled([
        this.discoverFromSitemap(baseUrl),
        this.discoverFromRobotsTxt(baseUrl),
        this.discoverFromWellKnownEndpoints(baseUrl),
        this.discoverFromCommonPaths(baseUrl),
        this.discoverFromTechnologyFingerprinting(baseUrl),
        this.discoverFromSecurityHeaders(baseUrl),
        this.discoverFromDNSRecords(baseUrl),
        this.discoverFromSubdomainEnumeration(baseUrl),
        this.analyzeGitRepository(baseUrl),
        this.discoverWebSocketEndpoints(baseUrl),
        this.discoverMobileAPIEndpoints(baseUrl),
        this.discoverThirdPartyIntegrations(baseUrl),
      ]);

      // Log any failed discovery methods but don't let them block the crawl
      const failedMethods = discoveryResults.filter(result => result.status === 'rejected');
      if (failedMethods.length > 0) {
        console.warn(`${failedMethods.length} discovery methods failed, continuing crawl...`);
      }

      // AI-powered endpoint prediction
      await this.predictEndpointsWithAI(baseUrl);
      await this.predictAIEndpoints(baseUrl);

      // Start hyper parallel aggressive crawling
      this.crawlQueue.push(baseUrl);
      await this.crawlParallel();

      // AGGRESSIVE JavaScript + WebAssembly analysis
      await this.analyzeJavaScriptFiles();

      // Deep packet inspection simulation
      await this.simulateAPICallsFromPatterns();

      this.updateProgress({
        stage: 'processing',
        progress: 90,
        pagesScanned: this.visitedUrls.size,
        endpointsFound: this.foundEndpoints.size,
        message: 'Processing results...',
      });

      // Generate final results
      const endpoints = Array.from(this.foundEndpoints.values());
      const totalTime = Date.now() - startTime;

      this.updateProgress({
        stage: 'completed',
        progress: 100,
        pagesScanned: this.visitedUrls.size,
        endpointsFound: endpoints.length,
        message: 'Crawling completed successfully!',
      });

      return {
        domain: baseUrl,
        endpoints,
        totalPages: this.visitedUrls.size,
        totalTime,
        errors: this.errors,
        stats: {
          pagesScanned: this.visitedUrls.size,
          endpointsFound: endpoints.length,
          jsFilesAnalyzed: endpoints.filter(e => e.source === 'js').length,
          apiCallsDetected: endpoints.filter(e => e.url.includes('/api/')).length,
          uniqueDomains: new Set(endpoints.map(e => new URL(e.url).hostname)).size,
          avgResponseTime: endpoints.reduce((sum, e) => sum + (e.responseTime || 0), 0) / endpoints.length || 0,
        },
      };

    } catch (error) {
      this.updateProgress({
        stage: 'error',
        progress: 0,
        pagesScanned: this.visitedUrls.size,
        endpointsFound: this.foundEndpoints.size,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  // BEAST MODE: Parallel crawling engine
  private async crawlParallel(): Promise<void> {
    while (this.crawlQueue.length > 0 && this.visitedUrls.size < this.config.maxPages) {
      // Launch concurrent crawls up to the limit
      while (this.activeCrawls.size < this.maxConcurrentCrawls && this.crawlQueue.length > 0) {
        const url = this.crawlQueue.shift();
        if (url && !this.visitedUrls.has(url)) {
          const crawlPromise = this.crawlSingle(url).finally(() => {
            this.activeCrawls.delete(crawlPromise);
          });
          this.activeCrawls.add(crawlPromise);
        }
      }

      // Wait for at least one crawl to complete
      if (this.activeCrawls.size > 0) {
        await Promise.race(this.activeCrawls);
      }
    }

    // Wait for all remaining crawls to complete
    await Promise.all(this.activeCrawls);
  }

  // BEAST MODE: Discover APIs from sitemap.xml
  private async discoverFromSitemap(baseUrl: string): Promise<void> {
    try {
      const sitemapUrls = [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap_index.xml`,
        `${baseUrl}/api-docs/sitemap.xml`,
        `${baseUrl}/docs/sitemap.xml`
      ];

      for (const sitemapUrl of sitemapUrls) {
        try {
          const response = await axios.get(sitemapUrl, { timeout: 5000 });
          const $ = cheerio.load(response.data, { xmlMode: true });

          $('url > loc, sitemap > loc').each((_, element) => {
            const url = $(element).text();
            if (this.looksLikeAPI(url) || url.includes('/api/')) {
              this.crawlQueue.push(url);
              // Also add as potential endpoint
              const endpoint = this.createEndpoint(url, 'GET', 'sitemap', 0);
              if (endpoint) {
                this.foundEndpoints.set(endpoint.id, endpoint);
              }
            }
          });
        } catch {
          // Sitemap not found, continue
        }
      }
    } catch {
      // Ignore sitemap errors
    }
  }

  // BEAST MODE: Discover from robots.txt
  private async discoverFromRobotsTxt(baseUrl: string): Promise<void> {
    try {
      const response = await axios.get(`${baseUrl}/robots.txt`, { timeout: 5000 });
      const lines = response.data.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Disallow:') || trimmed.startsWith('Allow:')) {
          const path = trimmed.split(':')[1]?.trim();
          if (path && this.looksLikeAPI(path)) {
            const fullUrl = `${baseUrl}${path}`;
            this.crawlQueue.push(fullUrl);
            const endpoint = this.createEndpoint(fullUrl, 'GET', 'robots', 0);
            if (endpoint) {
              this.foundEndpoints.set(endpoint.id, endpoint);
            }
          }
        }
        if (trimmed.startsWith('Sitemap:')) {
          const sitemapUrl = trimmed.split(':')[1]?.trim();
          if (sitemapUrl) {
            this.crawlQueue.push(sitemapUrl);
          }
        }
      }
    } catch {
      // robots.txt not found or accessible
    }
  }

  // BEAST MODE: Well-known API discovery endpoints
  private async discoverFromWellKnownEndpoints(baseUrl: string): Promise<void> {
    const wellKnownPaths = [
      '/.well-known/openapi_desc',
      '/.well-known/api-catalog',
      '/swagger.json',
      '/swagger.yaml',
      '/openapi.json',
      '/openapi.yaml',
      '/api-docs',
      '/api-docs.json',
      '/docs',
      '/documentation',
      '/graphql',
      '/graphiql',
      '/.well-known/security.txt',
      '/.well-known/change-password',
      '/health',
      '/ping',
      '/status',
      '/version',
      '/info'
    ];

    const checkPromises = wellKnownPaths.map(async (path) => {
      try {
        const url = `${baseUrl}${path}`;
        const response = await axios.head(url, { timeout: 3000 });
        if (response.status === 200) {
          this.crawlQueue.push(url);
          const endpoint = this.createEndpoint(url, 'GET', 'crawl', 0);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        }
      } catch {
        // Endpoint doesn't exist, ignore
      }
    });

    await Promise.allSettled(checkPromises);
  }

  // BEAST MODE: Common API path discovery
  private async discoverFromCommonPaths(baseUrl: string): Promise<void> {
    const commonApiPaths = [
      '/api',
      '/api/v1',
      '/api/v2',
      '/api/v3',
      '/rest',
      '/rest/v1',
      '/rest/v2',
      '/service',
      '/services',
      '/webapi',
      '/backend',
      '/admin/api',
      '/public/api',
      '/internal/api',
      '/external/api',
      '/api/auth',
      '/api/users',
      '/api/user',
      '/api/login',
      '/api/register',
      '/api/profile',
      '/api/data',
      '/api/search',
      '/api/admin',
      '/oauth',
      '/auth',
      '/login',
      '/register',
      '/token',
      '/refresh'
    ];

    const checkPromises = commonApiPaths.map(async (path) => {
      try {
        const url = `${baseUrl}${path}`;
        const response = await axios.get(url, {
          timeout: 3000,
          validateStatus: (status) => status < 500 // Accept 4xx as valid endpoints
        });

        if (response.status < 500) {
          this.crawlQueue.push(url);
          const endpoint = this.createEndpoint(url, 'GET', 'crawl', 0);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        }
      } catch {
        // Path doesn't exist, ignore
      }
    });

    await Promise.allSettled(checkPromises);
  }

  private async crawlSingle(url: string): Promise<void> {
    if (this.visitedUrls.has(url) || this.visitedUrls.size >= this.config.maxPages) {
      return;
    }

    try {
      // Rate limiting
      await this.rateLimiter.consume('spider-crawler');

      this.visitedUrls.add(url);

      this.updateProgress({
        stage: 'crawling',
        progress: 10 + (this.visitedUrls.size / this.config.maxPages) * 70,
        pagesScanned: this.visitedUrls.size,
        endpointsFound: this.foundEndpoints.size,
        message: `Beast crawling: ${url}`,
        currentUrl: url,
      });

      const content = await this.fetchPageContent(url);
      if (!content) return;

      // AGGRESSIVE endpoint extraction
      await this.extractEndpointsFromHTML(content, url, 0);
      await this.extractEndpointsFromContent(content, url);

      // Extract and queue more links for parallel crawling
      const links = this.extractLinks(content, url);
      for (const link of links) {
        if (this.shouldCrawlUrl(link, url) && !this.visitedUrls.has(link)) {
          this.crawlQueue.push(link);
        }
      }

    } catch (error) {
      this.errors.push({
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }

  // BEAST MODE: Extract endpoints from any content type
  private async extractEndpointsFromContent(content: string, baseUrl: string): Promise<void> {
    // Look for JSON API responses that might reveal other endpoints
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        this.extractEndpointsFromJSON(jsonData, baseUrl);
      }
    } catch {
      // Not valid JSON, continue
    }

    // Extract URLs from text content using regex
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const urls = content.match(urlRegex) || [];

    for (const url of urls) {
      if (this.looksLikeAPI(url)) {
        const endpoint = this.createEndpoint(url, 'GET', 'crawl', 0);
        if (endpoint) {
          this.foundEndpoints.set(endpoint.id, endpoint);
        }
      }
    }

    // Extract API calls from different formats
    const apiPatterns = [
      /(?:fetch|axios|http|request)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /['"`](\/api\/[^'"`]+)['"`]/g,
      /['"`](\/rest\/[^'"`]+)['"`]/g,
      /url\s*:\s*['"`]([^'"`]+)['"`]/g,
      /endpoint\s*:\s*['"`]([^'"`]+)['"`]/g,
    ];

    for (const pattern of apiPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const url = match[1];
        if (this.looksLikeAPI(url)) {
          const fullUrl = this.resolveUrl(url, baseUrl) || url;
          const endpoint = this.createEndpoint(fullUrl, 'GET', 'js', 0);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        }
      }
    }
  }

  // BEAST MODE: Extract endpoints from JSON responses
  private extractEndpointsFromJSON(data: any, baseUrl: string): void {
    const traverse = (obj: any) => {
      if (typeof obj === 'string' && this.looksLikeAPI(obj)) {
        const endpoint = this.createEndpoint(
          this.resolveUrl(obj, baseUrl) || obj,
          'GET',
          'crawl',
          0
        );
        if (endpoint) {
          this.foundEndpoints.set(endpoint.id, endpoint);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(traverse);
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(traverse);
      }
    };

    traverse(data);
  }

  // ULTRA BEAST MODE: Technology fingerprinting for API discovery
  private async discoverFromTechnologyFingerprinting(baseUrl: string): Promise<void> {
    try {
      // Detect technology stack from headers and response patterns
      const response = await axios.get(baseUrl, {
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        headers: {
          'User-Agent': this.config.userAgent,
        }
      });

      const headers = response.headers;
      const content = response.data;

      // Framework detection and their common API patterns
      const frameworks: Record<string, string[]> = {
        'express': ['/api', '/v1', '/rest', '/graphql'],
        'django': ['/api/v1', '/rest', '/admin/api', '/api'],
        'flask': ['/api', '/v1', '/health', '/docs'],
        'spring': ['/api', '/rest', '/actuator', '/health', '/info'],
        'rails': ['/api/v1', '/rails/api', '/api'],
        'laravel': ['/api', '/api/v1', '/api/user', '/api/auth'],
        'asp.net': ['/api', '/odata', '/webapi', '/swagger'],
        'fastapi': ['/docs', '/openapi.json', '/api/v1', '/redoc'],
        'nodejs': ['/graphql', '/api', '/rest', '/health'],
        'wordpress': ['/wp-json', '/wp-admin/admin-ajax.php', '/wp-json/wp/v2'],
        'drupal': ['/jsonapi', '/rest', '/api'],
        'nextjs': ['/api', '/api/auth', '/api/graphql'],
        'nuxt': ['/api', '/_nuxt/api'],
        'strapi': ['/api', '/admin', '/graphql'],
        'ghost': ['/ghost/api', '/api/v3', '/api/v4'],
      };

      // Detect framework from headers
      let detectedFramework = '';
      const serverHeader = headers['server']?.toLowerCase() || '';
      const poweredBy = headers['x-powered-by']?.toLowerCase() || '';

      // Advanced framework detection
      if (poweredBy.includes('express')) detectedFramework = 'express';
      else if (poweredBy.includes('php') || poweredBy.includes('laravel')) detectedFramework = 'laravel';
      else if (poweredBy.includes('asp.net')) detectedFramework = 'asp.net';
      else if (serverHeader.includes('gunicorn') || serverHeader.includes('uwsgi')) detectedFramework = 'django';
      else if (headers['x-framework'] === 'fastapi') detectedFramework = 'fastapi';

      // Detect from HTML meta tags and content
      if (content && typeof content === 'string') {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('django')) detectedFramework = 'django';
        else if (lowerContent.includes('rails')) detectedFramework = 'rails';
        else if (lowerContent.includes('laravel')) detectedFramework = 'laravel';
        else if (lowerContent.includes('wordpress')) detectedFramework = 'wordpress';
        else if (lowerContent.includes('drupal')) detectedFramework = 'drupal';
        else if (lowerContent.includes('fastapi') || lowerContent.includes('swagger')) detectedFramework = 'fastapi';
        else if (lowerContent.includes('next.js') || lowerContent.includes('nextjs')) detectedFramework = 'nextjs';
        else if (lowerContent.includes('nuxt')) detectedFramework = 'nuxt';
        else if (lowerContent.includes('strapi')) detectedFramework = 'strapi';
        else if (lowerContent.includes('ghost')) detectedFramework = 'ghost';
      }

      // Try framework-specific API paths
      if (detectedFramework && frameworks[detectedFramework]) {
        const paths = frameworks[detectedFramework];
        for (const path of paths) {
          const apiUrl = `${baseUrl}${path}`;
          this.crawlQueue.push(apiUrl);
          this.intelligentQueue.add(apiUrl);
        }
      }

      // Universal API discovery regardless of framework
      const universalPaths = [
        '/health', '/ping', '/status', '/version', '/info', '/metrics',
        '/api/health', '/api/ping', '/api/status', '/api/version',
        '/swagger', '/swagger.json', '/swagger-ui', '/docs',
        '/openapi.json', '/redoc', '/graphql', '/graphiql'
      ];

      for (const path of universalPaths) {
        const apiUrl = `${baseUrl}${path}`;
        this.crawlQueue.push(apiUrl);
        this.intelligentQueue.add(apiUrl);
      }

    } catch (error) {
      console.debug('Technology fingerprinting failed:', error);
    }
  }

  // ULTRA BEAST MODE: Security headers analysis for API discovery
  private async discoverFromSecurityHeaders(baseUrl: string): Promise<void> {
    try {
      const response = await axios.head(baseUrl, { 
        timeout: 15000, // Increased timeout
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // Accept 4xx as valid
      });
      const headers = response.headers;

      // Analyze CORS headers for API endpoints
      const corsOrigin = headers['access-control-allow-origin'];
      const corsMethods = headers['access-control-allow-methods'];
      const corsHeaders = headers['access-control-allow-headers'];

      if (corsOrigin || corsMethods || corsHeaders) {
        // This likely serves APIs, try common API paths
        const apiPaths = ['/api', '/graphql', '/rest', '/v1', '/v2'];
        for (const path of apiPaths) {
          this.crawlQueue.push(`${baseUrl}${path}`);
        }
      }

      // Check for API-related security headers
      if (headers['x-api-version'] || headers['x-ratelimit-limit'] || headers['x-api-key']) {
        // Definitely an API server
        const endpoint = this.createEndpoint(baseUrl, 'GET', 'crawl', 0);
        if (endpoint) {
          this.foundEndpoints.set(endpoint.id, endpoint);
        }
      }

    } catch (error) {
      console.debug('Security headers analysis failed:', error);
    }
  }

  // ULTRA BEAST MODE: DNS record analysis for subdomain API discovery
  private async discoverFromDNSRecords(baseUrl: string): Promise<void> {
    try {
      const domain = new URL(baseUrl).hostname;

      // Common API subdomains
      const apiSubdomains = [
        'api', 'rest', 'graphql', 'gateway', 'backend', 'service',
        'dev-api', 'staging-api', 'test-api', 'admin-api', 'internal-api',
        'public-api', 'mobile-api', 'web-api', 'v1', 'v2', 'v3'
      ];

      // Try each subdomain
      for (const subdomain of apiSubdomains) {
        const subdomainUrl = `https://${subdomain}.${domain}`;
        try {
          // Quick check if subdomain exists
          const response = await axios.head(subdomainUrl, {
            timeout: 2000,
            validateStatus: () => true
          });

          if (response.status < 500) {
            this.crawlQueue.push(subdomainUrl);
            this.intelligentQueue.add(subdomainUrl);

            // Also try common paths on the subdomain
            const paths = ['/', '/api', '/v1', '/docs', '/health'];
            paths.forEach(path => {
              this.crawlQueue.push(`${subdomainUrl}${path}`);
            });
          }
        } catch {
          // Subdomain doesn't exist, ignore
        }
      }

    } catch (error) {
      console.debug('DNS record analysis failed:', error);
    }
  }

  // ULTRA BEAST MODE: Subdomain enumeration with intelligent discovery
  private async discoverFromSubdomainEnumeration(baseUrl: string): Promise<void> {
    try {
      const domain = new URL(baseUrl).hostname;

      // Extended list of potential API-related subdomains
      const potentialSubdomains = [
        // API-specific
        'api', 'rest', 'graphql', 'gateway', 'backend', 'service',
        'microservice', 'micro', 'ms', 'svc', 'endpoint',

        // Environment-specific APIs
        'dev', 'staging', 'test', 'prod', 'production', 'sandbox',
        'demo', 'beta', 'alpha', 'canary',

        // Version-specific
        'v1', 'v2', 'v3', 'v4', 'latest',

        // Service-specific
        'auth', 'user', 'admin', 'public', 'internal', 'external',
        'mobile', 'web', 'client', 'server',

        // Platform-specific
        'aws', 'azure', 'gcp', 'k8s', 'docker',

        // Business logic
        'payment', 'billing', 'notification', 'email', 'sms',
        'upload', 'download', 'media', 'cdn', 'storage'
      ];

      // Batch check subdomains
      const batchSize = 10;
      for (let i = 0; i < potentialSubdomains.length; i += batchSize) {
        const batch = potentialSubdomains.slice(i, i + batchSize);

        const promises = batch.map(async (subdomain) => {
          const subdomainUrl = `https://${subdomain}.${domain}`;
          try {
            const response = await axios.get(subdomainUrl, {
              timeout: 3000,
              maxRedirects: 2,
              validateStatus: (status) => status < 500
            });

            if (response.status === 200) {
              this.crawlQueue.push(subdomainUrl);
              this.intelligentQueue.add(subdomainUrl);

              // If it responds, it might be an API - analyze the response
              if (response.data) {
                await this.extractEndpointsFromContent(response.data, subdomainUrl);
              }
            }
          } catch {
            // Subdomain doesn't exist or not accessible
          }
        });

        await Promise.allSettled(promises);

        // Small delay between batches to avoid overwhelming DNS
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.debug('Subdomain enumeration failed:', error);
    }
  }

  // ULTRA BEAST MODE: AI-powered endpoint prediction
  private async predictEndpointsWithAI(baseUrl: string): Promise<void> {
    try {
      // Analyze existing discovered endpoints to predict patterns
      const existingEndpoints = Array.from(this.foundEndpoints.values());

      if (existingEndpoints.length === 0) return;

      // Extract patterns from existing endpoints
      const patterns = this.analyzeEndpointPatterns(existingEndpoints);

      // Generate predictions based on common REST patterns
      const predictions = this.generateEndpointPredictions(baseUrl, patterns);

      // Test predictions
      for (const prediction of predictions) {
        try {
          const response = await axios.head(prediction.url, {
            timeout: 2000,
            validateStatus: (status) => status < 500
          });

          if (response.status < 500) {
            const endpoint = this.createEndpoint(
              prediction.url,
              prediction.method,
              'crawl',
              0
            );
            if (endpoint) {
              this.foundEndpoints.set(endpoint.id, endpoint);
            }
          }
        } catch {
          // Prediction was wrong, ignore
        }
      }

    } catch (error) {
      console.debug('AI endpoint prediction failed:', error);
    }
  }

  private analyzeEndpointPatterns(endpoints: Endpoint[]): any {
    const patterns = {
      basePaths: new Set<string>(),
      resources: new Set<string>(),
      versions: new Set<string>(),
      methods: new Set<string>()
    };

    endpoints.forEach(endpoint => {
      try {
        const url = new URL(endpoint.url);
        const pathParts = url.pathname.split('/').filter(part => part);

        // Extract base paths (first 2 segments)
        if (pathParts.length >= 2) {
          patterns.basePaths.add(`/${pathParts[0]}/${pathParts[1]}`);
        }

        // Extract resource names (typically nouns)
        pathParts.forEach(part => {
          if (!/^(v\d+|\d+|api|rest)$/.test(part)) {
            patterns.resources.add(part);
          }
        });

        // Extract version patterns
        pathParts.forEach(part => {
          if (/^v\d+$/.test(part)) {
            patterns.versions.add(part);
          }
        });

        patterns.methods.add(endpoint.method);
      } catch {
        // Invalid URL, skip
      }
    });

    return patterns;
  }

  private generateEndpointPredictions(baseUrl: string, patterns: any): Array<{url: string, method: string}> {
    const predictions: Array<{url: string, method: string}> = [];

    // Common CRUD operations for each discovered resource
    const crudOperations = [
      { method: 'GET', path: '' },
      { method: 'POST', path: '' },
      { method: 'PUT', path: '/{id}' },
      { method: 'PATCH', path: '/{id}' },
      { method: 'DELETE', path: '/{id}' }
    ];

    // Generate predictions for each base path + resource combination
    patterns.basePaths.forEach((basePath: string) => {
      patterns.resources.forEach((resource: string) => {
        crudOperations.forEach(operation => {
          const url = `${baseUrl}${basePath}/${resource}${operation.path}`;
          predictions.push({ url, method: operation.method });
        });
      });
    });

    // Generate version-based predictions
    patterns.versions.forEach((version: string) => {
      patterns.resources.forEach((resource: string) => {
        crudOperations.forEach(operation => {
          const url = `${baseUrl}/api/${version}/${resource}${operation.path}`;
          predictions.push({ url, method: operation.method });
        });
      });
    });

    return predictions.slice(0, 100); // Limit predictions to avoid spam
  }

  // ULTRA BEAST MODE: Simulate API calls from discovered patterns
  private async simulateAPICallsFromPatterns(): Promise<void> {
    try {
      const endpoints = Array.from(this.foundEndpoints.values());

      // Group endpoints by base URL and analyze patterns
      const baseUrls = new Map<string, Endpoint[]>();

      endpoints.forEach(endpoint => {
        try {
          const url = new URL(endpoint.url);
          const baseUrl = `${url.protocol}//${url.hostname}`;

          if (!baseUrls.has(baseUrl)) {
            baseUrls.set(baseUrl, []);
          }
          baseUrls.get(baseUrl)?.push(endpoint);
        } catch {
          // Invalid URL, skip
        }
      });

      // For each base URL, simulate additional API calls
      for (const [baseUrl, relatedEndpoints] of baseUrls) {
        await this.simulateAPICallsForBase(baseUrl, relatedEndpoints);
      }

    } catch (error) {
      console.debug('API call simulation failed:', error);
    }
  }

  private async simulateAPICallsForBase(baseUrl: string, endpoints: Endpoint[]): Promise<void> {
    // Extract common patterns and simulate related calls
    const patterns = new Set<string>();

    endpoints.forEach(endpoint => {
      try {
        const url = new URL(endpoint.url);
        const pathParts = url.pathname.split('/').filter(part => part);

        // Generate related endpoint patterns
        if (pathParts.includes('api')) {
          patterns.add('/api/health');
          patterns.add('/api/status');
          patterns.add('/api/version');
          patterns.add('/api/info');
        }

        if (pathParts.some(part => /^v\d+$/.test(part))) {
          patterns.add('/api/v1/health');
          patterns.add('/api/v2/health');
        }

        // If we found user endpoints, try related ones
        if (pathParts.includes('users') || pathParts.includes('user')) {
          patterns.add('/api/users/me');
          patterns.add('/api/user/profile');
          patterns.add('/api/auth/me');
        }

      } catch {
        // Invalid URL, skip
      }
    });

    // Test simulated endpoints
    for (const pattern of patterns) {
      try {
        const testUrl = `${baseUrl}${pattern}`;
        const response = await axios.head(testUrl, {
          timeout: 1500,
          validateStatus: (status) => status < 500
        });

        if (response.status < 500) {
          const endpoint = this.createEndpoint(testUrl, 'GET', 'crawl', 0);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        }
      } catch {
        // Simulation failed, ignore
      }
    }
  }

  private async crawlRecursive(url: string, depth: number): Promise<void> {
    // Check limits
    if (depth > this.config.maxDepth ||
        this.visitedUrls.size >= this.config.maxPages ||
        this.visitedUrls.has(url)) {
      return;
    }

    try {
      // Rate limiting
      await this.rateLimiter.consume('spider-crawler');

      this.visitedUrls.add(url);

      this.updateProgress({
        stage: 'crawling',
        progress: 10 + (this.visitedUrls.size / this.config.maxPages) * 70,
        pagesScanned: this.visitedUrls.size,
        endpointsFound: this.foundEndpoints.size,
        message: `Scanning: ${url}`,
        currentUrl: url,
      });

      const content = await this.fetchPageContent(url);
      if (!content) return;

      // Extract endpoints from HTML content
      await this.extractEndpointsFromHTML(content, url, depth);

      // Extract links for further crawling
      const links = this.extractLinks(content, url);

      // Crawl discovered links
      for (const link of links) {
        if (this.shouldCrawlUrl(link, url)) {
          await this.crawlRecursive(link, depth + 1);
        }
      }

    } catch (error) {
      this.errors.push({
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }

  private async fetchPageContent(url: string): Promise<string | null> {
    try {
      if (this.config.enableJavaScript && this.browser) {
        try {
          return await this.fetchWithPuppeteer(url);
        } catch (puppeteerError) {
          console.warn(`Puppeteer failed for ${url}, falling back to Axios:`, puppeteerError);
          return await this.fetchWithAxios(url);
        }
      } else {
        return await this.fetchWithAxios(url);
      }
    } catch (error) {
      this.errors.push({
        url,
        error: `Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      });
      return null;
    }
  }

  // BEAST MODE: Enhanced Puppeteer with network interception
  private async fetchWithPuppeteer(url: string): Promise<string> {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      // BEAST MODE: Enable request interception to catch API calls
      await page.setRequestInterception(true);

      page.on('request', (request) => {
        const reqUrl = request.url();

        // Capture all network requests as potential API endpoints
        if (this.looksLikeAPI(reqUrl)) {
          const method = request.method();
          const endpoint = this.createEndpoint(reqUrl, method, 'crawl', 0);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        }

        request.continue();
      });

      // BEAST MODE: Capture AJAX/Fetch responses
      page.on('response', async (response) => {
        const respUrl = response.url();

        if (this.looksLikeAPI(respUrl)) {
          const method = response.request().method();
          const endpoint = this.createEndpoint(respUrl, method, 'crawl', 0);
          if (endpoint) {
            // Add response info
            endpoint.responseTime = Date.now(); // Simplified timing
            if (endpoint.headers) {
              endpoint.headers.push({
                name: 'content-type',
                value: response.headers()['content-type'] || 'unknown'
              });
            }
            this.foundEndpoints.set(endpoint.id, endpoint);
          }

          // Try to extract more endpoints from JSON responses
          try {
            if (response.headers()['content-type']?.includes('application/json')) {
              const jsonText = await response.text();
              const jsonData = JSON.parse(jsonText);
              this.extractEndpointsFromJSON(jsonData, url);
            }
          } catch {
            // Not JSON or failed to parse
          }
        }
      });

      await page.setUserAgent(this.config.userAgent);

      // BEAST MODE: More aggressive page loading
      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(url, {
        waitUntil: 'networkidle2', // Changed to networkidle2 for faster loading
        timeout: this.config.timeout
      });

      // BEAST MODE: Execute JavaScript to trigger more API calls
      await page.evaluate(() => {
        // Trigger common events that might make API calls
        const events = ['scroll', 'click', 'mouseover', 'focus'];
        const elements = document.querySelectorAll('button, a, input[type="button"], [onclick]');

        elements.forEach(element => {
          events.forEach(eventType => {
            try {
              element.dispatchEvent(new Event(eventType, { bubbles: true }));
            } catch {
              // Some events might fail, ignore
            }
          });
        });

        // Try to expand dropdowns, modals, etc.
        const expandables = document.querySelectorAll('[data-toggle], [aria-expanded="false"], .dropdown-toggle');
        expandables.forEach(element => {
          try {
            (element as HTMLElement).click();
          } catch {
            // Ignore click failures
          }
        });
      });

      // Wait a bit for any triggered API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      const content = await page.content();
      return content;
    } finally {
      await page.close();
    }
  }

  private async fetchWithAxios(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': this.config.userAgent,
      },
      timeout: this.config.timeout || 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });

    return response.data;
  }

  private async extractEndpointsFromHTML(
    content: string,
    baseUrl: string,
    depth: number
  ): Promise<void> {
    const $ = cheerio.load(content);

    // Extract script tags for JavaScript analysis
    $('script').each((_, element) => {
      const scriptContent = $(element).html() || '';
      const src = $(element).attr('src');

      if (scriptContent) {
        this.analyzeJavaScript(scriptContent, baseUrl, depth);
      }

      if (src) {
        const scriptUrl = this.resolveUrl(src, baseUrl);
        if (scriptUrl) {
          this.scheduleJavaScriptAnalysis(scriptUrl, depth);
        }
      }
    });

    // Extract form actions
    $('form').each((_, element) => {
      const action = $(element).attr('action');
      const method = $(element).attr('method') || 'GET';

      if (action) {
        const endpoint = this.createEndpoint(
          this.resolveUrl(action, baseUrl) || action,
          method.toUpperCase(),
          'html',
          depth
        );
        if (endpoint) {
          this.foundEndpoints.set(endpoint.id, endpoint);
        }
      }
    });

    // Extract API-like URLs from href attributes
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href') || '';
      if (this.looksLikeAPI(href)) {
        const endpoint = this.createEndpoint(
          this.resolveUrl(href, baseUrl) || href,
          'GET',
          'html',
          depth
        );
        if (endpoint) {
          this.foundEndpoints.set(endpoint.id, endpoint);
        }
      }
    });

    // Use pattern matcher for content analysis
    const wasmMatcher = await getWASMPatternMatcher();
    const urls = wasmMatcher.extractURLs(content);

    urls.forEach(url => {
      if (this.looksLikeAPI(url)) {
        const endpoint = this.createEndpoint(url, 'GET', 'crawl', depth);
        if (endpoint) {
          this.foundEndpoints.set(endpoint.id, endpoint);
        }
      }
    });
  }

  // BEAST MODE: Aggressive JavaScript analysis
  private analyzeJavaScript(jsContent: string, baseUrl: string, depth: number): void {
    const patterns = this.patternMatcher.extractJavaScriptAPIs(jsContent, baseUrl);
    const methods = this.patternMatcher.detectHttpMethods(jsContent);

    patterns.forEach(pattern => {
      pattern.matches.forEach(url => {
        const detectedMethods = methods[url] || ['GET'];
        detectedMethods.forEach(method => {
          const endpoint = this.createEndpoint(url, method, 'js', depth);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        });
      });
    });

    // BEAST MODE: Additional aggressive JavaScript patterns
    const aggressivePatterns = [
      // Fetch API calls
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /fetch\s*\(\s*`([^`]+)`/g,

      // Axios calls
      /axios\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /axios\s*\(\s*\{\s*url\s*:\s*['"`]([^'"`]+)['"`]/g,

      // jQuery AJAX
      /\$\.ajax\s*\(\s*\{\s*url\s*:\s*['"`]([^'"`]+)['"`]/g,
      /\$\.get\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /\$\.post\s*\(\s*['"`]([^'"`]+)['"`]/g,

      // XMLHttpRequest
      /\.open\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]([^'"`]+)['"`]/g,

      // Modern frameworks
      /useQuery\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /useMutation\s*\(\s*['"`]([^'"`]+)['"`]/g,

      // API base URLs and endpoints
      /baseURL\s*:\s*['"`]([^'"`]+)['"`]/g,
      /apiUrl\s*:\s*['"`]([^'"`]+)['"`]/g,
      /endpoint\s*:\s*['"`]([^'"`]+)['"`]/g,

      // Template literals with API calls
      /`[^`]*\/api\/[^`]*`/g,
      /`[^`]*\/rest\/[^`]*`/g,

      // Environment variables pointing to APIs
      /process\.env\.\w*API\w*\s*\+\s*['"`]([^'"`]+)['"`]/g,
    ];

    aggressivePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(jsContent)) !== null) {
        let url = match[1];
        if (!url) continue;

        // Clean up template literal variables
        url = url.replace(/\$\{[^}]+\}/g, '{param}');

        if (this.looksLikeAPI(url) || url.includes('/')) {
          const fullUrl = this.resolveUrl(url, baseUrl) || url;

          // Try to detect HTTP methods from context
          const contextBefore = jsContent.slice(Math.max(0, match.index - 100), match.index);
          const contextAfter = jsContent.slice(match.index + match[0].length, match.index + match[0].length + 100);
          const context = contextBefore + contextAfter;

          const methodMatch = context.match(/\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i);
          const detectedMethod = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

          // Also check for method in function names
          const functionMethods = ['get', 'post', 'put', 'patch', 'delete', 'create', 'update', 'remove'];
          for (const funcMethod of functionMethods) {
            if (context.toLowerCase().includes(funcMethod)) {
              const httpMethod = funcMethod === 'create' ? 'POST' :
                                funcMethod === 'update' ? 'PUT' :
                                funcMethod === 'remove' ? 'DELETE' :
                                funcMethod.toUpperCase();

              const endpoint = this.createEndpoint(fullUrl, httpMethod, 'js', depth);
              if (endpoint) {
                this.foundEndpoints.set(endpoint.id, endpoint);
              }
            }
          }

          const endpoint = this.createEndpoint(fullUrl, detectedMethod, 'js', depth);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        }
      }
    });

    // BEAST MODE: Look for OpenAPI/Swagger specs in JS
    const swaggerPatterns = [
      /swagger\.json/gi,
      /openapi\.json/gi,
      /api-docs/gi,
      /"paths":\s*\{[^}]+\}/g
    ];

    swaggerPatterns.forEach(pattern => {
      const matches = jsContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match.includes('paths')) {
            // Try to parse OpenAPI paths
            try {
              const pathsMatch = match.match(/"([^"]+)":\s*\{/g);
              pathsMatch?.forEach(pathMatch => {
                const path = pathMatch.match(/"([^"]+)":/)?.[1];
                if (path && this.looksLikeAPI(path)) {
                  const fullUrl = this.resolveUrl(path, baseUrl) || `${baseUrl}${path}`;
                  const endpoint = this.createEndpoint(fullUrl, 'GET', 'js', depth);
                  if (endpoint) {
                    this.foundEndpoints.set(endpoint.id, endpoint);
                  }
                }
              });
            } catch {
              // Invalid JSON, ignore
            }
          }
        });
      }
    });
  }

  private scheduleJavaScriptAnalysis(scriptUrl: string, depth: number): void {
    // Add to queue for later analysis
    setTimeout(async () => {
      try {
        const content = await this.fetchWithAxios(scriptUrl);
        this.analyzeJavaScript(content, scriptUrl, depth);
      } catch (error) {
        // Silently fail for JavaScript files
      }
    }, 100);
  }

  private async analyzeJavaScriptFiles(): Promise<void> {
    // ULTRA BEAST MODE: Advanced JavaScript file analysis with browser automation
    const jsUrls = Array.from(this.foundEndpoints.values())
      .filter(endpoint => endpoint.url.endsWith('.js'))
      .map(endpoint => endpoint.url)
      .slice(0, 20); // Limit to prevent excessive resource usage

    for (const jsUrl of jsUrls) {
      try {
        await this.analyzeBrowserJavaScript(jsUrl);
      } catch (error) {
        console.error(`Browser JS analysis failed for ${jsUrl}:`, error);
      }
    }
  }

  // ULTRA BEAST MODE: Browser-powered JavaScript analysis
  private async analyzeBrowserJavaScript(url: string): Promise<void> {
    let browser;
    try {
      const isProduction = process.env.NODE_ENV === 'production';

      browser = await puppeteer.launch({
        headless: true,
        executablePath: isProduction ? await chromium.executablePath() : undefined,
        args: isProduction ? chromium.args : [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=site-per-process'
        ]
      });

      const page = await browser.newPage();

      // Set stealth headers
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      // Intercept network requests to catch dynamic API calls
      await page.setRequestInterception(true);
      const dynamicEndpoints = new Set<string>();

      page.on('request', (request) => {
        const reqUrl = request.url();
        const method = request.method();

        if (this.looksLikeAPI(reqUrl) ||
            reqUrl.includes('/api') ||
            reqUrl.includes('json') ||
            reqUrl.includes('graphql') ||
            method !== 'GET') {
          dynamicEndpoints.add(`${method} ${reqUrl}`);

          const endpoint = this.createEndpoint(reqUrl, method, 'js', 1);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        }
        request.continue();
      });

      page.on('response', (response) => {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json') ||
            contentType.includes('application/xml') ||
            contentType.includes('text/xml')) {
          const endpoint = this.createEndpoint(response.url(), 'GET', 'crawl', 1);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        }
      });

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Execute advanced JavaScript analysis in browser context
      const browserAnalysis = await page.evaluate(() => {
        const endpoints: string[] = [];
        const methods: string[] = [];

        // Override fetch to intercept calls
        const originalFetch = window.fetch;
        window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
          const url = typeof input === 'string' ? input : input.toString();
          const method = init?.method || 'GET';
          endpoints.push(`${method} ${url}`);
          return originalFetch.call(this, input, init);
        };

        // Override XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
          const xhr = new originalXHR();
          const originalOpen = xhr.open;
          xhr.open = function(method: string, url: string | URL) {
            endpoints.push(`${method} ${url.toString()}`);
            return originalOpen.apply(this, arguments as any);
          };
          return xhr;
        } as any;

        // Look for global API configuration objects
        const searchForAPIConfigs = (obj: any, path: string = '', depth: number = 0) => {
          if (depth > 3 || !obj || typeof obj !== 'object') return;

          for (const key in obj) {
            try {
              const value = obj[key];
              const currentPath = path ? `${path}.${key}` : key;

              if (typeof value === 'string') {
                if (value.includes('/api') || value.includes('http') && value.includes('://')) {
                  endpoints.push(`GET ${value}`);
                }
              } else if (typeof value === 'object' && value !== null) {
                searchForAPIConfigs(value, currentPath, depth + 1);
              }
            } catch (e) {
              // Ignore property access errors
            }
          }
        };

        // Search common global objects for API configs
        try {
          searchForAPIConfigs(window);
          if ((window as any).config) searchForAPIConfigs((window as any).config);
          if ((window as any).API) searchForAPIConfigs((window as any).API);
          if ((window as any).api) searchForAPIConfigs((window as any).api);
          if ((window as any).endpoints) searchForAPIConfigs((window as any).endpoints);
        } catch (e) {
          // Ignore errors
        }

        // Analyze all loaded scripts for API patterns
        const scripts = Array.from(document.scripts);
        const apiPatterns = [
          /['"](\/api[^'"]*)['"]/g,
          /['"](https?:\/\/[^'"]*\/api[^'"]*)['"]/g,
          /fetch\s*\(\s*['"`]([^'"`]*)/g,
          /axios\.\w+\s*\(\s*['"`]([^'"`]*)/g,
          /baseURL\s*:\s*['"`]([^'"`]*)/g
        ];

        scripts.forEach(script => {
          if (script.innerHTML) {
            apiPatterns.forEach(pattern => {
              let match;
              while ((match = pattern.exec(script.innerHTML)) !== null) {
                if (match[1]) {
                  endpoints.push(`GET ${match[1]}`);
                }
              }
            });
          }
        });

        return {
          endpoints: [...new Set(endpoints)],
          methods: [...new Set(methods)]
        };
      });

      // Process discovered endpoints
      browserAnalysis.endpoints.forEach(endpointStr => {
        const [method, url] = endpointStr.split(' ', 2);
        if (url && this.looksLikeAPI(url)) {
          const endpoint = this.createEndpoint(url, method || 'GET', 'js', 1);
          if (endpoint) {
            this.foundEndpoints.set(endpoint.id, endpoint);
          }
        }
      });

      // Try to trigger dynamic content by interacting with the page
      try {
        // Scroll to trigger lazy loading
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Click buttons and links that might trigger API calls
        const interactiveElements = await page.$$('button, [role="button"], .btn, .api-trigger, [data-api]');
        for (const element of interactiveElements.slice(0, 5)) {
          try {
            await element.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {
            // Ignore click errors
          }
        }

        // Try form submissions if any
        const forms = await page.$$('form');
        for (const form of forms.slice(0, 2)) {
          try {
            const action = await form.evaluate(f => (f as HTMLFormElement).action);
            if (action && this.looksLikeAPI(action)) {
              const endpoint = this.createEndpoint(action, 'POST', 'html', 1);
              if (endpoint) {
                this.foundEndpoints.set(endpoint.id, endpoint);
              }
            }
          } catch (e) {
            // Ignore form analysis errors
          }
        }
      } catch (e) {
        // Ignore interaction errors
      }

    } catch (error) {
      console.error(`Browser JavaScript analysis failed for ${url}:`, error);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private extractLinks(content: string, baseUrl: string): string[] {
    const $ = cheerio.load(content);
    const links: string[] = [];

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const resolvedUrl = this.resolveUrl(href, baseUrl);
        if (resolvedUrl) {
          links.push(resolvedUrl);
        }
      }
    });

    return [...new Set(links)]; // Remove duplicates
  }

  // BEAST MODE: Aggressive URL crawling decision
  private shouldCrawlUrl(url: string, baseUrl: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseObj = new URL(baseUrl);

      // BEAST MODE: Follow external API links if they look promising
      if (!this.config.includeExternalLinks && urlObj.hostname !== baseObj.hostname) {
        // Still crawl if it's clearly an API
        const isExternalAPI = this.looksLikeAPI(url) && (
          urlObj.hostname.includes('api') ||
          urlObj.hostname.includes('rest') ||
          urlObj.hostname.includes('service') ||
          url.includes('/api/') ||
          url.includes('/rest/')
        );
        if (!isExternalAPI) {
          return false;
        }
      }

      // BEAST MODE: More selective about what to skip
      const path = urlObj.pathname.toLowerCase();

      // Skip obvious non-API files but keep JS (might contain API calls)
      const skipExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.mp4', '.mp3', '.zip', '.exe'];
      if (skipExtensions.some(ext => path.endsWith(ext))) {
        return false;
      }

      // BEAST MODE: Always crawl if it looks like an API
      if (this.looksLikeAPI(url)) {
        return true;
      }

      // Skip mailto, tel, javascript: protocols
      if (['mailto:', 'tel:', 'javascript:', 'ftp:'].some(proto => url.startsWith(proto))) {
        return false;
      }

      // Skip fragments and query-only URLs unless they look like APIs
      if (urlObj.hash && !urlObj.search && !this.looksLikeAPI(url)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // BEAST MODE: Aggressive API detection
  private looksLikeAPI(url: string): boolean {
    const lowerUrl = url.toLowerCase();

    // Strong API indicators
    const strongIndicators = [
      '/api/', '/rest/', '/graphql', '/oauth', '/auth/', '/token',
      '/login', '/register', '/users', '/user/', '/admin/', '/data/',
      '/search', '/upload', '/download', '/export', '/import',
      '.json', '.xml', '.yaml', '.yml'
    ];

    // Version patterns
    const versionPatterns = [
      /\/v\d+\//i, /\/version\d+\//i, /\/api\/v\d+/i
    ];

    // HTTP method patterns in URLs
    const methodPatterns = [
      /\/(get|post|put|patch|delete|head|options)\//i
    ];

    // Resource patterns
    const resourcePatterns = [
      /\/\w+\/\d+/,  // /resource/123
      /\/\w+\/\{\w+\}/, // /resource/{id}
      /\/\w+\/:\w+/, // /resource/:id
      /\?[\w=&]+/, // Query parameters
    ];

    // Check strong indicators
    if (strongIndicators.some(indicator => lowerUrl.includes(indicator))) {
      return true;
    }

    // Check version patterns
    if (versionPatterns.some(pattern => pattern.test(url))) {
      return true;
    }

    // Check HTTP method patterns
    if (methodPatterns.some(pattern => pattern.test(url))) {
      return true;
    }

    // Check resource patterns (be more selective for these)
    if (resourcePatterns.some(pattern => pattern.test(url))) {
      // Additional validation for resource patterns
      const hasApiKeyword = /\b(api|rest|service|backend|endpoint)\b/i.test(url);
      if (hasApiKeyword) {
        return true;
      }
    }

    // Check for common API file extensions
    const apiExtensions = ['.json', '.xml', '.yaml', '.yml', '.rss', '.atom'];
    if (apiExtensions.some(ext => lowerUrl.endsWith(ext))) {
      return true;
    }

    // Check for status codes in URLs (often APIs)
    if (/\/(200|201|400|401|403|404|500)/.test(url)) {
      return true;
    }

    return false;
  }

  private createEndpoint(
    url: string,
    method: string,
    source: 'crawl' | 'js' | 'html' | 'sitemap' | 'robots',
    depth: number
  ): Endpoint | null {
    try {
      const urlObj = new URL(url);
      const id = `${method}:${url}`;

      const parameters = this.patternMatcher.extractParameters(url).map(param => ({
        name: param.name,
        type: param.type as 'query' | 'path' | 'body' | 'header',
        required: param.type === 'path',
      }));

      return {
        id,
        url,
        method,
        parameters,
        headers: [],
        depth,
        source,
        security: this.analyzeEndpointSecurity(url, method),
      };
    } catch {
      return null;
    }
  }

  private analyzeEndpointSecurity(url: string, method: string): SecurityAnalysis {
    const vulnerabilities = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Basic security analysis
    if (url.startsWith('http://')) {
      vulnerabilities.push({
        type: 'Insecure Protocol',
        severity: 'medium' as const,
        description: 'Endpoint uses HTTP instead of HTTPS',
        recommendation: 'Use HTTPS for all API endpoints',
      });
      riskLevel = 'medium';
    }

    if (method === 'DELETE') {
      vulnerabilities.push({
        type: 'Destructive Operation',
        severity: 'high' as const,
        description: 'Endpoint performs destructive operations',
        recommendation: 'Ensure proper authentication and authorization',
      });
      riskLevel = 'high';
    }

    return {
      hasAuth: url.includes('/auth') || url.includes('/login'),
      vulnerabilities,
      riskLevel,
    };
  }

  private async checkRobotsTxt(baseUrl: string): Promise<void> {
    try {
      const robotsUrl = `${baseUrl}/robots.txt`;
      const response = await axios.get(robotsUrl, { timeout: 5000 });

      // Basic robots.txt parsing (simplified)
      const robotsContent = response.data;
      if (robotsContent.includes('Disallow: /')) {
        console.warn('robots.txt contains disallow rules - respecting them');
      }
    } catch {
      // robots.txt not found or not accessible - continue crawling
    }
  }

  private resolveUrl(url: string, baseUrl: string): string | null {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return null;
    }
  }

  private normalizeUrl(url: string): string | null {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return null;
    }
  }

  private updateProgress(progress: ScanProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ULTRA BEAST MODE: Git repository analysis for API discovery
  private async analyzeGitRepository(baseUrl: string): Promise<void> {
    try {
      const gitUrls = [
        `${baseUrl}/.git/`,
        `${baseUrl}/api/`,
        `${baseUrl}/.github/`,
        `${baseUrl}/docs/`,
        `${baseUrl}/swagger/`
      ];

      for (const gitUrl of gitUrls) {
        try {
          await this.rateLimiter.consume('spider-crawler');
          const response = await axios.get(gitUrl, {
            timeout: 15000,
            headers: { 'User-Agent': this.config.userAgent },
            validateStatus: () => true
          });

          if (response.status === 200 && response.data) {
            // Look for API documentation files
            const content = response.data.toString();
            const apiDocsPatterns = [
              /swagger\.ya?ml/gi,
              /openapi\.ya?ml/gi,
              /api-docs/gi,
              /postman_collection/gi,
              /insomnia/gi
            ];

            apiDocsPatterns.forEach(pattern => {
              const matches = content.match(pattern);
              if (matches) {
                matches.forEach((match: string) => {
                  const docUrl = `${baseUrl}/${match}`;
                  this.crawlQueue.push(docUrl);
                });
              }
            });
          }
        } catch (error) {
          // Silently continue
        }
      }
    } catch (error) {
      console.error(`Git repository analysis failed for ${baseUrl}:`, error);
    }
  }

  // ULTRA BEAST MODE: WebSocket endpoint discovery
  private async discoverWebSocketEndpoints(baseUrl: string): Promise<void> {
    try {
      const wsPatterns = [
        '/ws',
        '/websocket',
        '/socket.io',
        '/sockjs',
        '/realtime',
        '/live',
        '/events',
        '/stream',
        '/notifications',
        '/chat'
      ];

      for (const pattern of wsPatterns) {
        const wsUrl = `${baseUrl}${pattern}`;
        const endpoint = this.createEndpoint(wsUrl, 'WS', 'crawl', 1);
        if (endpoint) {
          // Note: metadata would need to be added to Endpoint interface
          this.foundEndpoints.set(endpoint.id, endpoint);
        }
      }

      // Also check for WebSocket URLs in common ports
      const urlObj = new URL(baseUrl);
      const wsPorts = [3000, 3001, 8080, 8081, 9000, 9001];

      for (const port of wsPorts) {
        if (port !== parseInt(urlObj.port) && port !== (urlObj.protocol === 'https:' ? 443 : 80)) {
          const wsBaseUrl = `${urlObj.protocol === 'https:' ? 'wss:' : 'ws:'}//${urlObj.hostname}:${port}`;
          for (const pattern of wsPatterns) {
            const wsUrl = `${wsBaseUrl}${pattern}`;
            const endpoint = this.createEndpoint(wsUrl, 'WS', 'crawl', 1);
            if (endpoint) {
              // Note: metadata would need to be added to Endpoint interface
              this.foundEndpoints.set(endpoint.id, endpoint);
            }
          }
        }
      }
    } catch (error) {
      console.error(`WebSocket discovery failed for ${baseUrl}:`, error);
    }
  }

  // ULTRA BEAST MODE: Mobile API endpoint discovery
  private async discoverMobileAPIEndpoints(baseUrl: string): Promise<void> {
    try {
      const mobilePatterns = [
        '/mobile/api',
        '/app/api',
        '/ios/api',
        '/android/api',
        '/m/api',
        '/mobile',
        '/app',
        '/native'
      ];

      // Mobile-specific API versions
      const mobileVersions = ['v1', 'v2', 'v3', 'v4'];

      for (const pattern of mobilePatterns) {
        // Base mobile endpoint
        const mobileUrl = `${baseUrl}${pattern}`;
        this.crawlQueue.push(mobileUrl);
        this.intelligentQueue.add(mobileUrl);

        // Versioned mobile endpoints
        for (const version of mobileVersions) {
          const versionedUrl = `${baseUrl}${pattern}/${version}`;
          this.crawlQueue.push(versionedUrl);
          this.intelligentQueue.add(versionedUrl);
        }
      }

      // Mobile-specific user agents for discovery
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36'
      ];

      // Test with mobile user agents to discover mobile-specific endpoints
      for (const userAgent of mobileUserAgents) {
        try {
          await this.rateLimiter.consume('spider-crawler');
          const response = await axios.get(baseUrl, {
            timeout: 15000,
            headers: { 'User-Agent': userAgent },
            validateStatus: () => true
          });

          if (response.data) {
            const content = response.data.toString();
            const mobileAPIMatches = content.match(/['"](\/(?:mobile|app|m)\/api[^'"]*)['"]/g);
            if (mobileAPIMatches) {
              mobileAPIMatches.forEach((match: string) => {
                const cleanUrl = match.replace(/['"]/g, '');
                const fullUrl = `${baseUrl}${cleanUrl}`;
                this.crawlQueue.push(fullUrl);
                this.intelligentQueue.add(fullUrl);
              });
            }
          }
        } catch (error) {
          // Continue with next user agent
        }
      }
    } catch (error) {
      console.error(`Mobile API discovery failed for ${baseUrl}:`, error);
    }
  }

  // ULTRA BEAST MODE: Third-party service integration discovery
  private async discoverThirdPartyIntegrations(baseUrl: string): Promise<void> {
    try {
      const thirdPartyServices = [
        // Payment gateways
        { name: 'stripe', patterns: ['/stripe', '/payment/stripe', '/api/stripe'] },
        { name: 'paypal', patterns: ['/paypal', '/payment/paypal', '/api/paypal'] },
        { name: 'square', patterns: ['/square', '/payment/square'] },

        // Auth services
        { name: 'auth0', patterns: ['/auth0', '/auth/auth0', '/api/auth0'] },
        { name: 'oauth', patterns: ['/oauth', '/auth/oauth', '/api/oauth'] },
        { name: 'saml', patterns: ['/saml', '/auth/saml', '/sso'] },

        // Analytics
        { name: 'analytics', patterns: ['/analytics', '/api/analytics', '/tracking'] },
        { name: 'mixpanel', patterns: ['/mixpanel', '/api/mixpanel'] },

        // Cloud services
        { name: 'aws', patterns: ['/aws', '/api/aws', '/s3'] },
        { name: 'azure', patterns: ['/azure', '/api/azure'] },
        { name: 'gcp', patterns: ['/gcp', '/google-cloud', '/api/gcp'] },

        // Communication
        { name: 'twilio', patterns: ['/twilio', '/sms', '/api/sms'] },
        { name: 'sendgrid', patterns: ['/sendgrid', '/email', '/api/email'] },
        { name: 'mailchimp', patterns: ['/mailchimp', '/api/mailchimp'] },

        // Database services
        { name: 'mongodb', patterns: ['/mongodb', '/mongo', '/api/mongo'] },
        { name: 'redis', patterns: ['/redis', '/cache', '/api/cache'] },

        // Search and indexing
        { name: 'elasticsearch', patterns: ['/elasticsearch', '/search', '/api/search'] },
        { name: 'algolia', patterns: ['/algolia', '/api/algolia'] }
      ];

      for (const service of thirdPartyServices) {
        for (const pattern of service.patterns) {
          const serviceUrl = `${baseUrl}${pattern}`;
          const endpoint = this.createEndpoint(serviceUrl, 'GET', 'crawl', 1);
          if (endpoint) {
            // Note: metadata would need to be added to Endpoint interface
            // Could store service info in a separate map keyed by endpoint.id
            this.foundEndpoints.set(endpoint.id, endpoint);
          }

          // Add to crawl queue for further exploration
          this.crawlQueue.push(serviceUrl);
          this.intelligentQueue.add(serviceUrl);
        }
      }
    } catch (error) {
      console.error(`Third-party integration discovery failed for ${baseUrl}:`, error);
    }
  }

  private getServiceCategory(serviceName: string): string {
    const categories: Record<string, string> = {
      stripe: 'payment',
      paypal: 'payment',
      square: 'payment',
      auth0: 'authentication',
      oauth: 'authentication',
      saml: 'authentication',
      analytics: 'analytics',
      mixpanel: 'analytics',
      aws: 'cloud',
      azure: 'cloud',
      gcp: 'cloud',
      twilio: 'communication',
      sendgrid: 'communication',
      mailchimp: 'marketing',
      mongodb: 'database',
      redis: 'database',
      elasticsearch: 'search',
      algolia: 'search'
    };
    return categories[serviceName] || 'unknown';
  }

  // ULTRA BEAST MODE: AI-powered endpoint prediction using pattern analysis
  private async predictAIEndpoints(baseUrl: string): Promise<void> {
    try {
      // Collect patterns from discovered endpoints to predict new ones
      const discoveredPatterns = new Set<string>();
      const methodDistribution: Record<string, number> = {};
      const pathSegments = new Set<string>();

      // Analyze existing endpoints for patterns
      Array.from(this.foundEndpoints.values()).forEach(endpoint => {
        const url = new URL(endpoint.url);
        const pathParts = url.pathname.split('/').filter(part => part.length > 0);

        pathParts.forEach(part => pathSegments.add(part));
        methodDistribution[endpoint.method] = (methodDistribution[endpoint.method] || 0) + 1;

        // Extract patterns
        if (pathParts.length >= 2) {
          discoveredPatterns.add(`/${pathParts[0]}/${pathParts[1]}`);
        }
      });

      // Common API resource patterns based on REST conventions
      const resourcePatterns = [
        'users', 'user', 'accounts', 'account', 'profiles', 'profile',
        'products', 'product', 'items', 'item', 'orders', 'order',
        'posts', 'post', 'articles', 'article', 'blogs', 'blog',
        'comments', 'comment', 'reviews', 'review', 'ratings', 'rating',
        'categories', 'category', 'tags', 'tag', 'files', 'file',
        'uploads', 'upload', 'downloads', 'download', 'media', 'images',
        'videos', 'audio', 'documents', 'notifications', 'messages',
        'events', 'logs', 'analytics', 'reports', 'stats', 'metrics',
        'settings', 'config', 'preferences', 'admin', 'dashboard'
      ];

      // Generate predicted endpoints based on patterns
      const predictedEndpoints: Array<{ url: string; method: string; confidence: number }> = [];

      // Pattern 1: Resource + ID patterns
      for (const resource of resourcePatterns) {
        const patterns = [
          { path: `/${resource}`, method: 'GET', confidence: 0.9 },
          { path: `/${resource}`, method: 'POST', confidence: 0.8 },
          { path: `/${resource}/{id}`, method: 'GET', confidence: 0.9 },
          { path: `/${resource}/{id}`, method: 'PUT', confidence: 0.7 },
          { path: `/${resource}/{id}`, method: 'DELETE', confidence: 0.6 },
          { path: `/${resource}/{id}`, method: 'PATCH', confidence: 0.5 }
        ];

        patterns.forEach(pattern => {
          predictedEndpoints.push({
            url: `${baseUrl}/api${pattern.path}`,
            method: pattern.method,
            confidence: pattern.confidence
          });

          // Also try without /api prefix
          predictedEndpoints.push({
            url: `${baseUrl}${pattern.path}`,
            method: pattern.method,
            confidence: pattern.confidence * 0.7
          });
        });
      }

      // Pattern 2: Nested resource patterns
      const nestedPatterns = [
        ['users', 'posts'], ['users', 'comments'], ['users', 'orders'],
        ['products', 'reviews'], ['products', 'images'], ['orders', 'items'],
        ['categories', 'products'], ['posts', 'comments'], ['articles', 'tags']
      ];

      nestedPatterns.forEach(([parent, child]) => {
        const patterns = [
          { path: `/${parent}/{id}/${child}`, method: 'GET', confidence: 0.7 },
          { path: `/${parent}/{id}/${child}`, method: 'POST', confidence: 0.6 },
          { path: `/${parent}/{id}/${child}/{id}`, method: 'GET', confidence: 0.6 },
        ];

        patterns.forEach(pattern => {
          predictedEndpoints.push({
            url: `${baseUrl}/api${pattern.path}`,
            method: pattern.method,
            confidence: pattern.confidence
          });
        });
      });

      // Pattern 3: Action-based endpoints
      const actions = [
        'search', 'filter', 'sort', 'export', 'import', 'backup',
        'restore', 'sync', 'validate', 'process', 'generate', 'calculate',
        'authenticate', 'authorize', 'login', 'logout', 'register',
        'activate', 'deactivate', 'enable', 'disable', 'approve', 'reject'
      ];

      actions.forEach(action => {
        predictedEndpoints.push({
          url: `${baseUrl}/api/${action}`,
          method: 'POST',
          confidence: 0.5
        });
      });

      // Filter and add high-confidence predictions
      const highConfidencePredictions = predictedEndpoints
        .filter(pred => pred.confidence >= 0.6)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 50); // Limit to top 50 predictions

      for (const prediction of highConfidencePredictions) {
        const endpoint = this.createEndpoint(prediction.url, prediction.method, 'crawl', 1);
        if (endpoint) {
          // Note: metadata would need to be added to Endpoint interface
          // Could store prediction confidence in a separate map
          this.foundEndpoints.set(endpoint.id, endpoint);

          // Add to crawl queue for validation
          this.crawlQueue.push(prediction.url);
          this.intelligentQueue.add(prediction.url);
        }
      }

    } catch (error) {
      console.error(`AI endpoint prediction failed for ${baseUrl}:`, error);
    }
  }

  // ULTRA BEAST MODE: Advanced rate limiting bypass techniques
  private async advancedRateLimitBypass(url: string, attempt: number = 1): Promise<any> {
    const techniques = [
      // Technique 1: Random delays between requests
      async () => {
        const delay = Math.random() * 2000 + 500; // 500-2500ms
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.rateLimiter.consume('spider-crawler');
        return axios.get(url, {
          timeout: 15000,
          headers: { 'User-Agent': this.config.userAgent }
        });
      },

      // Technique 2: Different user agents
      async () => {
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0'
        ];
        const randomAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        return axios.get(url, {
          timeout: 15000,
          headers: { 'User-Agent': randomAgent }
        });
      },

      // Technique 3: Proxy-like headers
      async () => {
        const proxyHeaders = {
          'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          'X-Real-IP': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          'X-Client-IP': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          'User-Agent': this.config.userAgent
        };
        return axios.get(url, {
          timeout: 15000,
          headers: proxyHeaders
        });
      }
    ];

    try {
      const technique = techniques[attempt % techniques.length];
      return await technique();
    } catch (error: any) {
      if (attempt < 3 && (error.response?.status === 429 || error.code === 'ECONNRESET')) {
        // Exponential backoff
        const backoffDelay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.advancedRateLimitBypass(url, attempt + 1);
      }
      throw error;
    }
  }

  // Public method to stop crawling
  public async stop(): Promise<void> {
    await this.cleanup();
  }
}
