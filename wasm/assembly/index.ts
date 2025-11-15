// AssemblyScript WebAssembly module for fast pattern matching
// This provides high-performance endpoint detection

export function matchAPIPatterns(content: string): i32[] {
  const results: i32[] = [];

  // Fast string searching for common API patterns
  const apiPatterns = [
    "/api/",
    "/rest/",
    "/graphql",
    "fetch(",
    "axios.",
    ".json",
    "/users",
    "/auth/"
  ];

  for (let i = 0; i < apiPatterns.length; i++) {
    const pattern = apiPatterns[i];
    let index = 0;

    while (index < content.length) {
      const found = content.indexOf(pattern, index);
      if (found === -1) break;

      results.push(i); // Pattern index
      results.push(found); // Position
      index = found + pattern.length;
    }
  }

  return results;
}

export function extractURLs(content: string): string[] {
  const urls: string[] = [];
  let i = 0;

  while (i < content.length - 7) { // "http://" is 7 chars
    if (content.substr(i, 7) === "http://" ||
        content.substr(i, 8) === "https://") {

      let urlStart = i;
      let urlEnd = i;

      // Find the end of the URL
      while (urlEnd < content.length &&
             content.charCodeAt(urlEnd) > 32 && // Not whitespace
             content.charAt(urlEnd) !== '"' &&
             content.charAt(urlEnd) !== "'" &&
             content.charAt(urlEnd) !== ')' &&
             content.charAt(urlEnd) !== '}') {
        urlEnd++;
      }

      if (urlEnd > urlStart) {
        const url = content.substring(urlStart, urlEnd);
        urls.push(url);
      }

      i = urlEnd;
    } else {
      i++;
    }
  }

  return urls;
}

export function calculateConfidence(patternCount: i32, matchCount: i32): f32 {
  if (matchCount === 0) return 0.0;

  let confidence: f32 = 0.3; // Base confidence

  // More matches = higher confidence
  if (matchCount > 1) confidence += 0.2;
  if (matchCount > 5) confidence += 0.2;
  if (matchCount > 10) confidence += 0.1;

  // Pattern diversity increases confidence
  if (patternCount > 2) confidence += 0.2;

  return Math.min(confidence, 1.0) as f32;
}

// Memory management helpers
export function allocateString(size: i32): i32 {
  return heap.alloc(size) as i32;
}

export function deallocateString(ptr: i32): void {
  heap.free(ptr);
}
