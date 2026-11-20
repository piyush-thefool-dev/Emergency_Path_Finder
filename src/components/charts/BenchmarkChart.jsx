/**
 * Benchmark Results Chart: Algorithmic Search Space Reduction Visualizer.
 * Renders node expansion comparisons per source-destination pair with full dark mode support.
 */

export function BenchmarkChart({ pairResults = [], summary = {} }) {
  if (!pairResults || pairResults.length === 0) return null;

  const maxNodes = Math.max(...pairResults.map((p) => Math.max(p.dijkstraNodes, p.astarNodes, 1)));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-4 font-mono transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Search Frontier Expansion per Test Pair
        </h4>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 bg-slate-500 rounded-xs inline-block"></span>
            Dijkstra Baseline
          </span>
          <span className="flex items-center gap-1.5 text-[#D62828] dark:text-red-400">
            <span className="w-2.5 h-2.5 bg-[#D62828] rounded-xs inline-block"></span>
            A* Heuristic
          </span>
        </div>
      </div>

      {/* Bar Chart Rows */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {pairResults.map((pair) => {
          const dWidth = Math.max(4, Math.round((pair.dijkstraNodes / maxNodes) * 100));
          const aWidth = Math.max(4, Math.round((pair.astarNodes / maxNodes) * 100));

          return (
            <div key={pair.pairId} className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span className="truncate pr-2">
                  Pair #{pair.pairId}: {pair.sourceName} → {pair.hospitalName}
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  {pair.nodesReducedPercent > 0 ? `-${pair.nodesReducedPercent}% pruned` : 'equal'}
                </span>
              </div>

              {/* Bars */}
              <div className="space-y-1">
                {/* Dijkstra */}
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[10px] text-slate-400 text-right">Dijkstra</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${dWidth}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-[11px] font-bold text-slate-800 dark:text-slate-200 text-right tabular-nums">
                    {pair.dijkstraNodes}
                  </span>
                </div>

                {/* A* */}
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[10px] text-[#D62828] text-right font-bold">A*</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#D62828] h-full rounded-full transition-all duration-300"
                      style={{ width: `${aWidth}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-[11px] font-bold text-[#D62828] dark:text-red-400 text-right tabular-nums">
                    {pair.astarNodes}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>Average Pruning: <strong className="text-slate-800 dark:text-slate-200">{summary.avgSearchReductionPercent}%</strong></span>
        <span>Verified Optimal Agreement: <strong className="text-emerald-600 dark:text-emerald-400">{summary.costAgreementRate}%</strong></span>
      </div>
    </div>
  );
}

export default BenchmarkChart;
