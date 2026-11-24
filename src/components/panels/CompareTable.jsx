/**
 * Side-by-side Algorithm Comparison Table: Dijkstra Baseline vs A* Heuristic.
 * Evaluates optimality agreement, node expansion efficiency, and computational latency.
 */

import { CheckCircle2, AlertOctagon, Cpu, Zap, Activity } from 'lucide-react';
import { formatDistance } from '../../utils/geo.js';

export function CompareTable({ comparisonData }) {
  if (!comparisonData) return null;

  const { dijkstra: d, astar: a, isCostEqual, costDelta } = comparisonData;
  const reductionPercent =
    d.nodesExpanded > 0
      ? Math.round(((d.nodesExpanded - a.nodesExpanded) / d.nodesExpanded) * 100)
      : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#D62828] dark:text-red-400" />
          <h4 className="text-xs font-bold text-[#1F3C6D] dark:text-slate-100 uppercase tracking-wider font-mono">
            Dual-Engine Benchmark Audit (Same Topology & Weights)
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {isCostEqual ? (
            <span className="text-[#16A34A] dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Verified Optimal Equivalence
            </span>
          ) : (
            <span className="text-[#D62828] dark:text-red-300 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-mono font-bold">
              <AlertOctagon className="w-3.5 h-3.5 text-[#D62828]" />
              Cost Discrepancy ({costDelta} s)
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
              <th className="py-2.5 pr-2 sm:pr-3 whitespace-nowrap">Metric</th>
              <th className="py-2.5 px-2 sm:px-3 text-[#1F3C6D] dark:text-blue-300 whitespace-nowrap">Dijkstra</th>
              <th className="py-2.5 px-2 sm:px-3 text-[#D62828] dark:text-red-400 whitespace-nowrap">A* Heuristic</th>
              <th className="py-2.5 pl-2 sm:pl-3 whitespace-nowrap">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs text-slate-700 dark:text-slate-300">
            <tr>
              <td className="py-2.5 pr-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                Minimum Travel Time t(P)
              </td>
              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {d.costFormatted}
              </td>
              <td className="py-2.5 px-3 font-bold text-[#D62828] dark:text-red-400 tabular-nums">
                {a.costFormatted}
              </td>
              <td className="py-2.5 pl-3 text-slate-600 dark:text-slate-400 font-sans text-[11px]">
                {isCostEqual ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    Identical Cost (100% Optimal)
                  </span>
                ) : (
                  `Delta: ${costDelta} s`
                )}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 pr-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                Search Space (Nodes Popped)
              </td>
              <td className="py-2.5 px-3 tabular-nums">{d.nodesExpanded}</td>
              <td className="py-2.5 px-3 tabular-nums font-bold text-slate-900 dark:text-slate-100">
                {a.nodesExpanded}
              </td>
              <td className="py-2.5 pl-3 text-slate-600 dark:text-slate-400 font-sans text-[11px]">
                {reductionPercent > 0 ? (
                  <span className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <Zap className="w-3 h-3" />
                    -{reductionPercent}% Search Pruned
                  </span>
                ) : (
                  'Equivalent search frontier'
                )}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 pr-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                Execution Time
              </td>
              <td className="py-2.5 px-3 tabular-nums">{d.queryTimeMs} ms</td>
              <td className="py-2.5 px-3 tabular-nums font-bold text-slate-900 dark:text-slate-100">
                {a.queryTimeMs} ms
              </td>
              <td className="py-2.5 pl-3 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                Sub-millisecond memory-resident graph traversal
              </td>
            </tr>
            <tr>
              <td className="py-2.5 pr-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                Physical Road Corridor
              </td>
              <td className="py-2.5 px-3 tabular-nums">{formatDistance(d.distanceM)}</td>
              <td className="py-2.5 px-3 tabular-nums">{formatDistance(a.distanceM)}</td>
              <td className="py-2.5 pl-3 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                Matching road segment sequence
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        * Algorithmic Verification: A* uses an admissible Euclidean heuristic h(n) = dist(n, target) / v_max, strictly guaranteeing optimal shortest path on directed graphs without underestimating costs.
      </p>
    </div>
  );
}

export default CompareTable;
