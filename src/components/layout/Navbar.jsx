/**
 * Top Navigation Bar: Emergency Operations CAD Command Bar.
 * Single-line layout with real-time operational clock, telemetry status, and tactical navigation.
 */

import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Activity, Sun, Moon, Radio, ShieldAlert } from 'lucide-react';

export function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const [timeStr, setTimeStr] = useState('');

  // Live operational telemetry clock (IST)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
      isActive
        ? 'bg-[#1F3C6D] text-white dark:bg-red-600 dark:text-white shadow-xs font-bold'
        : 'text-slate-600 dark:text-slate-300 hover:text-[#1F3C6D] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <header className="app-header bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 transition-colors duration-150">
      <div className="navbar-inner max-w-7xl mx-auto h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: CAD Dispatch Brand Identity */}
        <NavLink to="/" className="flex items-center gap-3 whitespace-nowrap shrink-0 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#D62828] flex items-center justify-center text-white shadow-xs shrink-0 group-hover:bg-[#b52222] transition-colors">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#1F3C6D] dark:text-slate-100 text-sm sm:text-base tracking-tight leading-tight">
                Emergency Path Finder
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-50 text-[#D62828] dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900">
                CAD v2.4
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight leading-none hidden xl:block">
              Delhi Technical Campus · Greater Noida Road Grid
            </span>
          </div>
        </NavLink>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
          <NavLink to="/" className={navLinkClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/benchmark" className={navLinkClass}>
            Benchmark
          </NavLink>
          <NavLink to="/evaluation" className={navLinkClass}>
            Evaluation
          </NavLink>
          <NavLink to="/graph-explorer" className={navLinkClass}>
            Graph Explorer
          </NavLink>
          <NavLink to="/architecture" className={navLinkClass}>
            Architecture
          </NavLink>
        </nav>

        {/* Zone 3: Live Telemetry & Quick Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Real-time system clock & status telemetry */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">IST</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold tabular-nums">
              {timeStr || '00:00:00'}
            </span>
          </div>

          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800">
            <Radio className="w-3 h-3 text-sky-500 animate-pulse" />
            <span>OSM Active</span>
          </span>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-semibold hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
