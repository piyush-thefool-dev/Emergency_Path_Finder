/**
 * Google Maps–inspired Vertical Navigation Rail for Web/Desktop (`>= 1024px`).
 * Displays a compact 72px left rail matching Google Maps web, plus an expandable
 * slide-over drawer via the top hamburger menu button (no user/account section).
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import {
  Map as MapIcon,
  AlertTriangle,
  Truck,
  Building2,
  Route,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useDispatch } from '../../context/DispatchContext.jsx';
import { CadBrandLogo } from '../ui/ProfessionalLogos.jsx';

export const DESKTOP_NAV_ITEMS = [
  { to: '/', label: 'Live Map', shortLabel: 'Map', icon: MapIcon, end: true },
  { to: '/incidents', label: 'Emergency Incidents', shortLabel: 'Incidents', icon: AlertTriangle, showOpenCount: true },
  { to: '/fleet', label: 'Ambulance Fleet', shortLabel: 'Fleet', icon: Truck },
  { to: '/hospitals', label: 'Hospitals', shortLabel: 'Hospitals', icon: Building2 },
  { to: '/routing', label: 'Route Optimization', shortLabel: 'Routing', icon: Route },
  { to: '/analytics', label: 'Analytics & Reports', shortLabel: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

export function DesktopSidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { dispatchIncidents } = useDispatch();
  const activeCount = dispatchIncidents.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <>
      <aside
        className="hidden lg:flex flex-col items-center w-[72px] shrink-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl text-slate-800 dark:text-slate-100 border-r border-slate-200/90 dark:border-white/[0.08] py-3 select-none z-40"
        aria-label="Primary Rail"
      >
        {/* Top Hamburger Menu Trigger */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-11 h-11 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer mb-2"
          aria-label="Open full dispatch menu"
          title="Open dispatch menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Compact Google Maps–Style Icon + Caption Stack */}
        <nav className="flex-1 w-full px-1.5 space-y-1.5 overflow-y-auto no-scrollbar" aria-label="Primary Navigation">
          {DESKTOP_NAV_ITEMS.filter((i) => i.to !== '/settings').map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium transition-colors no-underline ${
                    isActive
                      ? 'text-[#D62828] dark:text-red-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`w-10 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-red-500/15 dark:bg-red-500/20 text-[#D62828] dark:text-red-400'
                          : 'hover:bg-slate-100 dark:hover:bg-white/[0.07]'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.3 : 1.9} />
                    </span>
                    <span className="leading-none truncate max-w-full">{item.shortLabel}</span>
                    {item.showOpenCount && activeCount > 0 && (
                      <span className="absolute top-1.5 right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D62828] text-white text-[9px] font-mono font-bold flex items-center justify-center tabular-nums leading-none shadow-xs">
                        {activeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Settings Slot */}
        <div className="w-full px-1.5 pt-2.5 pb-1 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col items-center">
          <NavLink
            to="/settings"
            title="Settings"
            className={({ isActive }) =>
              `w-full flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium transition-colors no-underline ${
                isActive
                  ? 'text-[#D62828] dark:text-red-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <Settings className="w-[18px] h-[18px]" />
            <span className="leading-none">Settings</span>
          </NavLink>
        </div>
      </aside>

      {/* Slide-Over Expanded Navigation Drawer (Triggered by ☰) */}
      {drawerOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[1400] bg-black/50 backdrop-blur-xs flex justify-start animate-in fade-in duration-150"
          onClick={() => setDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded Dispatch Navigation"
        >
          <div
            className="w-[268px] h-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-r border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 px-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CadBrandLogo className="w-9 h-9 border border-white/10" />
                <div>
                  <span className="block font-extrabold text-xs tracking-wide leading-none">EMERGENCY</span>
                  <span className="block text-[10px] font-mono font-bold tracking-widest text-[#D62828] dark:text-red-400 mt-0.5">
                    PATH FINDER
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Full Dispatch Menu">
              {DESKTOP_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors no-underline ${
                        isActive
                          ? 'bg-[#D62828] text-white shadow-sm'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                      }`
                    }
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.showOpenCount && activeCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-red-500 text-white tabular-nums">
                        {activeCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 dark:text-slate-400">Delhi-NCR Grid · v2.5</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default DesktopSidebar;
