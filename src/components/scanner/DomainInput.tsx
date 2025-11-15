'use client';

import { useState } from 'react';
import { useScannerStore } from '@/store/scanner-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, Settings, Play, Square } from 'lucide-react';
import { isValidDomain } from '@/lib/utils';

export function DomainInput() {
  const [domain, setDomain] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const { currentScan, config, startScan, stopScan, updateConfig } = useScannerStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!domain.trim()) return;

    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    if (!isValidDomain(cleanDomain)) {
      alert('Please enter a valid domain (e.g., example.com, localhost, or 192.168.1.1)');
      return;
    }

    await startScan(cleanDomain);
  };

  const handleStop = () => {
    stopScan();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Globe className="w-6 h-6" />
          API Endpoint Scanner
        </CardTitle>
        <CardDescription className="text-gray-300">
          Enter a domain to discover and map API endpoints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              disabled={currentScan.isScanning}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowConfig(!showConfig)}
            disabled={currentScan.isScanning}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Settings className="w-4 h-4" />
          </Button>

          {currentScan.isScanning ? (
            <Button type="button" onClick={handleStop} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button type="submit" disabled={!domain.trim()}>
              <Play className="w-4 h-4 mr-2" />
              Scan
            </Button>
          )}
        </form>

        {showConfig && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-muted">
            <h4 className="font-medium text-foreground">Scan Configuration</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Max Depth</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxDepth}
                  onChange={(e) => updateConfig({ maxDepth: parseInt(e.target.value) || 3 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Max Pages</label>
                <Input
                  type="number"
                  min="10"
                  max="1000"
                  value={config.maxPages}
                  onChange={(e) => updateConfig({ maxPages: parseInt(e.target.value) || 100 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Crawl Delay (ms)</label>
                <Input
                  type="number"
                  min="100"
                  max="10000"
                  value={config.crawlDelay}
                  onChange={(e) => updateConfig({ crawlDelay: parseInt(e.target.value) || 1000 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Timeout (ms)</label>
                <Input
                  type="number"
                  min="5000"
                  max="120000"
                  value={config.timeout}
                  onChange={(e) => updateConfig({ timeout: parseInt(e.target.value) || 30000 })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.respectRobots}
                  onChange={(e) => updateConfig({ respectRobots: e.target.checked })}
                />
                <span className="text-sm text-foreground">Respect robots.txt</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableJavaScript}
                  onChange={(e) => updateConfig({ enableJavaScript: e.target.checked })}
                />
                <span className="text-sm text-foreground">Enable JavaScript</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.includeExternalLinks}
                  onChange={(e) => updateConfig({ includeExternalLinks: e.target.checked })}
                />
                <span className="text-sm text-white">Include external links</span>
              </label>
            </div>
          </div>
        )}

        {currentScan.domain && (
          <div className="flex items-center justify-between text-sm text-white">
            <span>Scanning: {currentScan.domain}</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {currentScan.isScanning ? 'Active' : 'Completed'}
              </Badge>
              {currentScan.progress && (
                <Badge variant="secondary">
                  {currentScan.progress.pagesScanned} pages
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
