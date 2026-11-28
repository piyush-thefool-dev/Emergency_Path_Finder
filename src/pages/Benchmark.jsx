/**
 * Algorithm Benchmark Page: Empirical Performance Audit.
 * Evaluates Dijkstra (Baseline) vs A* (Heuristic Guided) across sample source-hospital pairs.
 */

import { useState, useMemo } from 'react';
import { useDispatch } from '../context/DispatchContext.jsx';
import { runAlgorithmBenchmark } from '../services/benchmark.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { astar } from '../algorithms/astar.js';
import BenchmarkChart from '../components/charts/BenchmarkChart.jsx';
import CompareTable from '../components/panels/CompareTable.jsx';
import { Play, CheckCircle2, AlertOctagon, HelpCircle, Cpu } from 'lucide-react';

export function Benchmark() {
  const { routing, graph } = useDispatch();
  const { comparisonData, activeHospital, snappedSourceNode } = routing;
  const [pairCount, setPairCount] = useState(15);
  const [benchmarkRunIndex, setBenchmarkRunIndex] = useState(0);

  const weightedGraph = graph.weightedGraph;

  // Compute benchmark results
  const benchmarkData = useMemo(() => {
    return runAlgorithmBenchmark(weightedGraph, routing.availableHospitals, pairCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightedGraph, routing.availableHospitals, pairCount, benchmarkRunIndex]);

  const { pairResults, summary, allCostsMatched } = benchmarkData;

  // Live active comparison data for the Dual-Engine Benchmark Audit table
  const liveComparisonData = useMemo(() => {
    if (comparisonData) return comparisonData;
    const g = graph?.weightedGraph || weightedGraph;
    if (activeHospital?.nodeId && snappedSourceNode?.id && g) {
      const dRun = dijkstra(g, snappedSourceNode.id, activeHospital.nodeId);
      const aRun = astar(g, snappedSourceNode.id, activeHospital.nodeId);
      const costDelta = Math.abs(dRun.totalCost - aRun.totalCost);
      const isCostEqual = costDelta < 0.001;
      return {
        dijkstra: {
          cost: dRun.totalCost,
          costFormatted: `${(dRun.totalCost / 60).toFixed(1)} min`,
          nodesExpanded: dRun.nodesExpanded,
          queryTimeMs: dRun.queryTimeMs,
          path: dRun.path,
          success: dRun.success,
        },
        astar: {
          cost: aRun.totalCost,
          costFormatted: `${(aRun.totalCost / 60).toFixed(1)} min`,
          nodesExpanded: aRun.nodesExpanded,
          queryTimeMs: aRun.queryTimeMs,
          path: aRun.path,
          success: aRun.success,
        },
        isCostEqual,
        costDelta: Number(costDelta.toFixed(2)),
      };
    }
    if (pairResults && pairResults.length > 0) {
      const p = pairResults[0];
      const costDelta = Math.abs(p.dijkstraCost - p.astarCost);
      return {
        dijkstra: {
          cost: p.dijkstraCost,
          costFormatted: `${(p.dijkstraCost / 60).toFixed(1)} min`,
          nodesExpanded: p.dijkstraNodes,
          queryTimeMs: p.dijkstraTimeMs,
          path: [],
          success: true,
        },
        astar: {
          cost: p.astarCost,
          costFormatted: `${(p.astarCost / 60).toFixed(1)} min`,
          nodesExpanded: p.astarNodes,
          queryTimeMs: p.astarTimeMs,
          path: [],
          success: true,
        },
        isCostEqual: p.costsMatch,
        costDelta: Number(costDelta.toFixed(2)),
      };
    }
    return null;
  }, [comparisonData, graph, weightedGraph, activeHospital, snappedSourceNode, pairResults]);

  const handleRerun = () => {
    setBenchmarkRunIndex((prev) => prev + 1);
  };

  return (
    <div className="page-shell space-y-4 font-mono">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#D62828]" />
            Algorithmic Performance Benchmark: Dijkstra vs A*
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Empirical traversal audit on the identical Pan-India & Delhi-NCR street topology and edge-weight model.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span>Pairs:</span>
            <select
              value={pairCount}
              onChange={(e) => setPairCount(Number(e.target.value))}
              aria-label="Number of benchmark test pairs"
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value={5}>5 Pairs</option>
              <option value={10}>10 Pairs</option>
              <option value={15}>15 Pairs</option>
              <option value={25}>25 Pairs</option>
              <option value={40}>40 Pairs</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRerun}
            className="px-3.5 py-1.5 bg-slate-900 dark:bg-[#D62828] hover:bg-slate-800 dark:hover:bg-[#b52222] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Benchmark
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">
            Optimality Agreement
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {summary.costAgreementRate}%
            </span>
            {allCostsMatched ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-[#D62828]" />
            )}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Strict optimal cost equivalence
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">
            Avg Search Pruned
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#D62828] dark:text-red-400 mt-1 tabular-nums">
            {summary.avgSearchReductionPercent > 0 ? `-${summary.avgSearchReductionPercent}%` : '0%'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Reduced node expansions
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">
            Frontier Nodes
          </span>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-baseline gap-1.5 tabular-nums">
            <span>Dijkstra: {summary.avgDijkstraNodes}</span>
            <span className="text-slate-400">|</span>
            <span className="text-[#D62828] dark:text-red-400">A*: {summary.avgAStarNodes}</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Average priority queue pops
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">
            Query Latency
          </span>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-baseline gap-1.5 tabular-nums">
            <span>{summary.avgDijkstraTimeMs} ms</span>
            <span className="text-slate-400">vs</span>
            <span className="text-[#D62828] dark:text-red-400">{summary.avgAStarTimeMs} ms</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Sub-millisecond memory search
          </span>
        </div>
      </div>

      {/* Dual-Engine Benchmark Audit Table */}
      {liveComparisonData && (
        <CompareTable comparisonData={liveComparisonData} />
      )}

      {/* Chart */}
      <BenchmarkChart pairResults={pairResults} summary={summary} />

      {/* Per-Pair Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Empirical Test Pair Traversal Audit
          </h3>
          <span className="text-[11px] text-slate-500">
            {pairResults.length} test pairs evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 dark:bg-slate-900/60">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Source Node</th>
                <th className="py-2 px-3">Target Hospital</th>
                <th className="py-2 px-3">Dijkstra Cost</th>
                <th className="py-2 px-3">A* Cost</th>
                <th className="py-2 px-3">Agreement</th>
                <th className="py-2 px-3">Dijkstra Nodes</th>
                <th className="py-2 px-3">A* Nodes</th>
                <th className="py-2 px-3">Pruned</th>
                <th className="py-2 px-3">Dijkstra Latency</th>
                <th className="py-2 px-3">A* Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px] tabular-nums">
              {pairResults.map((pair) => (
                <tr key={pair.pairId} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-2 px-3 text-slate-400">{pair.pairId}</td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">{pair.sourceName}</td>
                  <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">{pair.hospitalName}</td>
                  <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{pair.dijkstraCost} s</td>
                  <td className="py-2 px-3 font-bold text-[#D62828] dark:text-red-400">{pair.astarCost} s</td>
                  <td className="py-2 px-3">
                    {pair.costsMatch ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Optimal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#D62828] dark:text-red-400 font-semibold text-[10px]">
                        <AlertOctagon className="w-3 h-3" />
                        Variance
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">{pair.dijkstraNodes}</td>
                  <td className="py-2 px-3">{pair.astarNodes}</td>
                  <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {pair.nodesReducedPercent > 0 ? `-${pair.nodesReducedPercent}%` : '0%'}
                  </td>
                  <td className="py-2 px-3 text-slate-500">{pair.dijkstraTimeMs} ms</td>
                  <td className="py-2 px-3 text-slate-500">{pair.astarTimeMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scientific Honesty Notice */}
      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
          <HelpCircle className="w-4 h-4 text-[#D62828]" />
          <span>Scientific Assessment & Theoretical Constraints</span>
        </div>
        <p className="leading-relaxed text-[11px] font-sans">
          <strong>A* is not claimed to be strictly faster in every topology:</strong> As documented in the DTC project report, A* expands significantly fewer nodes when the destination lies roughly along the straight-line heading. When urban road layouts detour around bodies of water, barriers, or one-way loops, A* must explore sideways edges similar to Dijkstra. The Euclidean distance lower-bound heuristic guarantees optimality without ever underestimating the minimum traversal cost.
        </p>
      </div>
    </div>
  );
}

export default Benchmark;
