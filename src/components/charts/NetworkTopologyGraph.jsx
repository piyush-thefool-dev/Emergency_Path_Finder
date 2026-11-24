/**
 * 21st.dev style Interactive Network Topology Graph Inspector.
 * Vector SVG render of graph nodes V and directed edges E with topological degree inspection.
 */

import { useState, useMemo } from 'react';
import { Network, Share2, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export function NetworkTopologyGraph({ graph, activePath = [], className = '' }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];

  // Coordinate normalization to 500x320 SVG viewport
  const { normalizedNodes, nodeMap } = useMemo(() => {
    if (!nodes.length) return { normalizedNodes: [], nodeMap: new Map() };

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;

    nodes.forEach((n) => {
      if (n.lat < minLat) minLat = n.lat;
      if (n.lat > maxLat) maxLat = n.lat;
      if (n.lon < minLon) minLon = n.lon;
      if (n.lon > maxLon) maxLon = n.lon;
    });

    const latSpan = maxLat - minLat || 1;
    const lonSpan = maxLon - minLon || 1;

    const width = 560;
    const height = 300;
    const pad = 30;

    const map = new Map();
    const list = nodes.map((n) => {
      // Invert lat for SVG Y axis
      const x = pad + ((n.lon - minLon) / lonSpan) * (width - pad * 2);
      const y = pad + ((maxLat - n.lat) / latSpan) * (height - pad * 2);
      const obj = { ...n, x, y };
      map.set(n.id, obj);
      return obj;
    });

    return { normalizedNodes: list, nodeMap: map };
  }, [nodes]);

  const activePathSet = useMemo(() => new Set(activePath), [activePath]);

  // Road type color scheme
  const roadTypeColors = {
    expressway: 'stroke-cyan-500/60 dark:stroke-cyan-400/50',
    trunk: 'stroke-blue-500/50 dark:stroke-blue-400/40',
    primary: 'stroke-emerald-500/50 dark:stroke-emerald-400/40',
    secondary: 'stroke-amber-500/40 dark:stroke-amber-400/30',
    residential: 'stroke-slate-300/40 dark:stroke-slate-700/40',
  };

  return (
    <div className={`rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-5 shadow-xs font-mono space-y-3 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Topological Graph Network: G = (V, E)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              {nodes.length} Intersections & Arterial Nodes · {edges.length} Directed Segment Edges
            </p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Topology Canvas */}
      <div className="relative w-full h-[280px] bg-slate-50/70 dark:bg-slate-950/80 rounded-xl border border-slate-200/80 dark:border-white/[0.06] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 560 300"
          className="w-full h-full select-none transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Directed Edges */}
          {edges.map((e) => {
            const fromNode = nodeMap.get(e.from);
            const toNode = nodeMap.get(e.to);
            if (!fromNode || !toNode) return null;

            const isPathEdge = activePathSet.has(e.from) && activePathSet.has(e.to);
            const strokeClass = isPathEdge
              ? 'stroke-[#D62828] stroke-2 opacity-100'
              : roadTypeColors[e.roadType] || 'stroke-slate-400/30';

            return (
              <line
                key={e.id}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                className={`transition-all duration-200 ${strokeClass}`}
                strokeWidth={isPathEdge ? 2.5 : 1}
              />
            );
          })}

          {/* Graph Nodes */}
          {normalizedNodes.map((n) => {
            const isHovered = hoveredNode?.id === n.id;
            const isPathNode = activePathSet.has(n.id);
            const isHealthcare = n.type === 'healthcare_hub';

            return (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={isHovered ? 6 : isPathNode ? 4.5 : isHealthcare ? 3.5 : 2}
                onMouseEnter={() => setHoveredNode(n)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`cursor-pointer transition-all duration-150 ${
                  isPathNode
                    ? 'fill-[#D62828] stroke-white stroke-2'
                    : isHealthcare
                    ? 'fill-red-500 dark:fill-red-400'
                    : 'fill-slate-400 dark:fill-slate-500 hover:fill-blue-500'
                }`}
              />
            );
          })}
        </svg>

        {/* Hover Node Tooltip Card */}
        {hoveredNode && (
          <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-xs bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-white/[0.1] rounded-xl p-2.5 shadow-md text-2xs space-y-1 pointer-events-none">
            <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
              {hoveredNode.name}
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Node ID: <code className="text-[#D62828] dark:text-red-400">{hoveredNode.id}</code></span>
              <span className="capitalize">{hoveredNode.type?.replace('_', ' ') || 'Arterial'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Symbology Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.06] text-2xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-cyan-500 inline-block"></span>
            Expressway
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-blue-500 inline-block"></span>
            Trunk Highway
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span>
            Primary Arterial
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            Apex Hospital
          </span>
        </div>
        <span>Scale: <strong>{(zoomLevel * 100).toFixed(0)}%</strong></span>
      </div>
    </div>
  );
}

export default NetworkTopologyGraph;
