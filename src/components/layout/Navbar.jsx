/**
 * Top Navigation Bar: 21st.dev style Emergency Operations CAD Command Bar.
 * Glassmorphic translucent header with live operational clock, telemetry capsules, and tactile navigation.
 */

import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Sun, Moon, Radio, Shield, Sparkles } from 'lucide-react';
import { CadBrandLogo } from '../ui/ProfessionalLogos.jsx';
import { isOffline, subscribeNetworkStatus } from '../../utils/network.js';

export function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const [timeStr, setTimeStr] = useState('');
  const [isNetOffline, setIsNetOffline] = useState(() => isOffline());

  useEffect(() => {
    const unsub = subscribeNetworkStatus((online) => {
      setIsNetOffline(!online);
    });
    return unsub;
  }, []);

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
    `text-xs font-sans font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
      isActive
        ? 'bg-[#1F3C6D] text-white dark:bg-red-600 dark:text-white shadow-xs font-bold'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
    }`;

  return (
    <header className="app-header sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] transition-colors duration-200">
      <div className="navbar-inner max-w-7xl mx-auto h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand Identity */}
        <NavLink to="/" className="flex items-center gap-3 whitespace-nowrap shrink-0 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-red-600/25 cursor-pointer"
          >
            <CadBrandLogo className="w-9 h-9 sm:w-10 sm:h-10" />
          </motion.div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#1F3C6D] dark:text-slate-100 text-sm sm:text-base tracking-tight leading-tight">
                Emergency Path Finder
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                CAD v2.5
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight leading-none hidden xl:block">
              Delhi Technical Campus · Pan-India & Delhi-NCR Road Grid
            </span>
          </div>
        </NavLink>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/[0.06] backdrop-blur-md">
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
          {/* Operational IST Telemetry Clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/[0.08] text-xs font-mono backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-semibold text-[10px]">IST</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold tabular-nums">
              {timeStr || '00:00:00'}
            </span>
          </div>

          {/* Online / Offline Status Capsule */}
          {isNetOffline ? (
            <button
              type="button"
              onClick={() => resetNetworkStatus()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 backdrop-blur-md hover:bg-amber-500/20 cursor-pointer transition-colors"
              title="Click to reconnect and switch to live OSM mode"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Offline • Local CAD Mode</span>
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 backdrop-blur-md"
              title="OpenStreetMap live tiles & OSRM routing active"
            >
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>OSM Active</span>
            </span>
          )}

          {/* 21st.dev style Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={toggleTheme}
            className="h-9 px-3 rounded-xl border border-slate-200/80 dark:border-white/[0.1] bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs backdrop-blur-md"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-sans font-semibold hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-sans font-semibold hidden sm:inline">Dark</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
