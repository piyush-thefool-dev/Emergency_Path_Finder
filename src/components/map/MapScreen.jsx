/**
 * Map Screen (Mobile CAD Map Tab).
 * Full-bleed tactical map with floating operations HUD:
 *   - Top: Destination banner (hospital + ETA) and emergency triage chips
 *   - Right: Tactical tools (symbology legend, API telemetry, guide, recenter)
 *   - Bottom-left: High-contrast telemetry speedometer gauge
 *   - Bottom: Corridor dispatch trip sheet with start/pause simulation
 */

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Navigation2,
  Locate,
  Layers,
  HelpCircle,
  Sun,
  Moon,
  LayoutGrid,
  Activity,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  Pin,
  MapPin,
  TriangleAlert,
  Phone,
  PhoneCall,
  Network,
  X,
  Search,
  Hospital,
} from 'lucide-react';
import MapView from './MapView.jsx';
import MapLegend from './MapLegend.jsx';
import MapHelpModal from './MapHelpModal.jsx';
import TrafficSheet from './TrafficSheet.jsx';
import HospitalSearchBar from './HospitalSearchBar.jsx';
import ApiStatusPanel, { STATE_STYLE } from '../panels/ApiStatusPanel.jsx';
import { useDispatch } from '../../context/DispatchContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { EMERGENCY_CATEGORIES } from '../../config/emergencyCategories.js';
import { formatDistance } from '../../utils/geo.js';
import { formatEtaShort } from '../../utils/time.js';

function RoundButton({ label, onClick, active = false, children }) {
  return (
    <div className="map-tip-group relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs border backdrop-blur-xl cursor-pointer active:scale-95 transition-all ${
          active
            ? 'bg-[#D62828] border-red-500 text-white shadow-md shadow-red-600/30'
            : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="map-tip pointer-events-none absolute right-full top-1/2 mr-2 whitespace-nowrap rounded-lg bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 text-[11px] font-mono font-semibold px-2 py-1 shadow-md z-10 backdrop-blur-md"
      >
        {label}
      </span>
    </div>
  );
}

