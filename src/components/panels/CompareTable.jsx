/**
 * 21st.dev style Side-by-side Algorithm Comparison Table: Dijkstra Baseline vs A* Heuristic.
 * Evaluates optimality agreement, node expansion efficiency, and computational latency.
 */

import { CheckCircle2, AlertOctagon, Cpu, Zap, Activity } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

export function CompareTable({ comparisonData }) {
  if (!comparisonData) return null;

  const { dijkstra: d, astar: a, isCostEqual, costDelta } = comparisonData;
  const reductionPercent =
    d.nodesExpanded > 0
      ? Math.round(((d.nodesExpanded - a.nodesExpanded) / d.nodesExpanded) * 100)
      : 0;

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-5 shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] space-y-3.5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#D62828] dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
            Dual-Engine Benchmark Audit (Same Topology & Weights)
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {isCostEqual ? (
            <Badge variant="success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Optimal Equivalence</span>
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Cost Discrepancy ({costDelta} s)</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-white/[0.06] text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
              <th className="py-2.5 pr-2 sm:pr-3 whitespace-nowrap">Metric</th>
              <th className="py-2.5 px-2 sm:px-3 text-blue-600 dark:text-blue-400 whitespace-nowrap">Dijkstra</th>
              <th className="py-2.5 px-2 sm:px-3 text-[#D62828] dark:text-red-400 whitespace-nowrap">A* Heuristic</th>
              <th className="py-2.5 pl-2 sm:pl-3 whitespace-nowrap">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-mono text-xs text-slate-700 dark:text-slate-300">
            <tr>
              <td className="py-2.5 pr-3 font-sans font-medium text-slate-900 dark:text-slate-100">
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
              <td className="py-2.5 pr-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                Search Space (Nodes Popped)
              </td>
              <td className="py-2.5 px-3 tabular-nums">{d.nodesExpanded}</td>
              <td className="py-2.5 px-3 tabular-nums font-bold text-slate-900 dark:text-slate-100">
                {a.nodesExpanded}
              </td>
              <td className="py-2.5 pl-3 text-slate-600 dark:text-slate-400 font-sans text-[11px]">
                {reductionPercent > 0 ? (
                  <span className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/25">
                    <Zap className="w-3 h-3" />
                    -{reductionPercent}% Search Pruned
                  </span>
                ) : (
                  'Equivalent search frontier'
                )}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 pr-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                Execution Time
              </td>
              <td className="py-2.5 px-3 tabular-nums">{d.queryTimeMs} ms</td>
              <td className="py-2.5 px-3 tabular-nums font-bold text-slate-900 dark:text-slate-100">
                {a.queryTimeMs} ms
              </td>
              <td className="py-2.5 pl-3 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                Heuristic guidance acceleration
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CompareTable;
