/**
 * Warnings List Component with dark mode support.
 * Surfaces data freshness alerts, unverified road attributes, and triage cautions.
 */

import { AlertTriangle, Info } from 'lucide-react';

export function WarningsList({ warnings = [], title = 'Operational Cautions & Missing Data Warnings' }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 text-xs space-y-1.5 transition-colors">
      <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-semibold text-2xs uppercase tracking-wider">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>{title} ({warnings.length})</span>
      </div>
      <ul className="space-y-1 text-slate-800 dark:text-slate-200 text-3xs pl-5 list-disc">
        {warnings.map((w, idx) => (
          <li key={idx} className="leading-snug">
            {w}
          </li>
        ))}
      </ul>
      <p className="text-3xs text-amber-800 dark:text-amber-400 italic pt-1 border-t border-amber-200/50 dark:border-amber-900/50 flex items-center gap-1">
        <Info className="w-3 h-3 shrink-0" />
        Dispatchers must verbally confirm bed availability before vehicle dispatch.
      </p>
    </div>
  );
}

export default WarningsList;
