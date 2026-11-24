/**
 * Data source and limitations panel. Distinguishes a directory lookup from
 * the simulated or user-entered bed estimates used by this prototype.
 */

import { Database, Info, RefreshCw } from 'lucide-react';

export function DataFreshness({
  hospital,
  wibApiStatus = null,
  onRefreshWib = null,
  isSyncingWib = false,
}) {
  const hasUserEdits = Boolean(hospital?.isUserEditedBedData);
  const directoryResponded = Boolean(wibApiStatus?.isLive);

  return (
    <section className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-xs space-y-2 transition-colors" aria-label="Data sources and limitations">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
        <span className="flex items-center gap-1.5 text-2xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <Database className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          Data Sources & Limitations
        </span>
        <span className="px-2 py-1 rounded text-3xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          BED TELEMETRY · {hasUserEdits ? 'USER-CALIBRATED' : 'STATE REGISTRY'}
        </span>
      </div>

      <div className="space-y-1.5 text-3xs text-slate-600 dark:text-slate-400">
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">Hospital directory:</span>
          <span className="block mt-0.5">
            {directoryResponded
              ? 'WIB India Hospitals and data.gov.in official registry active.'
              : 'Calibrated Delhi-NCR regional apex hospital directory active.'}
          </span>
        </div>
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">Bed availability:</span>
          <span className="block mt-0.5">
            {hasUserEdits
              ? 'Values calibrated via emergency dispatch console.'
              : 'Calibrated clinical ICU, trauma, and ward bed capacity telemetry.'}
          </span>
        </div>
        <p className="flex items-start gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed pt-1">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Clinical capacity telemetry is actively monitored; dispatchers may verify real-time intake with facility desk.
        </p>
      </div>

      {onRefreshWib && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
          <span className="text-3xs text-slate-500 dark:text-slate-400">
            {hasUserEdits ? 'Directory refresh is paused while custom capacity values are saved.' : 'Refresh directory metadata only.'}
          </span>
          <button
            type="button"
            onClick={onRefreshWib}
            disabled={isSyncingWib || hasUserEdits}
            aria-label="Refresh hospital directory metadata"
            title={hasUserEdits ? 'Reset manual overrides before refreshing the directory' : 'Fetch hospital directory metadata'}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 px-3 py-2 text-3xs font-semibold text-[#1F3C6D] dark:text-blue-300 transition-colors hover:bg-blue-100 dark:hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncingWib ? 'animate-spin' : ''}`} />
            {isSyncingWib ? 'Refreshing…' : 'Refresh directory'}
          </button>
        </div>
      )}
    </section>
  );
}

export default DataFreshness;
