import { createPortal } from 'react-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bed,
  Building2,
  Hospital,
  Map as MapIcon,
  Route,
  Settings as SettingsIcon,
  Sliders,
  Truck,
  X,
} from 'lucide-react';
import MapLegend from './MapLegend.jsx';
import TrafficSheet from './TrafficSheet.jsx';
import HospitalSearchBar from './HospitalSearchBar.jsx';
import ApiStatusPanel from '../panels/ApiStatusPanel.jsx';
import { CadBrandLogo } from '../ui/BrandLogos.jsx';

const DRAWER_LINKS = [
  { to: '/', label: 'Live Map', icon: MapIcon },
  { to: '/incidents', label: 'Emergency Incidents', icon: AlertTriangle, showCount: true },
  { to: '/fleet', label: 'Ambulance Fleet', icon: Truck },
  { to: '/directory', label: 'Hospitals', icon: Building2 },
  { to: '/beds', label: 'Bed Registry', icon: Bed },
  { to: '/controls', label: 'Dispatch Controls', icon: Sliders },
  { to: '/routing', label: 'Route Optimization', icon: Route },
  { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function MobileMapModals({
  trafficOpen,
  setTrafficOpen,
  searchModalOpen,
  setSearchModalOpen,
  panel,
  setPanel,
  drawerOpen,
  setDrawerOpen,
  openDispatchIncidentCount,
  graph,
  routing,
  live,
  apiHealth,
  onFocusPoint,
  onNavigate,
}) {
  const { weightedGraph, incidents, addIncident, removeIncident, clearIncidents, reporter, setReporter } = graph;
  const { ambulancePos, activeHospital, availableHospitals } = routing;

  return (
    <>
      <TrafficSheet
        open={trafficOpen}
        onClose={() => setTrafficOpen(false)}
        edges={weightedGraph.edges}
        nodes={weightedGraph.nodes}
        incidents={incidents}
        ambulancePos={ambulancePos}
        reporter={reporter}
        onChangeReporter={setReporter}
        onAddIncident={addIncident}
        onRemoveIncident={removeIncident}
        onClearIncidents={clearIncidents}
        onFocusPoint={onFocusPoint}
      />

      {searchModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex flex-col justify-start items-center p-0 sm:p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Search Hospitals"
        >
          <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-[85dvh] sm:max-w-lg sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="pt-2.5 sm:pt-3 pb-2 px-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/90 dark:bg-slate-950/90">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(false)}
                  className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer sm:hidden"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 font-mono flex items-center gap-1.5 truncate">
                  <Hospital className="w-3.5 h-3.5 text-[#D62828] shrink-0" />
                  <span className="truncate">Hospital Registry ({availableHospitals?.length || 35000} Registered Facilities)</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 sm:p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
              <HospitalSearchBar
                hospitals={availableHospitals}
                selectedHospitalId={routing.selectedHospitalId}
                activeHospital={activeHospital}
                onSelectHospital={(id) => {
                  routing.setSelectedHospitalId(id);
                  setSearchModalOpen(false);
                }}
                ambulancePos={ambulancePos}
                embedded={true}
                autoFocus={true}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {live.gpsError && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="gps-error-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-slate-900 dark:text-slate-100 font-sans relative">
            <button
              type="button"
              onClick={() => live.clearGpsError()}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 pr-6">
                <h3 id="gps-error-title" className="text-sm font-bold tracking-tight">
                  Location Access Required
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                  {live.gpsError}
                </p>
              </div>
            </div>

            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 leading-normal space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Why access was blocked:</p>
              <p className="text-slate-600 dark:text-slate-400">
                Chrome on Android blocks GPS hardware on plain <strong>HTTP</strong> network IPs. W3C security rules require a secure context (HTTPS or localhost).
              </p>
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/80 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Quick Fix in Chrome on your phone (30s):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li>In Chrome URL bar, open: <code className="text-[#D62828] dark:text-red-400 font-mono text-[10px]">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></li>
                  <li>Set the flag to <strong>Enabled</strong>.</li>
                  <li>Enter: <code className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">{typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://<your-ip>:3000'}</code></li>
                  <li>Tap <strong>Relaunch</strong> Chrome.</li>
                </ol>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => live.clearGpsError()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  live.clearGpsError();
                  live.startGps();
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold font-mono bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                Retry GPS
              </button>
            </div>
          </div>
        </div>
      )}

      {panel === 'legend' && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPanel(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Map Symbology Legend"
        >
          <div
            className="pointer-events-auto max-h-[85dvh] overflow-y-auto no-scrollbar shadow-2xl rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <MapLegend onClose={() => setPanel(null)} />
          </div>
        </div>,
        document.body
      )}

      {panel === 'api' && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setPanel(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Telemetry Feeds Status"
        >
          <div
            className="pointer-events-auto w-[min(26rem,calc(100vw-2rem))] max-h-[80dvh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 font-mono text-xs overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#D62828]" />
                <span>External Telemetry Feeds</span>
              </span>
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain py-3 pr-1 space-y-2">
              <ApiStatusPanel health={apiHealth} bare />
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Close Telemetry Panel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {drawerOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex justify-start animate-in fade-in duration-150"
          onClick={() => setDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Dispatch Operations Navigation"
        >
          <aside
            className="w-[275px] max-w-[85vw] h-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-r border-slate-200/90 dark:border-white/[0.08] shadow-2xl flex flex-col text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CadBrandLogo className="w-9 h-9 border border-white/10" />
                <div>
                  <span className="block text-xs font-extrabold tracking-wide leading-none">EMERGENCY</span>
                  <span className="block text-[10px] font-mono font-bold tracking-widest text-[#D62828] dark:text-red-400 mt-0.5">
                    PATH FINDER
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="App Navigation">
              {DRAWER_LINKS.map(({ to, label, icon: Icon, showCount }) => {
                const badge = showCount ? openDispatchIncidentCount : 0;
                return (
                  <button
                    key={to}
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onNavigate(to);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer text-left"
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0 text-slate-500 dark:text-slate-400" />
                    <span className="flex-1 truncate">{label}</span>
                    {badge > 0 && (
                      <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded bg-[#D62828] text-white tabular-nums leading-none">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Pan-India Grid</span>
              <span>v2.5</span>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}

export default MobileMapModals;
