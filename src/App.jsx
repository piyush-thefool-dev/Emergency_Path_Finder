/**
 * Root Application Component.
 *
 * PC (>= 1024px): original dashboard. Mobile/tablet: full-screen map + bottom tab navigation.
 * Providers: theme, calibration, router, bed-manager navigation, dispatch state.
 */

import { BrowserRouter } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import DesktopShell from './components/layout/DesktopShell.jsx';
import { useIsDesktop } from './hooks/useIsDesktop.js';
import { CalibrationProvider } from './context/CalibrationContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { BedManagerProvider } from './context/BedManagerContext.jsx';
import { DispatchProvider } from './context/DispatchContext.jsx';
import HoverTips from './components/ui/HoverTips.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

function Layout() {
  // PC keeps the original dashboard; phones/tablets get the app-style UI.
  const isDesktop = useIsDesktop();
  return (
    <ErrorBoundary>
      {isDesktop ? <DesktopShell /> : <AppShell />}
      <HoverTips />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CalibrationProvider>
        <BrowserRouter>
          <BedManagerProvider>
            <DispatchProvider>
              <Layout />
            </DispatchProvider>
          </BedManagerProvider>
        </BrowserRouter>
      </CalibrationProvider>
    </ThemeProvider>
  );
}
