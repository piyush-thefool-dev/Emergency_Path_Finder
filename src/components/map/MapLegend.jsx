/**
 * Map Legend Popover: Tactical Symbology Reference.
 */

import { Ambulance, Hospital, Navigation, X, Network } from 'lucide-react';

const ITEMS = [
  {
    key: 'amb',
    icon: <Ambulance className="w-3.5 h-3.5 stroke-[2.2]" />,
    swatch: 'rounded-full bg-[#D62828] text-white',
    title: 'Emergency Unit',
    text: 'Ambulance location (snapped to road)',
  },
  {
    key: 'graph',
    icon: <Network className="w-3.5 h-3.5" />,
    swatch: 'rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    title: 'Graph Nodes & Edges',
    text: 'Road network intersections (toggleable)',
  },
  {
    key: 'best',
    icon: <Hospital className="w-3.5 h-3.5 stroke-[2.2]" />,
    swatch: 'rounded-md bg-emerald-600 text-white',
    title: 'Optimal Facility',
    text: 'Minimum traversal time + specialty match',
  },
  {
    key: 'alt',
    icon: <Hospital className="w-3.5 h-3.5 stroke-[2.2]" />,
    swatch: 'rounded-md bg-[#1F3C6D] text-white',
    title: 'Contingency Facility',
    text: 'Tap pin to redirect route',
  },
  {
    key: 'route',
    icon: <Navigation className="w-3.5 h-3.5 fill-current" />,
    swatch: 'rounded-md bg-red-50 dark:bg-red-950/60 text-[#D62828] dark:text-red-400 border border-red-200 dark:border-red-900',
    title: 'Dispatched Corridor',
    text: 'Active A* minimum travel time line',
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
    key: 'accident',
    icon: <span className="text-[10px] font-mono font-black">✕</span>,
    swatch: 'rounded-md bg-purple-600 text-white font-bold',
    title: 'Traffic Collision',
    text: 'Dashed line · Heavy delay penalty',
  },
  {
    key: 'closure',
    icon: <span className="text-[10px] font-mono font-black">✕</span>,
    swatch: 'rounded-md bg-[#b52222] text-white font-bold',
    title: 'Road Barricaded / Closed',
    text: 'Road segment closed to routing',
  },
];

export function MapLegend({ onClose }) {
  return (
    <div className="w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl p-4 font-mono text-xs">
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
              className={`w-6 h-6 shrink-0 flex items-center justify-center shadow-2xs ${it.swatch}`}
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
