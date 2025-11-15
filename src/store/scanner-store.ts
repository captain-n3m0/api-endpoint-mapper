import { create } from 'zustand';
import type {
  CrawlResult,
  ScanProgress,
  ScannerConfig,
  Endpoint,
  GraphNode,
  GraphLink
} from '@/lib/types';

interface ScannerStore {
  // State
  currentScan: {
    sessionId: string | null;
    domain: string | null;
    isScanning: boolean;
    progress: ScanProgress | null;
    results: CrawlResult | null;
    error: string | null;
  };

  config: ScannerConfig;
  scanHistory: CrawlResult[];

  // Graph data
  graphData: {
    nodes: GraphNode[];
    links: GraphLink[];
  };

  // UI State
  selectedEndpoint: Endpoint | null;
  searchQuery: string;
  filterBy: {
    method: string[];
    source: string[];
    security: string[];
  };

  // Actions
  startScan: (domain: string, config?: Partial<ScannerConfig>) => Promise<void>;
  stopScan: () => void;
  updateProgress: (progress: ScanProgress) => void;
  setResults: (results: CrawlResult) => void;
  setError: (error: string) => void;
  clearError: () => void;

  // Config actions
  updateConfig: (config: Partial<ScannerConfig>) => void;
  resetConfig: () => void;

  // Graph actions
  updateGraphData: (results: CrawlResult) => void;

  // Selection and filtering
  selectEndpoint: (endpoint: Endpoint | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filterType: 'method' | 'source' | 'security', values: string[]) => void;
  clearFilters: () => void;

  // History
  addToHistory: (result: CrawlResult) => void;
  clearHistory: () => void;
}

const defaultConfig: ScannerConfig = {
  maxDepth: 3,
  maxPages: 100,
  respectRobots: true,
  includeExternalLinks: false,
  crawlDelay: 1000,
  userAgent: 'API-Endpoint-Mapper/1.0',
  enableJavaScript: true,
  timeout: 30000,
};

