/**
 * 21st.dev style Bottom Navigation Bar for mobile / tablet screens.
 * Glassmorphic floating dock with active indicator pills and smooth spring physics.
 */

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
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
      className="relative z-[950] shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/[0.08] pb-safe pt-2 px-3 shadow-lg"
    >
      <ul className="grid grid-cols-5 gap-1 max-w-md mx-auto">
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
                  return `flex flex-col items-center justify-center gap-1 min-h-[50px] rounded-xl select-none transition-colors relative ${
                    on
                      ? 'text-[#D62828] dark:text-red-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`;
                }}
              >
                {({ isActive }) => {
                  const on = isActive || forcedActive;
                  return (
                    <>
                      <span
                        className={`h-7 w-12 rounded-full flex items-center justify-center transition-all ${
                          on
                            ? 'bg-red-500/15 dark:bg-red-500/20 text-[#D62828] dark:text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                            : ''
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={on ? 2.5 : 2} />
                      </span>
                      <span className="text-[10px] sm:text-[11px] leading-none tracking-tight font-sans">
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
