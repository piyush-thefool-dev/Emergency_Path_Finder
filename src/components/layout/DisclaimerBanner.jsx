/**
 * Prototype and Operational Advisory Banner.
 * Designed with a high-contrast clinical/dispatch advisory layout.
 */

import { useState } from 'react';
import { AlertTriangle, FlaskConical, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

export function DisclaimerBanner({ compact = false }) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className="bg-slate-900 text-slate-100 px-3.5 py-1.5 text-xs flex items-center justify-between border-b border-slate-800 font-mono">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px]">
            <strong className="text-amber-400">RESEARCH PROTOTYPE:</strong> Algorithmic & simulation estimates only.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 dark:border-amber-700/40 text-amber-950 dark:text-amber-200 px-3.5 sm:px-4 py-2.5 rounded-lg mb-4 transition-colors">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs leading-relaxed">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900 dark:text-amber-300 tracking-tight">
                Academic Decision-Support Prototype
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                ACTIVE TESTING
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls="prototype-disclaimer-details"
              className="text-amber-800 dark:text-amber-400 sm:hidden text-[11px] font-semibold underline p-0.5 flex items-center gap-0.5"
            >
              <span>{expanded ? 'Hide' : 'Details'}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          <p
            id="prototype-disclaimer-details"
            className={`text-amber-900/90 dark:text-amber-200/80 text-[11px] mt-1 ${
              expanded ? 'block' : 'hidden sm:block'
            }`}
          >
            Travel times and bed availability are modelled graph simulations. All computed routes and ETAs are mathematical estimates.
            This software is <strong>not</strong> a certified substitute for emergency medical dispatchers (CAD), clinical triage protocols, or traffic police authority.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DisclaimerBanner;
