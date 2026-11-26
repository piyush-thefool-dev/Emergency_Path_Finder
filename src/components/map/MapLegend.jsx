/**
 * Map Legend Popover: Symbology Reference (2D Tactical Map + 3D Vehicle/Hospital Landmarks).
 */

import { Navigation, X, Network } from 'lucide-react';

const ITEMS = [
  {
    key: 'amb',
    icon: <img src="/assets/ambulance-3d.png" alt="" className="w-5 h-5 object-contain" />,
    swatch: 'rounded-lg bg-slate-900/90 border border-red-500/40',
    title: '3D Emergency Unit',
    text: 'Directional ambulance aligned to corridor heading',
  },
  {
    key: 'best',
    icon: <img src="/assets/hospital-3d.png" alt="" className="w-5 h-5 object-contain" />,
    swatch: 'rounded-lg bg-emerald-500/15 border border-emerald-500/40',
    title: '3D Recommended Hospital',
    text: 'Optimal facility tower with helipad & active ETA',
  },
  {
    key: 'alt',
    icon: <img src="/assets/hospital-alt-3d.png" alt="" className="w-5 h-5 object-contain" />,
    swatch: 'rounded-lg bg-blue-500/15 border border-blue-500/40',
    title: '3D Contingency Hospital',
    text: 'Tap 3D hospital building to redirect route',
  },
  {
    key: 'graph',
    icon: <Network className="w-3.5 h-3.5" />,
    swatch: 'rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    title: 'Graph Nodes & Edges',
    text: 'Road network intersections (toggleable)',
  },
  {
    key: 'route',
    icon: <Navigation className="w-3.5 h-3.5 fill-current" />,
    swatch: 'rounded-md bg-red-50 dark:bg-red-950/60 text-[#D62828] dark:text-red-400 border border-red-200 dark:border-red-900',
    title: 'Dispatched Corridor',
    text: 'Active A* minimum travel time path',
  },
  {
    key: 'slow',
    icon: <span className="text-[10px] font-mono font-black">!</span>,
    swatch: 'rounded-md bg-amber-400 text-slate-950 font-bold',
    title: 'Slow Traffic',
    text: 'Speed degraded by ~50%',
  },
  {
    key: 'heavy',
    icon: <span className="text-[10px] font-mono font-black">!!</span>,
    swatch: 'rounded-md bg-orange-500 text-white font-bold',
    title: 'Severe Bottleneck',
    text: 'Speed degraded by ~75%',
  },
  {
    key: 'closure',
    icon: <span className="text-[10px] font-mono font-black">✕</span>,
    swatch: 'rounded-md bg-[#b52222] text-white font-bold',
    title: 'Collision / Closed',
    text: 'Blocked road triggers detour or hospital switch',
  },
];

export function MapLegend({ onClose }) {
  return (
    <div className="w-[min(20.5rem,calc(100vw-2.5rem))] rounded-2xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl p-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
          Map Symbology
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close legend"
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <ul className="space-y-2">
        {ITEMS.map((it) => (
          <li key={it.key} className="flex items-center gap-2.5">
            <span
              className={`w-7 h-7 shrink-0 flex items-center justify-center shadow-2xs ${it.swatch}`}
            >
              {it.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {it.title}
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {it.text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MapLegend;
