// WASM Pattern Matcher Integration
// This will be enhanced with actual WebAssembly when the module is compiled

interface WASMPatternMatcher {
  matchAPIPatterns(content: string): number[];
  extractURLs(content: string): string[];
  calculateConfidence(patternCount: number, matchCount: number): number;
}

class WASMPatternMatcherImpl implements WASMPatternMatcher {
  private wasmModule: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // In a real implementation, this would load the compiled WASM module
      // For now, we'll use JavaScript fallback
      console.log('WASM module initialization (fallback mode)');
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize WASM module, using JavaScript fallback');
      this.initialized = true;
    }
  }

  matchAPIPatterns(content: string): number[] {
    // Fast pattern matching implementation
    const results: number[] = [];
    const patterns = [
      '/api/',
      '/rest/', 
      '/graphql',
      'fetch(',
      'axios.',
      '.json',
      '/users',
      '/auth/'
    ];

    patterns.forEach((pattern, patternIndex) => {
      let index = 0;
      while (index < content.length) {
        const found = content.indexOf(pattern, index);
        if (found === -1) break;
        
        results.push(patternIndex, found);
        index = found + pattern.length;
      }
    });

    return results;
  }

  extractURLs(content: string): string[] {
    const urls: string[] = [];
    const urlRegex = /https?:\/\/[^\s"')}]+/g;
    const matches = content.match(urlRegex);
    
    if (matches) {
      urls.push(...matches);
    }

    return [...new Set(urls)]; // Remove duplicates
  }

  calculateConfidence(patternCount: number, matchCount: number): number {
    if (matchCount === 0) return 0.0;
    
    let confidence = 0.3; // Base confidence
    
    // More matches = higher confidence
    if (matchCount > 1) confidence += 0.2;
    if (matchCount > 5) confidence += 0.2;
    if (matchCount > 10) confidence += 0.1;
    
    // Pattern diversity increases confidence
    if (patternCount > 2) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }
}

// Singleton instance
let wasmPatternMatcher: WASMPatternMatcherImpl | null = null;

export async function getWASMPatternMatcher(): Promise<WASMPatternMatcherImpl> {
  if (!wasmPatternMatcher) {
    wasmPatternMatcher = new WASMPatternMatcherImpl();
    await wasmPatternMatcher.initialize();
  }
  return wasmPatternMatcher;
}

export default WASMPatternMatcherImpl;