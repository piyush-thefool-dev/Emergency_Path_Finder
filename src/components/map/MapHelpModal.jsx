/**
 * Interactive Map Help Modal: Tactical CAD Dispatch Walkthrough.
 * High-contrast dark mode support and clear step-by-step guidance.
 */

import { X, Navigation, AlertOctagon, Flame, Hospital, Info, Check, Sparkles, Activity } from 'lucide-react';

export function MapHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-[#D62828] text-white">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <h3 id="help-modal-title" className="text-sm font-bold tracking-tight font-mono">
                CAD Map Operations Guide
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Interactive Graph & Dynamic Dispatch Architecture
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto font-mono text-xs">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-[#D62828] flex items-center justify-center text-white shrink-0 mt-0.5">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                1. Vehicle Telemetry & GPS Tracking
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                Click <strong>Track GPS Location</strong> to bind live device coordinates via browser Geolocation, continuously re-snapping to the street grid and updating en-route telemetry.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Flame className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                2. Real-Time Incident & Bottleneck Injection
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                Click any road segment on the map or use the Incident Tool to mark a road as slow, heavily congested, or barricaded. Edge traversal cost t(e) will instantly inflate and A* will re-evaluate alternative corridors without refreshing.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Hospital className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                3. Constrained Multi-Criteria Destination Selection
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                Destination rankings filter out non-qualifying hospitals based on the active triage specialty. The system calculates minimum traversal time and checks bed capacity before crowning the primary receiving facility.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                4. Manual Dispatch Pin Repositioning
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                Toggle <strong>Lock Pin</strong> in the telemetry header to drag the ambulance origin marker to any intersection across Greater Noida.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-[#D62828] text-white font-mono text-xs font-semibold hover:bg-slate-800 dark:hover:bg-[#b52222] transition-colors cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapHelpModal;
