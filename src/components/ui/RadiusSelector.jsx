/**
 * 21st.dev style Search Radius Selector Control.
 * Segmented pill selector offering 5 km, 10 km (default), 25 km, 100 km, and All (280 Hospitals) search corridors,
 * with automatic fallback indicator.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Compass, AlertCircle } from 'lucide-react';

export const RADIUS_OPTIONS = [
  { value: 5, label: '5 km', hint: 'Immediate Vicinity (5 km)' },
  { value: 10, label: '10 km', hint: 'Standard Dispatch Radius (10 km)' },
  { value: 25, label: '25 km', hint: 'Extended Regional Corridor (25 km)' },
  { value: 100, label: '100 km', hint: 'Metropolitan Grid (100 km)' },
  { value: 0, label: 'All', hint: 'All 280 Registered Hospitals (Nationwide)' },
];

export function RadiusSelector({
  radiusKm = 10,
  onChangeRadius,
  isFallback = false,
  effectiveRadiusKm = 10,
  className = '',
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs select-none ${className}`}
      role="group"
      aria-label="Hospital search radius filter"
    >
      <div className="flex items-center gap-1 pl-1.5 pr-1 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 hidden sm:flex">
        <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span>Radius:</span>
      </div>

      <div className="flex items-center gap-0.5">
        {RADIUS_OPTIONS.map((opt) => {
          const isSelected = radiusKm === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => onChangeRadius && onChangeRadius(opt.value)}
              title={`${opt.label} search corridor (${opt.hint})`}
              className={`relative px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#1F3C6D] dark:bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-pressed={isSelected}
            >
              <span>{opt.label}</span>
            </motion.button>
          );
        })}
      </div>

      {isFallback && radiusKm !== 0 && (
        <span
          className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse"
          title={`Auto-expanded to ${effectiveRadiusKm} km because fewer than 3 hospitals were found within ${radiusKm} km`}
        >
          <AlertCircle className="w-2.5 h-2.5 shrink-0" />
          <span className="hidden md:inline">Auto {effectiveRadiusKm}km</span>
        </span>
      )}
    </div>
  );
}

export default RadiusSelector;
