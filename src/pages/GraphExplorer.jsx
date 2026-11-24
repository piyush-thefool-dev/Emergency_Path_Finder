/**
 * Graph Explorer Page: Mathematical Formula Workbench & Network Inspector.
 * Interactive live derivation of the t(e) travel-time formula and edge attribute inspection.
 */

import { useState } from 'react';
import { getDefaultGraph } from '../services/graphLoader.js';
import { kphToMps } from '../utils/geo.js';
import { Network, Calculator, Layers, Search, Filter, ShieldCheck, Zap } from 'lucide-react';
import NetworkTopologyGraph from '../components/charts/NetworkTopologyGraph.jsx';

export function GraphExplorer() {
  const defaultGraph = getDefaultGraph();
  const [selectedEdgeId, setSelectedEdgeId] = useState(defaultGraph.edges[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Interactive Live Formula Calculator State
  const [calcLengthM, setCalcLengthM] = useState(1200);
  const [calcSpeedKph, setCalcSpeedKph] = useState(45);
  const [calcCongestionMultiplier, setCalcCongestionMultiplier] = useState(0.8);
  const [calcHasSignal, setCalcHasSignal] = useState(true);
  const [calcSignalPriority, setCalcSignalPriority] = useState(false);
  const [calcIsNarrow, setCalcIsNarrow] = useState(false);
  const [calcSpeedBreakers, setCalcSpeedBreakers] = useState(1);
  const [calcInSchoolZone, setCalcInSchoolZone] = useState(false);

  // Live Worked Calculation Math
  const effectiveKph = Math.max(5, calcSpeedKph * calcCongestionMultiplier);
  const speedMps = kphToMps(effectiveKph);
  const baseTraversalSec = speedMps > 0 ? calcLengthM / speedMps : Infinity;
  const signalSec = calcHasSignal ? (calcSignalPriority ? 4 : 25) : 0;
  const narrowSec = calcIsNarrow ? baseTraversalSec * 0.35 : 0;
  const speedBreakerSec = calcSpeedBreakers * 12;
  const schoolZoneSec = calcInSchoolZone ? 15 : 0;
  const totalEdgeSec = baseTraversalSec + signalSec + narrowSec + speedBreakerSec + schoolZoneSec;

  const activeEdge = defaultGraph.edges.find((e) => e.id === selectedEdgeId) || defaultGraph.edges[0];

  const filteredEdges = defaultGraph.edges.filter((e) =>
    e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.roadType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-shell space-y-4 font-mono">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs transition-colors">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Network className="w-4 h-4 text-[#D62828]" />
          Graph Model & Formula Explorer
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
          Urban street topology is modeled as a directed, weighted graph <strong>G = (V, E, w)</strong>.
          Nodes represent intersections; directed edges represent roadway segments; weights w(e) represent predicted travel times in seconds.
        </p>
      </div>

      {/* Interactive Network Topology Graph Vector Inspector */}
      <NetworkTopologyGraph graph={defaultGraph} />

      {/* Live Formula Calculator: t(e) = L / v + penalties */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#D62828]" />
            Live Mathematical Derivation: Edge Cost t(e) = L(e) / v(e) + Penalties
          </h3>
          <span className="text-[10px] font-mono bg-red-500/10 text-red-700 dark:text-red-300 px-2 py-0.5 rounded border border-red-500/30 font-bold">
            Interactive Instrument
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Controls */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] uppercase tracking-wider">
              Segment Parameters:
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                  Length L(e) (m):
                </label>
                <input
                  type="number"
                  aria-label="Road segment length in metres"
                  min="50"
                  max="10000"
                  step="50"
                  value={calcLengthM}
                  onChange={(e) => setCalcLengthM(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                  Free-Flow Speed (km/h):
                </label>
                <input
                  type="number"
                  aria-label="Free-flow speed in kilometres per hour"
                  min="10"
                  max="120"
                  step="5"
                  value={calcSpeedKph}
                  onChange={(e) => setCalcSpeedKph(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                <span>Congestion Multiplier (Time & Weather):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">×{calcCongestionMultiplier.toFixed(2)}</span>
              </div>
              <input
                type="range"
                aria-label="Congestion multiplier"
                min="0.2"
                max="1.2"
                step="0.05"
                value={calcCongestionMultiplier}
                onChange={(e) => setCalcCongestionMultiplier(Number(e.target.value))}
                className="w-full accent-[#D62828]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={calcHasSignal}
                  onChange={(e) => setCalcHasSignal(e.target.checked)}
                  className="rounded text-[#D62828]"
                />
                <span>Signalized Junction (+25s)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={calcSignalPriority}
                  disabled={!calcHasSignal}
                  onChange={(e) => setCalcSignalPriority(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="truncate">Green Corridor (+4s)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={calcIsNarrow}
                  onChange={(e) => setCalcIsNarrow(e.target.checked)}
                  className="rounded text-[#D62828]"
                />
                <span>Narrow Street (+35%)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={calcInSchoolZone}
                  onChange={(e) => setCalcInSchoolZone(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span>School Zone (+15s)</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-500">Speed Breakers:</span>
              <input
                type="number"
                aria-label="Number of speed breakers"
                min="0"
                max="5"
                value={calcSpeedBreakers}
                onChange={(e) => setCalcSpeedBreakers(Math.max(0, Number(e.target.value)))}
                className="w-14 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs text-center font-bold"
              />
              <span className="text-[10px] text-slate-400">(+12s each)</span>
            </div>
          </div>

          {/* Derivation Terminal */}
          <div className="bg-slate-950 border border-slate-800 text-slate-100 p-4 rounded-lg space-y-2.5 text-xs shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Mathematical Derivation Terminal
              </span>
              <span className="text-[10px] text-slate-500">SI Units</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300 border-b border-slate-800/80 pb-3 leading-relaxed">
              <div>
                1. Effective Speed: v = {calcSpeedKph} km/h × {calcCongestionMultiplier.toFixed(2)} ={' '}
                <strong className="text-emerald-400">{effectiveKph.toFixed(1)} km/h</strong>
              </div>
              <div>
                2. SI Velocity: v(m/s) = {effectiveKph.toFixed(1)} × 1000 / 3600 ={' '}
                <strong className="text-emerald-400">{speedMps.toFixed(2)} m/s</strong>
              </div>
              <div>
                3. Base Traversal: t_base = {calcLengthM}m / {speedMps.toFixed(2)} m/s ={' '}
                <strong className="text-sky-400">{baseTraversalSec.toFixed(1)} s</strong>
              </div>
              <div>
                4. Intersection Signal: Δt_signal ={' '}
                <strong className="text-sky-400">{signalSec} s</strong>
                {calcSignalPriority && ' (Preemption corridor)'}
              </div>
              <div>
                5. Road Suitability Friction:
                <br />
                &nbsp;&nbsp;· Narrow Road: +{narrowSec.toFixed(1)} s
                <br />
                &nbsp;&nbsp;· Speed Breakers ({calcSpeedBreakers}): +{speedBreakerSec} s
                <br />
                &nbsp;&nbsp;· School Zone: +{schoolZoneSec} s
              </div>
            </div>

            <div className="pt-1 flex items-baseline justify-between">
              <span className="text-slate-400 text-xs font-semibold">
                Final Edge Weight w(e):
              </span>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block tabular-nums">
                  {totalEdgeSec.toFixed(1)} s
                </span>
                <span className="text-[10px] text-slate-500">
                  ≈ {(totalEdgeSec / 60).toFixed(2)} minutes traversal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Structures Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#D62828]" />
            Core Data Structures in Routing Engine
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Theoretical complexity and concrete implementation details for emergency dispatch routing.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 dark:bg-slate-900/60">
                <th className="py-2.5 px-3">Data Structure</th>
                <th className="py-2.5 px-3">Role in System</th>
                <th className="py-2.5 px-3">Time Complexity</th>
                <th className="py-2.5 px-3">Space Complexity</th>
                <th className="py-2.5 px-3">Source File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px]">
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">Adjacency List</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-sans">
                  Represents directed street graph G = (V, E, w). Stores each vertex with outgoing directed segments.
                </td>
                <td className="py-2 px-3 text-[#D62828] dark:text-red-400 font-bold">O(deg(v)) traversal</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">O(|V| + |E|)</td>
                <td className="py-2 px-3 text-slate-400 text-[10px]">src/algorithms/pathUtils.js</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">Binary Min-Heap</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-sans">
                  Priority queue ordering frontier vertices by tentative cost f(n) = g(n) + h(n).
                </td>
                <td className="py-2 px-3 text-[#D62828] dark:text-red-400 font-bold">O(log |V|) push & pop</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">O(|V|)</td>
                <td className="py-2 px-3 text-slate-400 text-[10px]">src/algorithms/minHeap.js</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">Hash Map (g-Score)</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-sans">
                  Maintains lowest known cumulative traversal time from source node to vertex n.
                </td>
                <td className="py-2 px-3 text-[#D62828] dark:text-red-400 font-bold">O(1) average lookup/write</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">O(|V|)</td>
                <td className="py-2 px-3 text-slate-400 text-[10px]">src/algorithms/dijkstra.js</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">Hash Map (Predecessors)</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-sans">
                  Records parent pointers parent(v) = u for each relaxed edge to enable backwards path reconstruction.
                </td>
                <td className="py-2 px-3 text-[#D62828] dark:text-red-400 font-bold">O(1) write, O(P) trace</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">O(|V|)</td>
                <td className="py-2 px-3 text-slate-400 text-[10px]">src/algorithms/pathUtils.js</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">Hash Set (Closed Nodes)</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-sans">
                  Tracks settled nodes whose optimal travel time is guaranteed. Prevents redundant graph relaxation.
                </td>
                <td className="py-2 px-3 text-[#D62828] dark:text-red-400 font-bold">O(1) membership check</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">O(|V|)</td>
                <td className="py-2 px-3 text-slate-400 text-[10px]">src/algorithms/dijkstra.js</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Network Edges Inspector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Road Network Segment Inspector ({defaultGraph.edges.length} Directed Segments)
          </h3>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              aria-label="Search road network edges"
              placeholder="Search edge, junction, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 dark:bg-slate-900/60 sticky top-0">
                <th className="py-2 px-3">Segment ID</th>
                <th className="py-2 px-3">From</th>
                <th className="py-2 px-3">To</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Length (m)</th>
                <th className="py-2 px-3">Limit</th>
                <th className="py-2 px-3">Lanes</th>
                <th className="py-2 px-3">Signal</th>
                <th className="py-2 px-3">Suitability Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px] tabular-nums">
              {filteredEdges.slice(0, 30).map((edge) => (
                <tr
                  key={edge.id}
                  onClick={() => setSelectedEdgeId(edge.id)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors ${
                    selectedEdgeId === edge.id ? 'bg-red-500/10 font-semibold' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-[#D62828] dark:text-red-400">{edge.id}</td>
                  <td className="py-2 px-3">{edge.from}</td>
                  <td className="py-2 px-3">{edge.to}</td>
                  <td className="py-2 px-3 font-sans capitalize">{edge.roadType}</td>
                  <td className="py-2 px-3">{edge.lengthM}m</td>
                  <td className="py-2 px-3">{edge.speedLimitKph} km/h</td>
                  <td className="py-2 px-3">{edge.lanes}</td>
                  <td className="py-2 px-3">{edge.hasSignal ? 'Yes' : 'No'}</td>
                  <td className="py-2 px-3 font-sans text-[10px] text-slate-500">
                    {edge.isNarrow && 'Narrow · '}
                    {edge.hasSpeedBreaker && 'Speed Breaker · '}
                    {edge.inSchoolZone && 'School Zone · '}
                    {edge.isOneWay && 'One-Way · '}
                    {!edge.isNarrow && !edge.hasSpeedBreaker && !edge.inSchoolZone && !edge.isOneWay && 'Standard'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GraphExplorer;
