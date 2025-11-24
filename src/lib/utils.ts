import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function isValidDomain(domain: string): boolean {
  // Remove protocol and path if present
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];

  // Allow localhost
  if (cleanDomain === 'localhost') {
    return true;
  }

  // Allow IP addresses (basic check)
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipRegex.test(cleanDomain)) {
    return true;
  }

  // Allow standard domain names with subdomains (much more flexible)
  // This regex handles: domain.com, subdomain.domain.com, api.github.com, etc.
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (domainRegex.test(cleanDomain) && cleanDomain.includes('.')) {
    return true;
  }

  // Allow single word domains (for testing)
  const singleWordRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/;
  if (singleWordRegex.test(cleanDomain) && cleanDomain.length >= 2) {
    return true;
  }

  return false;
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash and fragment
    const normalized = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`.replace(/\/$/, '');
    return normalized || urlObj.origin;
  } catch {
    return url;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Utility function to get the proper base URL for API calls
export function getBaseUrl(request?: { headers: { get(name: string): string | null } }): string {
  // In development, always use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Try to get from environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // If we have request headers, construct from them
  if (request?.headers) {
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    if (host) {
      return `${protocol}://${host}`;
    }
  }

  // Fallback - this shouldn't happen in production
  return typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
}