export function MapScreen() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const {
    graph,
    routing,
    live,
    apiHealth,
    canDragAmbulance,
    setCanDragAmbulance,
    roadTelemetry,
    setRoadTelemetry,
  } = useDispatch();
  const [recenterKey, setRecenterKey] = useState(0);
  const [panel, setPanel] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [trafficOpen, setTrafficOpen] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  // Graph network overlay: displays all road intersection nodes and directed edges (ON by default for Pan-India & NCR inspection)
  const [showGraphNetwork, setShowGraphNetwork] = useState(true);

  // Lock body scrolling when search modal is open
  useEffect(() => {
    if (!searchModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [searchModalOpen]);

  const { weightedGraph, incidents, addIncident, removeIncident, clearIncidents, reporter, setReporter } = graph;
  const {
    ambulancePos,
    setAmbulanceCoordinates,
    snappedSourceNode,
    emergencyCategory,
    setEmergencyCategory,
    algorithm,
    setSelectedHospitalId,
    activeHospital,
    availableHospitals,
  } = routing;

  const isMoving = live.isMoving;
  const speed = Math.max(0, Math.round(live.gpsSpeedKph ?? 0));
  const category = EMERGENCY_CATEGORIES[emergencyCategory];
  const algoLabel = algorithm === 'compare' ? 'A* (Verified)' : algorithm === 'dijkstra' ? 'Dijkstra' : 'A*';

  const handleGpsToggle = () => {
    if (live.isGpsActive) live.stopGps();
    else live.startGps();
  };

  const handleLocate = () => {
    setFocusPoint(null);
    setSelectedHospitalId(null);
    setRecenterKey((k) => k + 1);
    live.setFollowVehicle(true);
  };

  return (
    <>
      <div className="absolute inset-0 z-0 isolate overflow-hidden bg-slate-200 dark:bg-[#080D1A]">
        <MapView
          nodes={weightedGraph.nodes}
          edges={weightedGraph.edges}
          ambulancePos={ambulancePos}
          onAmbulanceMove={setAmbulanceCoordinates}
          snappedSourceNode={snappedSourceNode}
          hospitals={routing.topHospitals && routing.topHospitals.length > 0 ? routing.topHospitals : availableHospitals.slice(0, 5)}
          activeHospitalId={activeHospital?.id}
          onSelectHospital={setSelectedHospitalId}
          activePathNodeIds={activeHospital?.pathNodeIds || []}
          incidents={incidents}
          onAddIncident={addIncident}
          onRemoveIncident={removeIncident}
          focusPoint={focusPoint}
          isFigure2Mode={false}
          isMoving={live.isMoving}
          isRealGps={live.isGpsActive}
          gpsAccuracy={live.gpsAccuracy}
          gpsSpeedKph={live.gpsSpeedKph || 0}
          followVehicle={live.followVehicle}
          canDragPin={canDragAmbulance}
          onTogglePinLock={setCanDragAmbulance}
          recenterKey={recenterKey}
          onRoadResolved={setRoadTelemetry}
          showGraphNetwork={showGraphNetwork}
          effectiveRadiusKm={routing.effectiveRadiusKm || routing.searchRadiusKm}
          isRadiusFallback={routing.isRadiusFallback}
        />

        {/* ───────── Top: Destination Telemetry & Category Chips ───────── */}
        <div className="absolute top-0 inset-x-0 z-[500] pointer-events-none pt-1 sm:pt-safe px-2.5 sm:px-3 space-y-1 sm:space-y-1.5">
          {/* Row 1: Hospital Details Card (100% full width) */}
          <button
            type="button"
            onClick={() => navigate('/hospitals')}
            title="Open hospital details, ETA and alternatives"
            className="pointer-events-auto w-full text-left flex items-center gap-2 sm:gap-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-md pl-3 pr-3 py-2 sm:py-2.5 cursor-pointer active:scale-[0.99] transition-transform"
            aria-label="Open hospital details"
          >
            <span
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                activeHospital ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            >
              {activeHospital ? <Navigation2 className="w-4 h-4 fill-current" /> : <AlertTriangle className="w-4 h-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>
                  {activeHospital
                    ? routing.selectedHospitalId
                      ? `★ Manual Target · ${category?.shortLabel || ''}`
                      : `Optimal Receiving · ${category?.shortLabel || ''}`
                    : 'No hospital reachable'}
                </span>
                {routing.selectedHospitalId && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      routing.setSelectedHospitalId(null);
                    }}
                    className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] hover:bg-amber-500/30 cursor-pointer font-bold"
                    title="Reset to automated CAD recommendation"
                  >
                    Auto
                  </span>
                )}
              </span>
              <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {activeHospital ? activeHospital.shortName || activeHospital.name : 'Select another category'}
              </span>
            </span>
            {activeHospital && (
              <span className="text-right shrink-0">
                <span className="block text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                  {formatEtaShort(roadTelemetry?.durationSec || activeHospital.travelTimeSec)}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatDistance(roadTelemetry?.distanceM || activeHospital.distanceM)}
                </span>
              </span>
            )}
            <a
              href={`tel:${(activeHospital?.phone || '108').replace(/[^0-9+]/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer no-underline"
              title={
                activeHospital?.phone
                  ? `Call ${activeHospital.shortName || activeHospital.name} emergency desk: ${activeHospital.phone}`
                  : 'Call 108 Emergency Ambulance (Toll-Free)'
              }
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Row 2: Triage Priority Categories (4 Equal Columns - NO SLIDING / NO SCROLL) */}
          <div className="pointer-events-auto grid grid-cols-4 gap-1.5 w-full">
            {Object.values(EMERGENCY_CATEGORIES).map((c) => {
              const selected = c.id === emergencyCategory;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setEmergencyCategory(c.id)}
                  title={`Route to a hospital with ${c.requiredSpecialty}`}
                  className={`w-full py-1.5 px-0.5 sm:px-2 rounded-lg text-xs font-mono font-bold border shadow-xs backdrop-blur-md cursor-pointer active:scale-95 transition-all text-center truncate ${
                    selected
                      ? 'text-white border-transparent'
                      : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800'
                  }`}
                  style={selected ? { backgroundColor: c.color } : undefined}
                  aria-pressed={selected}
                >
                  {c.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Row 3: GPS Activation on Left, Tools Menu Button on Right (Zero Overlap) */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleGpsToggle}
              aria-pressed={live.isGpsActive}
              title={live.isGpsActive ? 'Stop using device location' : 'Use device GPS'}
              className={`pointer-events-auto shrink-0 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border shadow-xs cursor-pointer active:scale-95 transition-all ${
                live.isGpsActive
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-[#D62828] border-red-600 text-white'
              }`}
            >
              {live.isGpsActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>GPS Active</span>
                  {live.gpsAccuracy != null && <span className="font-normal opacity-90 text-[10px]">· ±{Math.round(live.gpsAccuracy)}m</span>}
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Activate GPS</span>
                </>
              )}
            </button>

            {/* Quick Hospital Search Button */}
            <button
              type="button"
              onClick={() => {
                setTrafficOpen(false);
                setSearchModalOpen(true);
              }}
              className="pointer-events-auto flex-1 h-8 px-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border shadow-xs cursor-pointer active:scale-95 transition-all bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-800 truncate hover:border-slate-300 dark:hover:border-slate-700"
              title={`Search all ${availableHospitals?.length || 280} Pan-India apex hospitals by name, city, or specialty`}
            >
              <Search className="w-3.5 h-3.5 text-[#D62828] shrink-0" />
              <span className="truncate">Search Registry</span>
              <span className="text-[10px] opacity-70 font-normal hidden xs:inline">({routing.effectiveRadiusKm || 5}km auto)</span>
            </button>

            {/* Quick Tools Button */}
            <div className="pointer-events-auto relative shrink-0">
              <RoundButton
                label="Tools: Symbology, API, Guide"
                onClick={() => setPanel((p) => (p ? null : 'tools'))}
                active={panel !== null}
              >
                <LayoutGrid className="w-4 h-4" />
              </RoundButton>
              <span
                aria-hidden="true"
                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${
                  STATE_STYLE[apiHealth.summary.overall === 'ok' ? 'ok' : apiHealth.summary.overall].dot
                }`}
              />

              {panel === 'tools' && (
                <div className="absolute right-0 top-11 z-[600] w-56 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md p-1.5 page-enter font-mono text-xs">
                  {[
                    {
                      key: 'theme',
                      icon: isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />,
                      text: isDark ? 'Light Mode' : 'Dark Mode',
                      onClick: () => {
                        toggleTheme();
                        setPanel(null);
                      },
                    },
                    {
                      key: 'legend',
                      icon: <Layers className="w-4 h-4 text-[#D62828]" />,
                      text: 'Map Symbology',
                      onClick: () => setPanel('legend'),
                    },
                    {
                      key: 'api',
                      icon: <Activity className="w-4 h-4 text-sky-500" />,
                      text: 'Telemetry Feeds',
                      onClick: () => setPanel('api'),
                      badge: `${apiHealth.summary.ok}/${apiHealth.summary.total - apiHealth.summary.off}`,
                    },
                    {
                      key: 'help',
                      icon: <HelpCircle className="w-4 h-4 text-amber-500" />,
                      text: 'CAD Guide',
                      onClick: () => {
                        setHelpOpen(true);
                        setPanel(null);
                      },
                    },
                  ].map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      onClick={row.onClick}
                      className="w-full min-h-[38px] px-2.5 rounded-lg flex items-center gap-2.5 font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left transition-colors"
                    >
                      <span className="w-4 flex justify-center shrink-0">{row.icon}</span>
                      <span className="flex-1 truncate">{row.text}</span>
                      {row.badge && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">
                          {row.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ───────── Bottom-Right: Locate & Pin Controls ───────── */}
        <div
          className="absolute right-3 z-[500] flex flex-col items-end gap-2"
          style={{ bottom: '4.75rem' }}
        >
          <button
            type="button"
            onClick={() => setTrafficOpen(true)}
            title="Inject road delay or closure"
            className="h-9 px-3 rounded-lg flex items-center gap-1.5 shadow-xs border border-amber-500/40 bg-amber-500 text-slate-950 text-xs font-mono font-bold cursor-pointer active:scale-95 transition-all"
          >
            <TriangleAlert className="w-3.5 h-3.5" />
            Report Road
          </button>
          <RoundButton
            label={showGraphNetwork ? 'Hide graph network & nodes' : 'Show road graph network & intersection nodes (default: OFF)'}
            onClick={() => setShowGraphNetwork(!showGraphNetwork)}
            active={showGraphNetwork}
          >
            <Network className="w-4 h-4 text-[#D62828] dark:text-red-400" />
          </RoundButton>
          <RoundButton
            label={
              live.isGpsActive
                ? 'Device GPS active: click to switch to manual pin repositioning'
                : canDragAmbulance
                ? 'Lock ambulance pin position'
                : 'Unlock pin to drag or reposition ambulance'
            }
            onClick={() => {
              if (live.isGpsActive) {
                live.stopGps();
                setCanDragAmbulance(true);
              } else {
                setCanDragAmbulance(!canDragAmbulance);
              }
            }}
            active={canDragAmbulance}
          >
            <Pin className="w-4 h-4" />
          </RoundButton>
          <RoundButton label="Recenter on ambulance & route" onClick={handleLocate}>
            <Locate className="w-4 h-4 text-[#D62828] dark:text-red-400" />
          </RoundButton>
        </div>

        {/* ───────── Bottom-Left: Speedometer Gauge ───────── */}
        <div
          className="absolute left-3 z-[500]"
          style={{ bottom: '4.75rem' }}
          role="status"
          aria-label={`Current speed ${speed} km/h`}
        >
          <div
            className={`w-[60px] h-[60px] rounded-xl flex flex-col items-center justify-center shadow-md border-2 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 ${
              isMoving ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-xl font-black font-mono leading-none text-slate-900 dark:text-slate-50 tabular-nums">
              {speed}
            </span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
              km/h
            </span>
          </div>
        </div>

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
          onFocusPoint={(pt) => setFocusPoint({ ...pt, key: Date.now() })}
        />

        {/* ───────── Pan-India Hospital Search Modal Overlay (Fixed Fullscreen Overlay) ───────── */}
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
                    <span className="truncate">Hospital Registry ({availableHospitals?.length || 280})</span>
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

        {/* ───────── Location Permission / GPS Error Alert Modal ───────── */}
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
                  Chrome on Android blocks GPS hardware on plain <strong>HTTP</strong> network IPs (notice the <strong>⚠️ Not Secure</strong> badge in your address bar). W3C security rules strictly require a secure context (HTTPS or localhost).
                </p>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/80 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Quick Fix in Chrome on your phone (30s):</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    <li>In Chrome URL bar, open: <code className="text-[#D62828] dark:text-red-400 font-mono text-[10px]">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></li>
                    <li>Set the flag to <strong>Enabled</strong>.</li>
                    <li>In the text box below it, enter: <code className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">{typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://<your-ip>:3000'}</code></li>
                    <li>Tap <strong>Relaunch</strong> Chrome at the bottom.</li>
                  </ol>
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/80 space-y-0.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Alternative (via USB Port Forwarding):</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Connect phone via USB, forward port 3000 in PC Chrome (<code className="font-mono text-[10px]">chrome://inspect/#devices</code>), then open <code className="font-mono text-[10px]">http://localhost:3000</code> on your phone.
                  </p>
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
      </div>

      {/* Map Symbology Legend Modal (Centered overlay - never shifts header or triage chips) */}
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

      {/* Telemetry Feeds Status Modal (Clean scroll with sticky header and fixed close button) */}
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

      <MapHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export default MapScreen;
