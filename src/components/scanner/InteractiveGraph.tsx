'use client';

import { useEffect, useRef, useState } from 'react';
import { useScannerStore } from '@/store/scanner-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Maximize
} from 'lucide-react';
import type { GraphNode, GraphLink } from '@/lib/types';

// Simple SVG-based graph visualization to avoid SSR and AFRAME issues
const SimpleGraph = ({ graphData, onNodeClick, zoom, onZoomChange }: {
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
  onNodeClick: (node: GraphNode) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!graphData.nodes.length) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
        <div className="text-center text-muted-foreground">
          <Network className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No endpoints found yet</p>
          <p className="text-sm">Start a scan to visualize the API structure</p>
        </div>
      </div>
    );
  }

  // Improved layout algorithm for better node distribution
  const svgWidth = 600;
  const svgHeight = 380;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // First pass: Position domains and endpoints
  const nodePositions = new Map<string, { x: number; y: number }>();

  // Separate node types
  const endpoints = graphData.nodes.filter(n => n.type === 'endpoint');
  const parameters = graphData.nodes.filter(n => n.type === 'parameter');
  const domains = graphData.nodes.filter(n => n.type === 'domain');

  // Position domain nodes first
  domains.forEach(node => {
    nodePositions.set(node.id, { x: centerX, y: centerY });
  });

  // Position endpoint nodes in rings
  endpoints.forEach((node, index) => {
    const totalEndpoints = endpoints.length;

    if (totalEndpoints === 1) {
      nodePositions.set(node.id, { x: centerX + 120, y: centerY });
      return;
    }

    // Create multiple rings for better distribution
    const currentRing = Math.floor(index / 8);
    const positionInRing = index % 8;
    const nodesInThisRing = Math.min(8, totalEndpoints - currentRing * 8);

    const radius = 120 + (currentRing * 80);
    const angle = (positionInRing * 2 * Math.PI) / nodesInThisRing;

    nodePositions.set(node.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  });

  // Second pass: Position parameters relative to their parent endpoints
  parameters.forEach((node, index) => {
    const parentEndpoint = endpoints.find(e =>
      graphData.links.some(link =>
        link.source === e.id && link.target === node.id
      )
    );

    if (parentEndpoint) {
      const parentPos = nodePositions.get(parentEndpoint.id);
      if (parentPos) {
        const paramAngle = (index * 2 * Math.PI) / Math.max(parameters.length, 4);
        const paramRadius = 40;
        nodePositions.set(node.id, {
          x: parentPos.x + Math.cos(paramAngle) * paramRadius,
          y: parentPos.y + Math.sin(paramAngle) * paramRadius
        });
        return;
      }
    }

    // Fallback position for orphaned parameters
    const angle = (index * 2 * Math.PI) / Math.max(parameters.length, 1);
    nodePositions.set(node.id, {
      x: centerX + Math.cos(angle) * 60,
      y: centerY + Math.sin(angle) * 60
    });
  });

  // Create final positioned nodes array
  const positionedNodes: (GraphNode & { x: number; y: number })[] = graphData.nodes.map(node => {
    const position = nodePositions.get(node.id);
    if (position) {
      return { ...node, x: position.x, y: position.y };
    }

    // Ultimate fallback
    const angle = Math.random() * 2 * Math.PI;
    return {
      ...node,
      x: centerX + Math.cos(angle) * 100,
      y: centerY + Math.sin(angle) * 100
    };
  });  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const deltaX = e.movementX;
    const deltaY = e.movementY;

    setPan(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full h-96 bg-card border border-border rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        id="graph-svg"
        width="600"
        height="380"
        viewBox={`${-pan.x} ${-pan.y} ${600 / zoom} ${380 / zoom}`}
        className="cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background */}
        <rect
          x={-1000}
          y={-1000}
          width={2600}
          height={2380}
          fill="#0f172a"
        />

        {/* Grid pattern for better orientation */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect x={-1000} y={-1000} width={2600} height={2380} fill="url(#grid)" />

        {/* Links */}
        {graphData.links.map((link, index) => {
          const sourceNode = positionedNodes.find((n: GraphNode & { x: number; y: number }) => n.id === link.source);
          const targetNode = positionedNodes.find((n: GraphNode & { x: number; y: number }) => n.id === link.target);

          if (!sourceNode || !targetNode) return null;

          return (
            <line
              key={index}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="#94a3b8"
              strokeWidth="2"
              opacity={0.6}
            />
          );
        })}

        {/* Nodes */}
        {positionedNodes.map((node: GraphNode & { x: number; y: number }) => {
          const isHovered = hoveredNode === node.id;
          const nodeSize = node.type === 'domain' ? 25 : node.type === 'endpoint' ? 18 : 12;

          // Better color scheme for different node types
          const getNodeColor = () => {
            if (node.color) return node.color;
            if (node.type === 'domain') return '#1d4ed8'; // Blue for domain
            if (node.type === 'endpoint') {
              // Color by HTTP method
              switch (node.method?.toUpperCase()) {
                case 'GET': return '#10b981'; // Green
                case 'POST': return '#f59e0b'; // Yellow
                case 'PUT': return '#8b5cf6'; // Purple
                case 'PATCH': return '#06b6d4'; // Cyan
                case 'DELETE': return '#ef4444'; // Red
                default: return '#6b7280'; // Gray
              }
            }
            return '#64748b'; // Default gray for parameters
          };

          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeSize}
                fill={getNodeColor()}
                stroke={isHovered ? '#ffffff' : '#e2e8f0'}
                strokeWidth={isHovered ? 3 : 2}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(node);
                }}
              />

              {/* Method label for endpoints */}
              {node.type === 'endpoint' && node.method && (
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fill="white"
                  className="text-xs font-bold pointer-events-none"
                  fontSize="10"
                >
                  {node.method.toUpperCase()}
                </text>
              )}

              {/* Fixed text color issue - now uses dark text on light background */}
              <rect
                x={node.x - 40}
                y={node.y + nodeSize + 8}
                width={80}
                height={22}
                rx={6}
                fill={isHovered ? '#1e40af' : '#0f172a'}
                fillOpacity={0.95}
                stroke={isHovered ? '#3b82f6' : '#64748b'}
                strokeWidth={1.5}
              />
              <text
                x={node.x}
                y={node.y + nodeSize + 20}
                textAnchor="middle"
                fill={isHovered ? '#ffffff' : '#f1f5f9'}
                className="text-xs pointer-events-none"
                fontSize="12"
                fontWeight="600"
                style={{
                  filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
                }}
              >
                {node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(20, 20)">
          <rect x={0} y={0} width={180} height={120} fill="#1e293b" fillOpacity={0.9} stroke="#475569" strokeWidth={1} rx={4} />
          <text x={10} y={15} fill="#f1f5f9" fontSize="12" fontWeight="600">HTTP Methods</text>

          <circle cx={15} cy={30} r={6} fill="#10b981" />
          <text x={25} y={35} fill="#f1f5f9" fontSize="10">GET</text>

          <circle cx={15} cy={45} r={6} fill="#f59e0b" />
          <text x={25} y={50} fill="#f1f5f9" fontSize="10">POST</text>

          <circle cx={15} cy={60} r={6} fill="#8b5cf6" />
          <text x={25} y={65} fill="#f1f5f9" fontSize="10">PUT</text>

          <circle cx={90} cy={30} r={6} fill="#06b6d4" />
          <text x={100} y={35} fill="#f1f5f9" fontSize="10">PATCH</text>

          <circle cx={90} cy={45} r={6} fill="#ef4444" />
          <text x={100} y={50} fill="#f1f5f9" fontSize="10">DELETE</text>

          <circle cx={90} cy={60} r={6} fill="#1d4ed8" />
          <text x={100} y={65} fill="#f1f5f9" fontSize="10">DOMAIN</text>
        </g>
      </svg>
    </div>
  );
};

export function InteractiveGraph() {
  const { graphData, selectedEndpoint, selectEndpoint, currentScan } = useScannerStore();
  const [zoom, setZoom] = useState(1);

  // Functional zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleReset = () => {
    setZoom(1);
  };

  const handleExportSVG = () => {
    // Get the SVG element and export it
    const svgElement = document.querySelector('#graph-svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `api-graph-${currentScan.domain || 'export'}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };



  if (!currentScan.results || graphData.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            API Structure Graph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
            <div className="text-center text-muted-foreground">
              <Network className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No endpoints found yet</p>
              <p className="text-sm">Start a scan to visualize API structure</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between text-white w-full">
          <CardTitle className="flex items-center gap-2 text-white">
            <Network className="w-5 h-5" />
            API Structure Graph
            <Badge variant="outline" className="ml-2">
              {graphData.nodes.length} nodes
            </Badge>
          </CardTitle>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSVG}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SimpleGraph
          graphData={graphData}
          zoom={zoom}
          onZoomChange={setZoom}
          onNodeClick={(node) => {
            // Find the corresponding endpoint
            const endpoint = currentScan.results?.endpoints.find(e => e.id === node.id);
            if (endpoint) {
              selectEndpoint(endpoint);
            }
          }}
        />

        {selectedEndpoint && (
          <div className="mt-4 p-4 bg-accent border border-accent-foreground rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-foreground">Selected Endpoint</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectEndpoint(null)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-foreground">Method:</span>{' '}
                <Badge variant="outline">{selectedEndpoint.method}</Badge>
              </div>
              <div>
                <span className="font-medium text-foreground">URL:</span>{' '}
                <code className="text-xs bg-muted text-muted-foreground px-1 py-0.5 rounded">
                  {selectedEndpoint.url}
                </code>
              </div>
              {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                <div>
                  <span className="font-medium text-foreground">Parameters:</span>{' '}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedEndpoint.parameters.map((param, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {param.name} ({param.type})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="font-medium text-foreground">Source:</span>{' '}
                <Badge variant="outline">{selectedEndpoint.source}</Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
