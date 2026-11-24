/**
 * 21st.dev style Tactical CAD Advisory Banner with glassmorphism and subtle emerald glow.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, ChevronDown, ChevronUp, ShieldCheck, Sparkles } from 'lucide-react';

export function DisclaimerBanner({ compact = false }) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className="bg-slate-900/90 dark:bg-slate-950/90 text-slate-100 px-3.5 py-1.5 text-xs flex items-center justify-between border-b border-slate-800 font-mono backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
          <span className="text-[11px]">
            <strong className="text-emerald-400">CAD ACTIVE:</strong> Real-time A* dynamic corridor optimization & hospital triage routing.
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.04] to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-transparent border border-emerald-500/25 dark:border-emerald-500/20 text-emerald-950 dark:text-emerald-200 p-3.5 sm:p-4 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.06)] backdrop-blur-xl"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 text-xs leading-relaxed">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-emerald-950 dark:text-emerald-200 tracking-tight font-sans text-xs sm:text-sm">
                Emergency Computer-Aided Dispatch (CAD) Operational Console
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls="cad-advisory-details"
              className="text-emerald-800 dark:text-emerald-400 sm:hidden text-[11px] font-semibold underline p-0.5 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{expanded ? 'Hide' : 'Details'}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          <p
            id="cad-advisory-details"
            className={`text-emerald-900/80 dark:text-emerald-300/80 text-[11px] sm:text-xs font-sans mt-1 leading-relaxed ${expanded ? 'block' : 'hidden sm:block'
              }`}
          >
            Real-time traffic-calibrated emergency routing and hospital triage system for Pan-India & Delhi-NCR. Traversal paths and arrival windows are dynamically computed over the live OpenStreetMap road network.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default DisclaimerBanner;
