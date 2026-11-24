/**
 * 21st.dev style API Status Panel: External Service Telemetry & Health Monitoring.
 * Tracks OpenStreetMap Overpass, Open-Meteo, WIB Registry, and OSRM routing status.
 */

import { motion } from 'motion/react';
import { RefreshCw, Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { API_CHECKS } from '../../services/apiHealth.js';

export const STATE_STYLE = {
  ok: { dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]', text: 'text-emerald-700 dark:text-emerald-400', label: 'OPERATIONAL' },
  slow: { dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]', text: 'text-amber-700 dark:text-amber-400', label: 'HIGH LATENCY' },
  down: { dot: 'bg-[#D62828] shadow-[0_0_8px_rgba(239,68,68,0.5)]', text: 'text-red-700 dark:text-red-400', label: 'OFFLINE' },
  off: { dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', label: 'UNCONFIGURED' },
  checking: { dot: 'bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.5)]', text: 'text-sky-700 dark:text-sky-400', label: 'PROBING' },
};

export const OVERALL_LABEL = {
  ok: 'All External Feeds Operational',
  slow: 'Elevated Latency on Feeds',
  down: 'Service Degradation Detected',
  checking: 'Probing API Endpoints...',
};

function ago(ts) {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)} min ago`;
}

export function ApiStatusPanel({ health, bare = false, className = '' }) {
  const { results, summary, checkAll, checkOne } = health;
  const overall = STATE_STYLE[summary.overall === 'ok' ? 'ok' : summary.overall];

  const body = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#D62828] dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-slate-100">
              External Telemetry Feeds
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
              Health Monitoring & Overpass APIs
            </span>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={checkAll}
          title="Test every service again right now"
          className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 cursor-pointer min-h-[32px] transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3 h-3 ${summary.checking > 0 ? 'animate-spin text-[#D62828]' : ''}`} />
          <span>Probe All</span>
        </motion.button>
      </div>

      <div className={`mt-3 text-xs font-mono font-semibold flex items-center justify-between ${overall.text}`}>
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${overall.dot}`} />
          {OVERALL_LABEL[summary.overall]}
        </span>
        <span className="text-slate-400 font-normal text-[11px]">
          {summary.ok}/{summary.total - summary.off} active
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {API_CHECKS.map((c) => {
          const r = results[c.id];
          const st = STATE_STYLE[r.state];
          return (
            <li
              key={c.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-slate-950/40 p-3 transition-colors"
            >
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
              <span className="min-w-0 flex-1" title={`${c.purpose} Fallback: ${c.ifDown}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate font-sans">
                    {c.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {c.provider}
                  </span>
                </div>
                <div className={`text-[11px] font-mono font-semibold mt-0.5 flex items-center gap-1.5 ${st.text}`}>
                  <span>{st.label}</span>
                  {r.latencyMs != null && (
                    <span className="text-slate-400 font-normal">· {r.latencyMs} ms</span>
                  )}
                  {r.checkedAt && r.state !== 'checking' && (
                    <span className="text-slate-400 font-normal">· {ago(r.checkedAt)}</span>
                  )}
                </div>
                {r.state === 'down' ? (
                  <span className="block text-[11px] text-[#D62828] dark:text-red-400 mt-0.5 font-mono">
                    {r.detail}. {c.ifDown}
                  </span>
                ) : (
                  r.detail && (
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {r.detail}
                    </span>
                  )
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );

  if (bare) return <div>{body}</div>;

  return (
    <div className={`rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-4 sm:p-5 transition-colors ${className}`}>
      {body}
    </div>
  );
}

export default ApiStatusPanel;
