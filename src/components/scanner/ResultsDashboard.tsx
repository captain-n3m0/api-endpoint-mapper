'use client';

import { useState, useMemo } from 'react';
import { useScannerStore } from '@/store/scanner-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Download,
  Eye,
  ExternalLink,
  Shield,
  Clock,
  Database,
  FileText,
  BarChart3
} from 'lucide-react';
import type { Endpoint } from '@/lib/types';

export function ResultsDashboard() {
  const {
    currentScan,
    searchQuery,
    filterBy,
    setSearchQuery,
    setFilter,
    clearFilters,
    selectEndpoint
  } = useScannerStore();

  const [showFilters, setShowFilters] = useState(false);

  const results = currentScan.results;

  // Filter and search endpoints
  const filteredEndpoints = useMemo(() => {
    if (!results?.endpoints) return [];

    let filtered = results.endpoints;

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(endpoint =>
        endpoint.url.toLowerCase().includes(query) ||
        endpoint.method.toLowerCase().includes(query) ||
        endpoint.parameters?.some(p => p.name.toLowerCase().includes(query))
      );
    }

    // Apply method filter
    if (filterBy.method.length > 0) {
      filtered = filtered.filter(endpoint =>
        filterBy.method.includes(endpoint.method)
      );
    }

    // Apply source filter
    if (filterBy.source.length > 0) {
      filtered = filtered.filter(endpoint =>
        filterBy.source.includes(endpoint.source)
      );
    }

    // Apply security filter
    if (filterBy.security.length > 0) {
      filtered = filtered.filter(endpoint => {
        const riskLevel = endpoint.security?.riskLevel || 'low';
        return filterBy.security.includes(riskLevel);
      });
    }

    return filtered;
  }, [results?.endpoints, searchQuery, filterBy]);

  // Stats
  const stats = useMemo(() => {
    if (!results) return null;

    const methods = new Map<string, number>();
    const sources = new Map<string, number>();
    const securities = new Map<string, number>();

    results.endpoints.forEach(endpoint => {
      // Count methods
      methods.set(endpoint.method, (methods.get(endpoint.method) || 0) + 1);

      // Count sources
      sources.set(endpoint.source, (sources.get(endpoint.source) || 0) + 1);

      // Count security levels
      const riskLevel = endpoint.security?.riskLevel || 'low';
      securities.set(riskLevel, (securities.get(riskLevel) || 0) + 1);
    });

    return { methods, sources, securities };
  }, [results]);

  const handleMethodFilter = (method: string) => {
    const current = filterBy.method;
    if (current.includes(method)) {
      setFilter('method', current.filter(m => m !== method));
    } else {
      setFilter('method', [...current, method]);
    }
  };

  const handleSourceFilter = (source: string) => {
    const current = filterBy.source;
    if (current.includes(source)) {
      setFilter('source', current.filter(s => s !== source));
    } else {
      setFilter('source', [...current, source]);
    }
  };

  const handleSecurityFilter = (security: string) => {
    const current = filterBy.security;
    if (current.includes(security)) {
      setFilter('security', current.filter(s => s !== security));
    } else {
      setFilter('security', [...current, security]);
    }
  };

  const handleExportCSV = async () => {
    if (!currentScan.sessionId) return;

    try {
      const response = await fetch(`/api/results?sessionId=${currentScan.sessionId}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-endpoints-${currentScan.domain}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportOpenAPI = async () => {
    if (!currentScan.sessionId) return;

    try {
      const response = await fetch(`/api/results?sessionId=${currentScan.sessionId}&format=openapi`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-spec-${currentScan.domain}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="w-5 h-5" />
            Scan Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No results available</p>
            <p className="text-sm">Complete a scan to see discovered endpoints</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            Scan Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{results.endpoints.length}</div>
              <div className="text-sm text-white">Total Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{results.totalPages}</div>
              <div className="text-sm text-white">Pages Scanned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{results.stats.uniqueDomains}</div>
              <div className="text-sm text-white">Unique Domains</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round(results.totalTime / 1000)}s
              </div>
              <div className="text-sm text-white">Scan Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between text-white w-full">
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="w-5 h-5" />
              Discovered Endpoints
              <Badge variant="outline">{filteredEndpoints.length}</Badge>
            </CardTitle>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportOpenAPI}>
                <FileText className="w-4 h-4" />
                OpenAPI
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-white">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7"
              />
            </div>
            {(searchQuery || filterBy.method.length > 0 || filterBy.source.length > 0 || filterBy.security.length > 0) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>

          {showFilters && stats && (
            <div className="border border-border rounded-lg p-4 space-y-4 bg-muted">
              <div>
                <h4 className="font-medium mb-2 text-foreground">HTTP Methods</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(stats.methods.entries()).map(([method, count]) => (
                    <Button
                      key={method}
                      variant={filterBy.method.includes(method) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMethodFilter(method)}
                      className={!filterBy.method.includes(method) ? getMethodColor(method) : ''}
                    >
                      {method} ({count})
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-foreground">Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(stats.sources.entries()).map(([source, count]) => (
                    <Button
                      key={source}
                      variant={filterBy.source.includes(source) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSourceFilter(source)}
                    >
                      {source} ({count})
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-foreground">Security Risk</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(stats.securities.entries()).map(([security, count]) => (
                    <Button
                      key={security}
                      variant={filterBy.security.includes(security) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSecurityFilter(security)}
                      className={!filterBy.security.includes(security) ? getSecurityColor(security) : ''}
                    >
                      {security} ({count})
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Endpoints List */}
          <div className="space-y-2">
            {filteredEndpoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No endpoints match your filters</p>
              </div>
            ) : (
              filteredEndpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent hover:border-accent-foreground cursor-pointer transition-colors"
                  onClick={() => selectEndpoint(endpoint)}
                  style={{ userSelect: 'text' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {endpoint.source}
                        </Badge>
                        {endpoint.security && (
                          <Badge className={getSecurityColor(endpoint.security.riskLevel)}>
                            <Shield className="w-3 h-3 mr-1" />
                            {endpoint.security.riskLevel}
                          </Badge>
                        )}
                      </div>

                      <div
                        className="font-mono text-sm break-all mb-2 text-foreground font-medium"
                      >
                        {endpoint.url}
                      </div>

                      {endpoint.parameters && endpoint.parameters.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {endpoint.parameters.map((param, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {param.name} ({param.type})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(endpoint.url, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {endpoint.responseTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="w-3 h-3" />
                      {endpoint.responseTime}ms
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
