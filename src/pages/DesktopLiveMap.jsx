/**
 * Google Maps–inspired Full-Bleed Desktop Dispatch View (`/` and `/map`).
 * Preserves full routing, 35,000-hospital search, 4 triage categories, GPS tracking,
 * Road Alerts inspector, Layers switcher (Default / Street / Satellite / Graph Nodes),
 * and zoom/locate controls — cleanly without any user account section.
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Navigation,
  AlertTriangle,
  Building2,
  Locate,
  Lock,
  Unlock,
  PhoneCall,
  X,
  Bed,
  TriangleAlert,
  Bell,
  Plus,
  LayoutGrid,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import MapView from '../components/map/DesktopMapView.jsx';
import HospitalSearchBar from '../components/map/HospitalSearchBar.jsx';
import { LayersThumbnail } from '../components/map/MapLayersControl.jsx';
import IncidentTool from '../components/map/IncidentTool.jsx';
import LiveLocationTracker from '../components/map/LiveLocationTracker.jsx';
import MapHelpModal from '../components/map/MapHelpModal.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { useBedManager } from '../context/BedManagerContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { EMERGENCY_CATEGORIES } from '../config/emergencyCategories.js';
import { WEATHER_FACTORS, TIME_OF_DAY_FACTORS } from '../data/congestionFactors.js';
import { formatDistance } from '../utils/geo.js';
import { formatDuration, formatEtaShort } from '../utils/time.js';
import { buildMapHospitalMarkers } from '../services/hospitalRanking.js';
import { HospitalBrandLogo } from '../components/ui/ProfessionalLogos.jsx';
import { DEFAULT_AMBULANCE_ORIGIN } from '../config/constants.js';

export function DesktopLiveMap({ fullBleed = true, onOpenNewEmergency }) {
  const { openBedManager } = useBedManager();
  const { isDark } = useTheme();
  const {
    graph,
    routing,
    live,
    canDragAmbulance,
    setCanDragAmbulance,
    mapStyle,
    setMapStyle,
    roadTelemetry,
    setRoadTelemetry,
    dispatchIncidents,
    focusIncidentOnMap,
  } = useDispatch();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [placeCardOpen, setPlaceCardOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'hospitals' | 'telemetry'
  const [showGraphNetwork, setShowGraphNetwork] = useState(false);
  const [roadReportMode, setRoadReportMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const {
    weightedGraph, timeOfDay, weather, useLiveWeather, liveWeather,
    incidents, addIncident, removeIncident, clearIncidents, reporter, setReporter,
  } = graph;
  const {
    ambulancePos, setAmbulanceCoordinates, snappedSourceNode,
    emergencyCategory, setEmergencyCategory, algorithm,
    selectedHospitalId, setSelectedHospitalId, isHospitalLocked, toggleHospitalLock,
    activeHospital, availableHospitals, topHospitals, searchHospitals,
    searchRadiusKm, setSearchRadiusKm, effectiveRadiusKm, isRadiusFallback,
  } = routing;

  const weatherMult =
    (useLiveWeather && liveWeather?.frictionFactor) ||
    WEATHER_FACTORS[weather]?.speedMultiplier ||
    1.0;
  const timeMult = TIME_OF_DAY_FACTORS[timeOfDay]?.speedMultiplier || 1.0;
  const combinedSpeedMult = Math.max(0.2, weatherMult * timeMult);

  const activeDistance = roadTelemetry?.distanceM || activeHospital?.distanceM || 0;
  const rawDuration = roadTelemetry?.durationSec || activeHospital?.travelTimeSec || 0;
  const activeDuration = rawDuration > 0 && combinedSpeedMult < 1
    ? Math.round(rawDuration / combinedSpeedMult)
    : rawDuration;

  const markersHospitals = buildMapHospitalMarkers({
    topHospitals,
    availableHospitals,
    activeHospital,
    ambulancePos,
    radiusKm: effectiveRadiusKm,
  });

  const openEmergencies = dispatchIncidents.filter((i) => i.status !== 'RESOLVED');
  const roadAlertCount = incidents instanceof Map ? incidents.size : 0;
  const totalNotifications = openEmergencies.length + roadAlertCount;

  const zoomExtraButtons = (
    <>
      {addIncident && (
        <button
          type="button"
          onClick={() => setRoadReportMode((v) => !v)}
          className={`h-9 px-3 rounded-xl border text-xs font-sans font-bold inline-flex items-center gap-1.5 shadow-lg cursor-pointer transition-all backdrop-blur-xl ${
            roadReportMode
              ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300/60'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Click any road segment on map to report traffic or blockage"
          aria-pressed={roadReportMode}
        >
          <TriangleAlert className={`w-3.5 h-3.5 ${roadReportMode ? 'text-slate-950' : 'text-amber-500'}`} />
          <span>{roadReportMode ? 'Click Road: ON' : 'Report Road'}</span>
        </button>
      )}
      <button
        type="button"
        onClick={() => setCanDragAmbulance((v) => !v)}
        className={`h-9 px-3 rounded-xl border text-xs font-sans font-bold inline-flex items-center gap-1.5 shadow-lg cursor-pointer transition-all backdrop-blur-xl ${
          canDragAmbulance
            ? 'bg-amber-500 text-slate-950 border-amber-400'
            : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={canDragAmbulance ? 'Click map or drag pin to relocate AMB-01' : 'Unlock ambulance pin to relocate'}
        aria-pressed={canDragAmbulance}
      >
        {canDragAmbulance ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
        <span>{canDragAmbulance ? 'Pin: Free' : 'Pin: Locked'}</span>
      </button>
    </>
  );

  return (
    <div className={fullBleed ? 'relative w-full h-full overflow-hidden' : 'relative w-full h-[640px] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-white/[0.08]'}>
      {/* Full-Bleed Map Canvas */}
      <MapView
        nodes={weightedGraph.nodes}
        edges={weightedGraph.edges}
        ambulancePos={ambulancePos}
        onAmbulanceMove={setAmbulanceCoordinates}
        snappedSourceNode={snappedSourceNode}
        hospitals={markersHospitals}
        searchHospitals={searchHospitals}
        activeHospitalId={activeHospital?.id}
        activeHospital={activeHospital}
        onSelectHospital={setSelectedHospitalId}
        activePathNodeIds={activeHospital?.pathNodeIds || []}
        incidents={incidents}
        onAddIncident={addIncident}
        onRemoveIncident={removeIncident}
        isFigure2Mode={false}
        isMoving={live.isMoving}
        isRealGps={live.isGpsActive}
        gpsAccuracy={live.gpsAccuracy}
        gpsSpeedKph={live.gpsSpeedKph || 0}
        gpsHeading={live.gpsHeading}
        followVehicle={live.followVehicle}
        canDragPin={canDragAmbulance}
        onTogglePinLock={setCanDragAmbulance}
        onRoadResolved={setRoadTelemetry}
        algorithm={algorithm}
        searchRadiusKm={searchRadiusKm}
        onRadiusChange={setSearchRadiusKm}
        effectiveRadiusKm={effectiveRadiusKm}
        isRadiusFallback={isRadiusFallback}
        mapStyle={mapStyle}
        showGraphNetwork={showGraphNetwork}
        roadReportMode={roadReportMode}
        bare={true}
        zoomExtraContent={zoomExtraButtons}
        zoomBottomClass="bottom-5"
        heightClass="h-full"
      />

      {/* Top Floating Google Maps Command Row (NO Account / Profile Section) */}
      <div className="absolute top-3.5 left-4 right-4 z-[600] flex items-start justify-between gap-3 pointer-events-none">
        {/* Left: Google Maps Pill Search + Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="pointer-events-auto w-full sm:w-[350px] xl:w-[380px] shrink-0">
            <HospitalSearchBar
              pill
              hospitals={searchHospitals && searchHospitals.length > 0 ? searchHospitals : availableHospitals}
              selectedHospitalId={selectedHospitalId}
              activeHospital={activeHospital}
              onSelectHospital={setSelectedHospitalId}
              ambulancePos={ambulancePos}
            />
          </div>

          {/* Horizontal Google Maps Filter Pills */}
          <div className="pointer-events-auto hidden md:flex items-center gap-1.5 flex-wrap">
            {Object.values(EMERGENCY_CATEGORIES).map((cat) => {
              const active = emergencyCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setEmergencyCategory(cat.id)}
                  className={`h-9 px-3.5 rounded-full border text-xs font-sans font-semibold shadow-md backdrop-blur-xl transition-all cursor-pointer active:scale-95 ${
                    active
                      ? 'text-white border-transparent shadow-lg'
                      : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  style={active ? { backgroundColor: cat.color } : undefined}
                >
                  {cat.shortLabel}
                </button>
              );
            })}

            {onOpenNewEmergency && (
              <button
                type="button"
                onClick={onOpenNewEmergency}
                className="h-9 px-3.5 rounded-full bg-[#D62828] hover:bg-red-700 text-white text-xs font-sans font-bold inline-flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Emergency</span>
              </button>
            )}

            <button
              type="button"
              onClick={openBedManager}
              className="h-9 px-3.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-sans font-semibold inline-flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Bed className="w-3.5 h-3.5 text-[#D62828] dark:text-red-400" />
              <span>Beds</span>
            </button>
          </div>
        </div>

        {/* Right: Operational Quick Tools (NO Account Section) */}
        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => (live.isGpsActive ? live.stopGps() : live.startGps())}
            className={`h-9 px-3.5 rounded-full border text-xs font-sans font-bold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xl cursor-pointer transition-all ${
              live.isGpsActive
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-white/[0.1] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Locate className={`w-3.5 h-3.5 ${live.isGpsActive ? 'text-white' : 'text-[#D62828]'}`} />
            <span>{live.isGpsActive ? 'GPS Live' : 'Activate GPS'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className={`h-9 px-3.5 rounded-full border text-xs font-sans font-semibold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xl cursor-pointer transition-all ${
              drawerOpen
                ? 'bg-[#D62828] border-[#D62828] text-white'
                : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-white/[0.1] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Corridor Inspector (Alerts, Hospitals, Telemetry)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Inspector</span>
            {roadAlertCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono font-bold">
                {roadAlertCount}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-9 h-9 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md flex items-center justify-center cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#D62828] text-white text-[9px] font-mono font-bold flex items-center justify-center tabular-nums">
                  {totalNotifications}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-2xl overflow-hidden z-[750]">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-slate-100">
                    Active Queue ({totalNotifications})
                  </span>
                  <Link to="/incidents" onClick={() => setNotifOpen(false)} className="text-[#D62828] font-semibold no-underline hover:underline">
                    View Queue
                  </Link>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {openEmergencies.map((inc) => (
                    <button
                      key={inc.id}
                      type="button"
                      onClick={() => {
                        focusIncidentOnMap(inc);
                        setNotifOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-[#D62828]">{inc.id} · {inc.severity}</span>
                        <span className="text-slate-500">{inc.assignedUnitId || 'Unassigned'}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate mt-0.5">{inc.locationName}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md flex items-center justify-center cursor-pointer"
            title="CAD Map Help & Tools"
            aria-label="CAD Map Guide"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom-Left: Google Maps Layers Square Card */}
      <div className="absolute bottom-5 left-4 z-[600] pointer-events-none">
        <LayersThumbnail
          mapStyle={mapStyle}
          onChangeMapStyle={setMapStyle}
          showGraphNetwork={showGraphNetwork}
          onToggleGraphNetwork={() => setShowGraphNetwork((v) => !v)}
          onOpenLegend={() => setHelpOpen(true)}
          isDark={isDark}
        />
      </div>

      {/* Top-Left Below Search Pill: Google Maps–Style Collapsible Place / Route Card */}
      {activeHospital && (
        <div className="absolute top-[64px] left-4 z-[590] pointer-events-none">
          {placeCardOpen ? (
            <div className="pointer-events-auto w-[350px] xl:w-[380px] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.1] shadow-2xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-2.5">
                <HospitalBrandLogo hospitalName={activeHospital.name} className="w-9 h-9 rounded-xl shrink-0 shadow-xs mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase">
                      {isHospitalLocked ? 'Locked' : selectedHospitalId ? 'Selected' : 'Recommended'}
                    </span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {activeDuration > 0 ? formatDuration(activeDuration) : '--'} · {activeDistance > 0 ? formatDistance(activeDistance) : '--'}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-1">
                    {activeHospital.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {activeHospital.bedAvailability?.icuBedsFree ?? 0} ICU · {activeHospital.bedAvailability?.traumaBedsFree ?? 0} Trauma · Origin: {snappedSourceNode?.name || DEFAULT_AMBULANCE_ORIGIN.shortName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlaceCardOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  aria-label="Minimize destination card"
                  title="Minimize card"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {activeHospital.phone && (
                  <a
                    href={`tel:${activeHospital.phone.replace(/[^0-9+]/g, '')}`}
                    className="flex-1 h-8 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold inline-flex items-center justify-center gap-1.5 no-underline transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={toggleHospitalLock}
                  aria-pressed={isHospitalLocked}
                  className={`h-8 px-2.5 rounded-xl border font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    isHospitalLocked
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {isHospitalLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{isHospitalLocked ? 'Locked' : 'Lock'}</span>
                </button>
                <Link
                  to="/routing"
                  className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold inline-flex items-center gap-1 no-underline transition-colors"
                >
                  <span>Routes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPlaceCardOpen(true)}
              className="pointer-events-auto h-10 px-4 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-xl text-xs font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="max-w-[200px] truncate">{activeHospital.shortName || activeHospital.name}</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {formatEtaShort(activeDuration || activeHospital.travelTimeSec)}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Floating Right Inspector Panel (Opens smoothly when toggled from top-right pill) */}
      {drawerOpen && (
        <aside className="absolute top-16 right-4 bottom-24 w-[360px] z-[650] rounded-2xl border border-slate-200/90 dark:border-white/[0.1] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 font-mono">
              Corridor Inspector
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-slate-950/60 p-1 gap-1">
            {[
              { id: 'alerts', label: 'Road Alerts', icon: AlertTriangle },
              { id: 'hospitals', label: 'Hospitals', icon: Building2 },
              { id: 'telemetry', label: 'Telemetry', icon: Navigation },
            ].map((t) => {
              const Icon = t.icon;
              const on = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    on
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-white/[0.08]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'alerts' && (
              <IncidentTool
                edges={weightedGraph.edges}
                nodes={weightedGraph.nodes}
                incidents={incidents}
                ambulancePos={ambulancePos}
                reporter={reporter}
                onChangeReporter={setReporter}
                onAddIncident={addIncident}
                onRemoveIncident={removeIncident}
                onClearIncidents={clearIncidents}
                timeOfDay={timeOfDay}
                weather={weather}
              />
            )}

            {activeTab === 'hospitals' && (
              <div className="space-y-2 text-xs">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>In-Range Candidates ({topHospitals.length})</span>
                  <Link to="/hospitals" className="text-[#D62828] no-underline hover:underline">
                    All {availableHospitals.length} →
                  </Link>
                </div>
                {topHospitals.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedHospitalId(h.id)}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      h.id === activeHospital?.id
                        ? 'border-[#D62828] bg-red-500/10'
                        : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {h.shortName || h.name}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      {formatDuration(h.travelTimeSec || 0)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'telemetry' && (
              <LiveLocationTracker
                isGpsActive={live.isGpsActive}
                gpsAccuracy={live.gpsAccuracy}
                gpsSpeedKph={live.gpsSpeedKph}
                gpsHeading={live.gpsHeading}
                gpsError={live.gpsError}
                totalDistanceMovedM={live.totalDistanceMovedM}
                followVehicle={live.followVehicle}
                onToggleFollow={live.setFollowVehicle}
                onStartGps={live.startGps}
                onStopGps={live.stopGps}
                currentPos={ambulancePos}
                snappedNode={snappedSourceNode}
                canDragPin={canDragAmbulance}
                onTogglePinLock={setCanDragAmbulance}
              />
            )}
          </div>
        </aside>
      )}

      <MapHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default DesktopLiveMap;
