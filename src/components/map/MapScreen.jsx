/**
 * Map Screen (Mobile CAD Map Tab).
 * Full-bleed tactical map with floating operations HUD:
 *   - Top: Destination banner (hospital + ETA) and emergency triage chips
 *   - Right: Tactical tools (symbology legend, API telemetry, guide, recenter)
 *   - Bottom-left: High-contrast telemetry speedometer gauge
 *   - Bottom: Corridor dispatch trip sheet with start/pause simulation
 */

import { useMemo, useState } from 'react';
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
  Pin,
  MapPin,
  TriangleAlert,
  Phone,
  PhoneCall,
  Network,
  X,
} from 'lucide-react';
import MapView from './MapView.jsx';
import MapLegend from './MapLegend.jsx';
import MapHelpModal from './MapHelpModal.jsx';
import TrafficSheet from './TrafficSheet.jsx';
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
        className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border backdrop-blur-md cursor-pointer active:scale-95 transition-all ${
          active
            ? 'bg-[#D62828] border-red-600 text-white'
            : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="map-tip pointer-events-none absolute right-full top-1/2 mr-2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-mono font-semibold px-2 py-1 shadow-md z-10"
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
  // Graph network overlay: displays all road intersection nodes and directed edges (OFF by default)
  const [showGraphNetwork, setShowGraphNetwork] = useState(false);

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
          hospitals={availableHospitals}
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
        />

        {/* ───────── Top: Destination Telemetry & Category Chips ───────── */}
        <div className="absolute top-0 inset-x-0 z-[500] pointer-events-none pt-safe px-3">
          <button
            type="button"
            onClick={() => navigate('/hospitals')}
            title="Open hospital details, ETA and alternatives"
            className="pointer-events-auto w-full text-left flex items-center gap-3 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm pl-2.5 pr-3 py-2 cursor-pointer active:scale-[0.99] transition-transform"
            aria-label="Open hospital details"
          >
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 ${
                activeHospital ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            >
              {activeHospital ? <Navigation2 className="w-4 h-4 fill-current" /> : <AlertTriangle className="w-4 h-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {activeHospital ? `Optimal Receiving · ${category?.shortLabel || ''}` : 'No hospital reachable'}
              </span>
              <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {activeHospital ? activeHospital.shortName || activeHospital.name : 'Select another category'}
              </span>
            </span>
            {activeHospital && (
              <span className="text-right shrink-0">
                <span className="block text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none">
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
              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer no-underline"
              title={
                activeHospital?.phone
                  ? `Call ${activeHospital.shortName || activeHospital.name} emergency desk: ${activeHospital.phone}`
                  : 'Call 108 Emergency Ambulance (Toll-Free)'
              }
            >
              <Phone className="w-4 h-4" />
            </a>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Triage Chips */}
          <div className="pointer-events-auto mt-2 -mx-3 px-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {Object.values(EMERGENCY_CATEGORIES).map((c) => {
              const selected = c.id === emergencyCategory;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setEmergencyCategory(c.id)}
                  title={`Route to a hospital with ${c.requiredSpecialty}`}
                  className={`shrink-0 px-3 h-8 rounded-lg text-xs font-mono font-bold border shadow-xs backdrop-blur-md cursor-pointer active:scale-95 transition-all ${
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

          {/* Location Toggle (Device GPS) */}
          <div className="pointer-events-auto mt-1 flex font-mono text-xs">
            <button
              type="button"
              onClick={handleGpsToggle}
              aria-pressed={live.isGpsActive}
              title={live.isGpsActive ? 'Stop using device location' : 'Use device GPS'}
              className={`shrink-0 h-8 pl-2.5 pr-3 rounded-lg font-bold flex items-center gap-1.5 border shadow-xs cursor-pointer active:scale-95 transition-all ${
                live.isGpsActive
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-[#D62828] border-red-600 text-white'
              }`}
            >
              {live.isGpsActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live GPS On
                  {live.gpsAccuracy != null && <span className="font-normal opacity-90">· ±{Math.round(live.gpsAccuracy)}m</span>}
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  Activate GPS
                </>
              )}
            </button>
          </div>
        </div>

        {/* ───────── Right Tools Action Bar ───────── */}
        <div className="absolute right-3 top-[9rem] sm:top-36 z-[500] flex flex-col items-end gap-2 pointer-events-none [&>*]:pointer-events-auto">
          <div className="relative">
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
          </div>

          {panel === 'tools' && (
            <div className="w-56 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md p-1.5 page-enter font-mono text-xs">
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

          {panel === 'legend' && <MapLegend onClose={() => setPanel(null)} />}
          {panel === 'api' && (
            <div className="w-[min(19rem,calc(100vw-4rem))] max-h-[55dvh] overflow-y-auto rounded-xl bg-white/97 dark:bg-slate-900/97 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md p-3 page-enter">
              <ApiStatusPanel health={apiHealth} bare />
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="mt-2 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
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
          {!isMoving && (
            <RoundButton
              label={canDragAmbulance ? 'Lock ambulance pin' : 'Unlock pin to move ambulance'}
              onClick={() => setCanDragAmbulance(!canDragAmbulance)}
              active={canDragAmbulance}
            >
              <Pin className="w-4 h-4" />
            </RoundButton>
          )}
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

              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 leading-normal space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">How to fix:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Tap the lock/settings icon near your browser address bar.</li>
                  <li>Set <strong>Location</strong> permissions to <strong>Allow</strong>.</li>
                  <li>Note: Mobile browsers block GPS over insecure HTTP (use localhost or HTTPS).</li>
                </ul>
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
      <MapHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export default MapScreen;
