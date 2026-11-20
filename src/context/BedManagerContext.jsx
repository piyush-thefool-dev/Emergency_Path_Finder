/**
 * Bed Manager access.
 *
 *  - Desktop: opens the bed-estimate editor as a modal over the dashboard.
 *  - Mobile : navigates to the dedicated Beds page (/beds).
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsDesktop } from '../hooks/useIsDesktop.js';

const BedManagerContext = createContext(null);

export function BedManagerProvider({ children }) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [isBedManagerOpen, setIsBedManagerOpen] = useState(false);

  const openBedManager = useCallback(() => {
    if (isDesktop) setIsBedManagerOpen(true);
    else navigate('/beds');
  }, [isDesktop, navigate]);
  const closeBedManager = useCallback(() => setIsBedManagerOpen(false), []);

  const value = useMemo(
    () => ({ isBedManagerOpen, openBedManager, closeBedManager }),
    [isBedManagerOpen, openBedManager, closeBedManager]
  );
  return <BedManagerContext.Provider value={value}>{children}</BedManagerContext.Provider>;
}

export function useBedManager() {
  const context = useContext(BedManagerContext);
  if (!context) throw new Error('useBedManager must be used within BedManagerProvider');
  return context;
}
