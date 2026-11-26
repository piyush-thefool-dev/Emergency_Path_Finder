/**
 * App Shell: Mobile & tablet tactical view.
 *
 *   ┌──────────────────────┐
 *   │  Map (always mounted)│  ← pages slide over it, so the map and the
 *   │  + page overlay      │    live navigation telemetry keep running
 *   └──────────────────────┘
 *
 * Used below 1024px wide (phones, tablets). PCs get DesktopShell instead.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import MapScreen from '../map/MapScreen.jsx';
import AppRoutes from '../../routes/AppRoutes.jsx';

export function AppShell() {
  const { pathname } = useLocation();
  const isMap = pathname === '/' || pathname === '/map';
  const scrollRef = useRef(null);

  // Lock document scrolling while mobile shell is active
  useEffect(() => {
    document.documentElement.classList.add('app-locked');
    return () => document.documentElement.classList.remove('app-locked');
  }, []);

  // Scroll to top on navigation change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="h-dvh w-full bg-slate-200 dark:bg-black">
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-[#F8FAFC] dark:bg-[#080C16] ambient-glow-light dark:ambient-glow-dark text-slate-900 dark:text-slate-100 [transform:translateZ(0)]">
        <div className="relative flex-1 min-h-0">
          <MapScreen />

          {!isMap && (
            <div
              ref={scrollRef}
              key={pathname}
              className={`page-enter absolute inset-0 z-[900] bg-slate-100/95 dark:bg-[#090D16]/95 backdrop-blur-xs flex flex-col ${
                pathname === '/beds'
                  ? 'overflow-hidden pb-0'
                  : 'overflow-y-auto overscroll-contain pb-6'
              }`}
            >
              <AppRoutes />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppShell;
