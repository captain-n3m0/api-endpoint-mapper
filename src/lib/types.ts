export interface Endpoint {
  id: string;
  url: string;
  method: string;
  parameters: Parameter[];
  headers: Header[];
  responseType?: string;
  statusCode?: number;
  responseSize?: number;
  responseTime?: number;
  depth: number;
  source: 'crawl' | 'js' | 'html' | 'sitemap' | 'robots';
  security?: SecurityAnalysis;
}

export interface Parameter {
  name: string;
  type: 'query' | 'path' | 'body' | 'header';
  required: boolean;
  description?: string;
  example?: string;
}

export interface Header {
  name: string;
  value: string;
}

export interface SecurityAnalysis {
  hasAuth: boolean;
  authType?: 'basic' | 'bearer' | 'oauth' | 'api-key' | 'unknown';
  vulnerabilities: SecurityVulnerability[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation?: string;
}

export interface CrawlResult {
  domain: string;
  endpoints: Endpoint[];
  totalPages: number;
  totalTime: number;
  errors: CrawlError[];
  stats: CrawlStats;
}

export interface CrawlError {
  url: string;
  error: string;
  timestamp: Date;
}

export interface CrawlStats {
  pagesScanned: number;
  endpointsFound: number;
  jsFilesAnalyzed: number;
  apiCallsDetected: number;
  uniqueDomains: number;
  avgResponseTime: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'domain' | 'endpoint' | 'parameter';
  method?: string;
  statusCode?: number;
  security?: 'safe' | 'warning' | 'danger';
  size?: number;
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'contains' | 'calls' | 'references';
  strength?: number;
}

export interface ScanProgress {
  stage: 'initializing' | 'crawling' | 'analyzing' | 'processing' | 'completed' | 'error';
  progress: number;
  currentUrl?: string;
  pagesScanned: number;
  endpointsFound: number;
  message: string;
}

export interface ScannerConfig {
  maxDepth: number;
  maxPages: number;
  respectRobots: boolean;
  includeExternalLinks: boolean;
  crawlDelay: number;
  userAgent: string;
  enableJavaScript: boolean;
  timeout: number;
}

export interface PatternMatch {
  pattern: string;
  matches: string[];
  confidence: number;
}