export const useScannerStore = create<ScannerStore>((set, get) => ({
  // Initial state
  currentScan: {
    sessionId: null,
    domain: null,
    isScanning: false,
    progress: null,
    results: null,
    error: null,
  },

  config: defaultConfig,
  scanHistory: [],

  graphData: {
    nodes: [],
    links: [],
  },

  selectedEndpoint: null,
  searchQuery: '',
  filterBy: {
    method: [],
    source: [],
    security: [],
  },

  // Actions
  startScan: async (domain: string, configOverride?: Partial<ScannerConfig>) => {
    const config = { ...get().config, ...configOverride };

    try {
      set((state) => ({
        currentScan: {
          ...state.currentScan,
          domain,
          isScanning: true,
          error: null,
          progress: {
            stage: 'initializing',
            progress: 0,
            pagesScanned: 0,
            endpointsFound: 0,
            message: 'Starting scan...',
          },
        },
      }));

      // Start the scan via API
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, config }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start scan');
      }

      const { sessionId } = await response.json();

      set((state) => ({
        currentScan: {
          ...state.currentScan,
          sessionId,
        },
      }));

      // Start polling for progress
      pollProgress(sessionId);

    } catch (error) {
      set((state) => ({
        currentScan: {
          ...state.currentScan,
          isScanning: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    }
  },

  stopScan: () => {
    set((state) => ({
      currentScan: {
        ...state.currentScan,
        isScanning: false,
      },
    }));
  },

  updateProgress: (progress: ScanProgress) => {
    set((state) => ({
      currentScan: {
        ...state.currentScan,
        progress,
      },
    }));
  },

  setResults: (results: CrawlResult) => {
    set((state) => ({
      currentScan: {
        ...state.currentScan,
        results,
        isScanning: false,
      },
    }));

    // Update graph data
    get().updateGraphData(results);

    // Add to history
    get().addToHistory(results);
  },

  setError: (error: string) => {
    set((state) => ({
      currentScan: {
        ...state.currentScan,
        error,
        isScanning: false,
      },
    }));
  },

  clearError: () => {
    set((state) => ({
      currentScan: {
        ...state.currentScan,
        error: null,
      },
    }));
  },

  // Config actions
  updateConfig: (configUpdate: Partial<ScannerConfig>) => {
    set((state) => ({
      config: { ...state.config, ...configUpdate },
    }));
  },

  resetConfig: () => {
    set({ config: defaultConfig });
  },

  // Graph actions
  updateGraphData: (results: CrawlResult) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Create domain node
    const domainNode: GraphNode = {
      id: 'domain',
      name: results.domain,
      type: 'domain',
      size: 20,
      color: '#3b82f6',
    };
    nodes.push(domainNode);

    // Create endpoint nodes
    results.endpoints.forEach((endpoint) => {
      const endpointNode: GraphNode = {
        id: endpoint.id,
        name: `${endpoint.method} ${new URL(endpoint.url).pathname}`,
        type: 'endpoint',
        method: endpoint.method,
        statusCode: endpoint.statusCode,
        security: endpoint.security?.riskLevel === 'high' || endpoint.security?.riskLevel === 'critical'
          ? 'danger'
          : endpoint.security?.riskLevel === 'medium'
          ? 'warning'
          : 'safe',
        size: 10 + (endpoint.parameters?.length || 0) * 2,
        color: getEndpointColor(endpoint),
      };
      nodes.push(endpointNode);

      // Link endpoint to domain
      links.push({
        source: 'domain',
        target: endpoint.id,
        type: 'contains',
        strength: 1,
      });

      // Create parameter nodes
      endpoint.parameters?.forEach((param, index) => {
        const paramId = `${endpoint.id}_param_${index}`;
        const paramNode: GraphNode = {
          id: paramId,
          name: param.name,
          type: 'parameter',
          size: 5,
          color: '#10b981',
        };
        nodes.push(paramNode);

        // Link parameter to endpoint
        links.push({
          source: endpoint.id,
          target: paramId,
          type: 'contains',
          strength: 0.5,
        });
      });
    });

    set({ graphData: { nodes, links } });
  },

  // Selection and filtering
  selectEndpoint: (endpoint: Endpoint | null) => {
    set({ selectedEndpoint: endpoint });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilter: (filterType: 'method' | 'source' | 'security', values: string[]) => {
    set((state) => ({
      filterBy: {
        ...state.filterBy,
        [filterType]: values,
      },
    }));
  },

  clearFilters: () => {
    set({
      filterBy: {
        method: [],
        source: [],
        security: [],
      },
      searchQuery: '',
    });
  },

  // History
  addToHistory: (result: CrawlResult) => {
    set((state) => ({
      scanHistory: [result, ...state.scanHistory.slice(0, 9)], // Keep last 10
    }));
  },

  clearHistory: () => {
    set({ scanHistory: [] });
  },

}));

// Polling helper function
const pollProgress = async (sessionId: string) => {
  const store = useScannerStore.getState();

  const poll = async () => {
    try {
      const response = await fetch(`/api/progress?sessionId=${sessionId}`);
      if (response.ok) {
        const progress = await response.json();
        store.updateProgress(progress);

        if (progress.stage === 'completed') {
          // Fetch final results
          const resultsResponse = await fetch(`/api/results?sessionId=${sessionId}`);
          if (resultsResponse.ok) {
            const results = await resultsResponse.json();
            store.setResults(results);
            return; // Stop polling
          }
        } else if (progress.stage === 'error') {
          store.setError(progress.message);
          return; // Stop polling
        }
      }

      // Continue polling if still scanning
      if (useScannerStore.getState().currentScan.isScanning) {
        setTimeout(poll, 2000); // Poll every 2 seconds
      }
    } catch (error) {
      console.error('Polling error:', error);
      if (useScannerStore.getState().currentScan.isScanning) {
        setTimeout(poll, 5000); // Retry in 5 seconds
      }
    }
  };

  poll();
};

function getEndpointColor(endpoint: Endpoint): string {
  // Color by HTTP method
  switch (endpoint.method) {
    case 'GET': return '#10b981'; // green
    case 'POST': return '#f59e0b'; // yellow
    case 'PUT': return '#3b82f6'; // blue
    case 'DELETE': return '#ef4444'; // red
    case 'PATCH': return '#8b5cf6'; // purple
    default: return '#6b7280'; // gray
  }
}
