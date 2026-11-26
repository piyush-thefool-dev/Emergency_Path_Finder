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
  Lock,
  Unlock,
  Menu,
  Map as MapIcon,
  Truck,
  Building2,
  Route,
  BarChart3,
  Bed,
  Sliders,
  Settings as SettingsIcon,
} from 'lucide-react';
import MapView from './MapView.jsx';
import MapLegend from './MapLegend.jsx';
import MapHelpModal from './MapHelpModal.jsx';
import TrafficSheet from './TrafficSheet.jsx';
import HospitalSearchBar from './HospitalSearchBar.jsx';
import { buildMapHospitalMarkers } from '../../services/hospitalRanking.js';
import { LayersThumbnail } from './MapLayersControl.jsx';
import ApiStatusPanel, { STATE_STYLE } from '../panels/ApiStatusPanel.jsx';
import { useDispatch } from '../../context/DispatchContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { EMERGENCY_CATEGORIES } from '../../config/emergencyCategories.js';
import { formatDistance } from '../../utils/geo.js';
import { formatEtaShort } from '../../utils/time.js';
import { WEATHER_FACTORS, TIME_OF_DAY_FACTORS } from '../../data/congestionFactors.js';
import { isOffline, subscribeNetworkStatus } from '../../utils/network.js';

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
  const { isDark } = useTheme();
  const {
    graph,
    routing,
    live,
    apiHealth,
    canDragAmbulance,
    setCanDragAmbulance,
    mapStyle,
    setMapStyle,
    roadTelemetry,
    setRoadTelemetry,
    dispatchIncidents,
  } = useDispatch();
  const [recenterKey, setRecenterKey] = useState(0);
  const [panel, setPanel] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [trafficOpen, setTrafficOpen] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  // Graph network overlay: displays all road intersection nodes and directed edges (OFF by default)
  const [showGraphNetwork, setShowGraphNetwork] = useState(false);
  const [isNetOffline, setIsNetOffline] = useState(() => isOffline());

  useEffect(() => {
    const unsub = subscribeNetworkStatus((online) => {
      setIsNetOffline(!online);
    });
    return unsub;
  }, []);

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
  const openDispatchIncidentCount = (dispatchIncidents || []).filter((i) => i.status !== 'RESOLVED').length;

  const drawerItems = [
    { to: '/', label: 'Live Map', icon: MapIcon },
    { to: '/incidents', label: 'Emergency Incidents', icon: AlertTriangle, badge: openDispatchIncidentCount },
    { to: '/fleet', label: 'Ambulance Fleet', icon: Truck },
    { to: '/directory', label: 'Hospitals', icon: Building2 },
    { to: '/beds', label: 'Bed Registry', icon: Bed },
    { to: '/controls', label: 'Dispatch Controls', icon: Sliders },
    { to: '/routing', label: 'Route Optimization', icon: Route },
    { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleGpsToggle = () => {
    if (live.isGpsActive) live.stopGps();
    else live.startGps();
  };

  const handleLocate = () => {
    setFocusPoint(null);
    if (!routing.isHospitalLocked) {
      setSelectedHospitalId(null);
    }
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
          hospitals={buildMapHospitalMarkers({
            topHospitals: routing.topHospitals,
            availableHospitals,
            activeHospital,
            ambulancePos,
            radiusKm: routing.effectiveRadiusKm,
          })}
          activeHospitalId={activeHospital?.id}
          activeHospital={activeHospital}
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
          gpsHeading={live.gpsHeading}
          followVehicle={live.followVehicle}
          canDragPin={canDragAmbulance}
          onTogglePinLock={setCanDragAmbulance}
          recenterKey={recenterKey}
          onRoadResolved={setRoadTelemetry}
          showGraphNetwork={showGraphNetwork}
          mapStyle={mapStyle}
          onLocate={handleLocate}
          zoomBottomClass="bottom-[5.25rem]"
          zoomExtraContent={
            <>
              <button
                type="button"
                onClick={() => setTrafficOpen(true)}
                title="Report road delay or closure"
                className="h-9 px-2.5 rounded-xl flex items-center gap-1.5 shadow-lg border border-amber-500/40 bg-amber-500 text-slate-950 text-[11px] font-sans font-bold cursor-pointer active:scale-95 transition-all"
              >
                <TriangleAlert className="w-3.5 h-3.5" />
                <span>Report Road</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (live.isGpsActive) {
                    live.stopGps();
                    setCanDragAmbulance(true);
                  } else {
                    setCanDragAmbulance(!canDragAmbulance);
                  }
                }}
                aria-label="Toggle ambulance pin lock"
                title={canDragAmbulance ? 'Lock ambulance pin position' : 'Unlock pin to drag ambulance'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border backdrop-blur-xl cursor-pointer active:scale-95 transition-all ${
                  canDragAmbulance
                    ? 'bg-[#D62828] border-red-500 text-white'
                    : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-white/[0.1] text-slate-700 dark:text-slate-100'
                }`}
              >
                <Pin className="w-4 h-4" />
              </button>
            </>
          }
          searchRadiusKm={routing.searchRadiusKm}
          onRadiusChange={routing.setSearchRadiusKm}
          effectiveRadiusKm={routing.effectiveRadiusKm}
          isRadiusFallback={routing.isRadiusFallback}
        />

        {/* ───────── Top: Google Maps Pill Search + Category Chips (NO Account Circle) ───────── */}
        <div className="absolute top-2 inset-x-0 z-[500] pointer-events-none pt-safe px-2.5 space-y-2">
          {/* Row 1: Floating Pill Search Bar [≡ Menu | Search... | 🔍 | Route] + Grid Button */}
          <div className="flex items-center gap-2">
            <div className="pointer-events-auto flex-1 min-w-0 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-lg px-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setPanel(null);
                  setDrawerOpen(true);
                }}
                aria-label="Open dispatch operations menu"
                title="Open dispatch operations menu"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
              >
                <Menu className="w-4 h-4" />
                {openDispatchIncidentCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#D62828] text-white text-[8px] font-mono font-bold flex items-center justify-center tabular-nums">
                    {openDispatchIncidentCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTrafficOpen(false);
                  setSearchModalOpen(true);
                }}
                aria-label="Search Registry"
                title={`Search all ${availableHospitals?.length || 360} registered hospitals`}
                className="flex-1 min-w-0 h-full text-left px-1 text-xs sm:text-sm font-sans text-slate-500 dark:text-slate-300 truncate cursor-pointer"
              >
                Search {availableHospitals?.length || 360} hospitals…
              </button>

              <button
                type="button"
                onClick={() => {
                  setTrafficOpen(false);
                  setSearchModalOpen(true);
                }}
                aria-label="Search hospitals"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/hospitals')}
                title="Open active route & receiving hospital details"
                aria-label="Open hospital details"
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xs cursor-pointer shrink-0 active:scale-95 transition-transform ${
                  activeHospital ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#D62828]'
                }`}
              >
                <Navigation2 className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>

            {/* Quick Tools Grid (NO Account Avatar next to it) */}
            <div className="pointer-events-auto relative shrink-0">
              <button
                type="button"
                onClick={() => setPanel((p) => (p ? null : 'tools'))}
                aria-label="Tools: Symbology, API, Guide"
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-xl cursor-pointer active:scale-95 transition-all ${
                  panel !== null
                    ? 'bg-[#D62828] border-red-500 text-white'
                    : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-white/[0.1] text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <span
                aria-hidden="true"
                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${
                  STATE_STYLE[apiHealth.summary.overall === 'ok' ? 'ok' : apiHealth.summary.overall].dot
                }`}
              />

              {panel === 'tools' && (
                <div className="absolute right-0 top-12 z-[600] w-56 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-2xl p-1.5 page-enter font-mono text-xs">
                  {[
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
                      className="w-full min-h-[38px] px-2.5 rounded-xl flex items-center gap-2.5 font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left transition-colors"
                    >
                      <span className="w-4 flex justify-center shrink-0">{row.icon}</span>
                      <span className="flex-1 truncate">{row.text}</span>
                      {row.badge && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {row.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: All 4 Emergency Case Categories on One Clean Line */}
          <div className="pointer-events-auto grid grid-cols-4 gap-1.5">
            {Object.values(EMERGENCY_CATEGORIES).map((c) => {
              const selected = c.id === emergencyCategory;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setEmergencyCategory(c.id)}
                  title={`Route to a hospital with ${c.requiredSpecialty}`}
                  className={`h-8 px-2 rounded-full text-xs font-sans font-semibold flex items-center justify-center truncate border shadow-md backdrop-blur-xl cursor-pointer active:scale-95 transition-all ${
                    selected
                      ? 'text-white border-transparent'
                      : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-white/[0.1]'
                  }`}
                  style={selected ? { backgroundColor: c.color } : undefined}
                  aria-pressed={selected}
                >
                  {c.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Row 3: Activate GPS Button Lower Below Case Chips */}
          <div className="pointer-events-none flex items-center">
            <button
              type="button"
              onClick={handleGpsToggle}
              aria-pressed={live.isGpsActive}
              className={`pointer-events-auto shrink-0 h-8 px-3 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 border shadow-md backdrop-blur-xl cursor-pointer active:scale-95 transition-all ${
                live.isGpsActive
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-[#D62828] border-red-600 text-white'
              }`}
            >
              {live.isGpsActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>GPS Live</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Activate GPS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ───────── Lower-Left: Google Maps Layers Square + Speedometer Pill ───────── */}
        <div
          className="absolute left-3 z-[500] flex items-end gap-2 pointer-events-none"
          style={{ bottom: '5.25rem' }}
        >
          <LayersThumbnail
            mapStyle={mapStyle}
            onChangeMapStyle={setMapStyle}
            showGraphNetwork={showGraphNetwork}
            onToggleGraphNetwork={() => setShowGraphNetwork((v) => !v)}
            onOpenLegend={() => setPanel('legend')}
            isDark={isDark}
            sizeClass="w-14 h-14"
          />

          <div
            role="status"
            aria-label={`Current speed ${speed} km/h`}
            className={`h-10 px-2.5 rounded-xl flex flex-col items-center justify-center shadow-lg border backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 pointer-events-auto ${
              isMoving ? 'border-emerald-500' : 'border-slate-200/90 dark:border-white/[0.1]'
            }`}
          >
            <span className="text-sm font-black font-mono leading-none text-slate-900 dark:text-slate-50 tabular-nums">
              {speed} <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">KM/H</span>
            </span>
          </div>
        </div>

        {/* ───────── Compact Google Maps Bottom Destination Bar (Above Attribution & BottomNav) ───────── */}
        <div className="absolute inset-x-2.5 z-[500] pointer-events-none" style={{ bottom: '1.35rem' }}>
          <button
            type="button"
            onClick={() => navigate('/hospitals')}
            title="Open hospital details, ETA and alternatives"
            className="pointer-events-auto w-full text-left flex items-center gap-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-xl px-3 py-2 cursor-pointer active:scale-[0.99] transition-transform"
            aria-label="Open hospital details"
          >
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                activeHospital ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            >
              {activeHospital ? <Navigation2 className="w-3.5 h-3.5 fill-current" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="truncate">
                  {activeHospital
                    ? routing.isHospitalLocked
                      ? `Locked · ${category?.shortLabel || ''}`
                      : routing.selectedHospitalId
                      ? `Selected · ${category?.shortLabel || ''}`
                      : `Closest · ${category?.shortLabel || ''}`
                    : 'No hospital reachable'}
                </span>
                {isNetOffline && (
                  <span className="px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[9px]">Offline</span>
                )}
              </span>
              <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {activeHospital ? activeHospital.shortName || activeHospital.name : 'Select another category'}
              </span>
            </span>

            {activeHospital && (
              <span className="text-right shrink-0">
                <span className="block text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none tabular-nums">
                  {formatEtaShort(
                    roadTelemetry?.durationSec && (!roadTelemetry.hospitalId || roadTelemetry.hospitalId === activeHospital.id)
                      ? Math.round(
                          roadTelemetry.durationSec /
                            Math.max(
                              0.2,
                              ((graph.useLiveWeather && graph.liveWeather?.frictionFactor) ||
                                WEATHER_FACTORS[graph.weather]?.speedMultiplier ||
                                1.0) * (TIME_OF_DAY_FACTORS[graph.timeOfDay]?.speedMultiplier || 1.0)
                            )
                        )
                      : activeHospital.travelTimeSec
                  )}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {formatDistance(roadTelemetry?.distanceM || activeHospital.distanceM)}
                </span>
              </span>
            )}

            {activeHospital && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  routing.toggleHospitalLock();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    routing.toggleHospitalLock();
                  }
                }}
                aria-pressed={routing.isHospitalLocked}
                className={`p-1.5 rounded-lg border shrink-0 cursor-pointer ${
                  routing.isHospitalLocked
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                }`}
                title={routing.isHospitalLocked ? 'Unlock hospital choice' : 'Lock hospital choice'}
              >
                {routing.isHospitalLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </span>
            )}

            <a
              href={`tel:${(activeHospital?.phone || '108').replace(/[^0-9+]/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 no-underline"
              title={activeHospital?.phone ? `Call ${activeHospital.phone}` : 'Call 108'}
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          </button>
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
                    <span className="truncate">Hospital Registry ({availableHospitals?.length || 360} Registered Facilities)</span>
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

      {/* Mobile Slide-Over Dispatch Operations Navigation Drawer */}
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
                <img
                  src="/assets/pathfinder-logo.png"
                  alt="Pathfinder Logo"
                  className="w-9 h-9 rounded-xl object-cover shadow-md border border-white/10 shrink-0"
                />
                <div>
                  <span className="block text-sm font-bold tracking-tight leading-none">PATHFINDER</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Dispatch Control</span>
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
              {drawerItems.map(({ to, label, icon: Icon, badge }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate(to);
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
              ))}
            </nav>

            <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Delhi-NCR Grid</span>
              <span>v2.5</span>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}

export default MapScreen;
