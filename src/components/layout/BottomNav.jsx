/**
 * Bottom navigation bar for mobile / tablet screens.
 * High-contrast, tactile emergency dispatch tab navigation.
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Map as MapIcon, Hospital, Bed, Sliders, Menu } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Map', tip: 'Live CAD map and routing telemetry', icon: MapIcon, end: true },
  { to: '/hospitals', label: 'Hospitals', tip: 'Emergency facilities & triage rankings', icon: Hospital },
  { to: '/beds', label: 'Beds', tip: 'Clinical capacity & bed registry editor', icon: Bed },
  { to: '/controls', label: 'Controls', tip: 'Triage specialty, algorithm & weather parameters', icon: Sliders },
  { to: '/more', label: 'More', tip: 'Benchmarks, models, graph explorer & architecture', icon: Menu },
];

const MORE_CHILDREN = ['/benchmark', '/evaluation', '/graph-explorer', '/architecture'];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="relative z-[950] shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 pb-safe pt-1.5 px-2 shadow-sm"
    >
      <ul className="grid grid-cols-5 gap-1">
        {TABS.map(({ to, label, tip, icon: Icon, end }) => {
          const forcedActive = to === '/more' && MORE_CHILDREN.includes(pathname);
          return (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                title={tip}
                className={({ isActive }) => {
                  const on = isActive || forcedActive;
                  return `flex flex-col items-center justify-center gap-1 min-h-[50px] rounded-lg select-none transition-colors ${
                    on
                      ? 'text-[#D62828] dark:text-red-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`;
                }}
              >
                {({ isActive }) => {
                  const on = isActive || forcedActive;
                  return (
                    <>
                      <span
                        className={`h-7 w-12 rounded-full flex items-center justify-center transition-colors ${
                          on ? 'bg-red-100/70 dark:bg-red-950/70' : ''
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={on ? 2.5 : 2} />
                      </span>
                      <span className="text-[11px] leading-none tracking-tight">
                        {label}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
