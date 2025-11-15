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
