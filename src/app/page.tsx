'use client';

import { Toaster } from 'react-hot-toast';
import { DomainInput } from '@/components/scanner/DomainInput';
import { ScanProgress } from '@/components/scanner/ScanProgress';
import { InteractiveGraph } from '@/components/scanner/InteractiveGraph';
import { ResultsDashboard } from '@/components/scanner/ResultsDashboard';
import { Shield, Zap, Network, Github } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b border-gray-700 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">API Endpoint Mapper</h1>
                <p className="text-sm text-gray-300">AI-Driven API Discovery & Visualization</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-400">
                  <Zap className="w-4 h-4" />
                  <span>WebAssembly</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <Shield className="w-4 h-4" />
                  <span>Security Analysis</span>
                </div>
                <div className="flex items-center gap-1 text-purple-400">
                  <Network className="w-4 h-4" />
                  <span>Interactive Graph</span>
                </div>
              </div>

              <a
                href="https://github.com"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Discover Hidden API Endpoints
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Advanced spider crawling with WebAssembly-powered pattern matching,
            heuristic endpoint detection, and interactive visualization
          </p>
        </section>

        {/* Scanner Interface */}
        <section className="space-y-6">
          <DomainInput />
          <ScanProgress />
        </section>

        {/* Results Section */}
        <section className="grid lg:grid-cols-2 gap-8">
          <div>
            <InteractiveGraph />
          </div>
          <div>
            <ResultsDashboard />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-slate-900/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Advanced spider crawling</li>
                <li>• WebAssembly pattern matching</li>
                <li>• Security vulnerability analysis</li>
                <li>• Interactive graph visualization</li>
                <li>• OpenAPI spec generation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Technology</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Next.js 14 with App Router</li>
                <li>• TypeScript & Tailwind CSS</li>
                <li>• Puppeteer & Cheerio</li>
                <li>• React Force Graph</li>
                <li>• Rate-limited scanning</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Security</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Respects robots.txt</li>
                <li>• Rate limiting protection</li>
                <li>• No data storage</li>
                <li>• Client-side processing</li>
                <li>• Ethical scanning practices</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>Built with ❤️ for security research and API discovery</p>
            <p className="mt-2">
              <strong>Disclaimer:</strong> Only scan domains you own or have explicit permission to test
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
