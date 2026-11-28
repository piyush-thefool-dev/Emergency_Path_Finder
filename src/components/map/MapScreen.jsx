import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Pin, TriangleAlert, Unlock } from 'lucide-react';
import MapView from './MapView.jsx';
import MapHelpModal from './MapHelpModal.jsx';
import DesktopMapHud from './DesktopMapHud.jsx';
import MobileMapHud from './MobileMapHud.jsx';
import MobileMapModals from './MobileMapModals.jsx';
import { buildMapHospitalMarkers } from '../../services/hospitalRanking.js';
import { useDispatch } from '../../context/DispatchContext.jsx';
import { useBedManager } from '../../context/BedManagerContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useIsDesktop } from '../../hooks/useIsDesktop.js';
import { WEATHER_FACTORS, TIME_OF_DAY_FACTORS } from '../../data/congestionFactors.js';
import { isOffline, subscribeNetworkStatus } from '../../utils/network.js';

export function MapScreen({ variant = 'auto', fullBleed = true, onOpenNewEmergency = null }) {
  const navigate = useNavigate();
  const isViewportDesktop = useIsDesktop();
  const isDesktop = variant === 'desktop' ? true : variant === 'mobile' ? false : isViewportDesktop;

  const { isDark } = useTheme();
  const { openBedManager } = useBedManager();
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
    focusIncidentOnMap,
  } = useDispatch();

  const [recenterKey, setRecenterKey] = useState(0);
  const [panel, setPanel] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [trafficOpen, setTrafficOpen] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [showGraphNetwork, setShowGraphNetwork] = useState(false);
  const [roadReportMode, setRoadReportMode] = useState(false);
  const [isNetOffline, setIsNetOffline] = useState(() => isOffline());

  useEffect(() => subscribeNetworkStatus((online) => setIsNetOffline(!online)), []);

  useEffect(() => {
    if (!searchModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [searchModalOpen]);

  const {
    weightedGraph, timeOfDay, weather, useLiveWeather, liveWeather,
    incidents, addIncident, removeIncident,
  } = graph;
  const {
    ambulancePos, setAmbulanceCoordinates, snappedSourceNode,
    setSelectedHospitalId, activeHospital, availableHospitals, topHospitals,
    effectiveRadiusKm, isRadiusFallback, isHospitalLocked,
  } = routing;

  const weatherMult =
    (useLiveWeather && liveWeather?.frictionFactor) ||
    WEATHER_FACTORS[weather]?.speedMultiplier ||
    1.0;
  const timeMult = TIME_OF_DAY_FACTORS[timeOfDay]?.speedMultiplier || 1.0;
  const combinedSpeedMult = Math.max(0.2, weatherMult * timeMult);

  const telemetryMatchesActive =
    roadTelemetry?.durationSec && (!roadTelemetry.hospitalId || roadTelemetry.hospitalId === activeHospital?.id);
  const rawDuration = telemetryMatchesActive ? roadTelemetry.durationSec : activeHospital?.travelTimeSec || 0;
  const activeDuration =
    rawDuration > 0 && combinedSpeedMult < 1 ? Math.round(rawDuration / combinedSpeedMult) : rawDuration;
  const activeDistance =
    (telemetryMatchesActive ? roadTelemetry?.distanceM : null) || activeHospital?.distanceM || 0;

  const markersHospitals = buildMapHospitalMarkers({
    topHospitals,
    availableHospitals,
    activeHospital,
    ambulancePos,
    radiusKm: effectiveRadiusKm,
  });

  const openDispatchIncidentCount = (dispatchIncidents || []).filter((i) => i.status !== 'RESOLVED').length;

  const handleLocate = () => {
    setFocusPoint(null);
    if (!isHospitalLocked) {
      setSelectedHospitalId(null);
    }
    setRecenterKey((k) => k + 1);
    live.setFollowVehicle(true);
  };

  const zoomExtraContent = isDesktop ? (
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
  ) : (
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
  );

  const wrapperClass = isDesktop
    ? fullBleed
      ? 'relative w-full h-full overflow-hidden'
      : 'relative w-full h-[640px] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-white/[0.08]'
    : 'absolute inset-0 z-0 isolate overflow-hidden bg-slate-200 dark:bg-[#080D1A]';

  return (
    <>
      <div className={wrapperClass}>
        <MapView
          nodes={weightedGraph.nodes}
          edges={weightedGraph.edges}
          ambulancePos={ambulancePos}
          onAmbulanceMove={setAmbulanceCoordinates}
          snappedSourceNode={snappedSourceNode}
          hospitals={markersHospitals}
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
          roadReportMode={isDesktop ? roadReportMode : false}
          mapStyle={mapStyle}
          onLocate={handleLocate}
          zoomExtraContent={zoomExtraContent}
          zoomBottomClass={isDesktop ? 'bottom-5' : 'bottom-[5.25rem]'}
          zoomRightClass={isDesktop ? 'right-3.5' : 'right-3'}
          containerClassName={
            isDesktop
              ? 'relative w-full h-full overflow-hidden bg-slate-100 dark:bg-[#080D1A]'
              : 'absolute inset-0 w-full h-full'
          }
          effectiveRadiusKm={effectiveRadiusKm}
          isRadiusFallback={isRadiusFallback}
        />

        {isDesktop ? (
          <DesktopMapHud
            graph={graph}
            routing={routing}
            live={live}
            dispatchIncidents={dispatchIncidents}
            focusIncidentOnMap={focusIncidentOnMap}
            canDragAmbulance={canDragAmbulance}
            setCanDragAmbulance={setCanDragAmbulance}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
            isDark={isDark}
            showGraphNetwork={showGraphNetwork}
            setShowGraphNetwork={setShowGraphNetwork}
            activeDistance={activeDistance}
            activeDuration={activeDuration}
            onOpenBedManager={openBedManager}
            onOpenNewEmergency={onOpenNewEmergency}
            onOpenHelp={() => setHelpOpen(true)}
          />
        ) : (
          <MobileMapHud
            routing={routing}
            live={live}
            apiHealth={apiHealth}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
            isDark={isDark}
            showGraphNetwork={showGraphNetwork}
            setShowGraphNetwork={setShowGraphNetwork}
            isNetOffline={isNetOffline}
            openDispatchIncidentCount={openDispatchIncidentCount}
            panel={panel}
            setPanel={setPanel}
            setDrawerOpen={setDrawerOpen}
            setSearchModalOpen={setSearchModalOpen}
            setTrafficOpen={setTrafficOpen}
            onOpenHelp={() => setHelpOpen(true)}
            onNavigate={navigate}
            activeDistance={activeDistance}
            activeDuration={activeDuration}
          />
        )}
      </div>

      {!isDesktop && (
        <MobileMapModals
          trafficOpen={trafficOpen}
          setTrafficOpen={setTrafficOpen}
          searchModalOpen={searchModalOpen}
          setSearchModalOpen={setSearchModalOpen}
          panel={panel}
          setPanel={setPanel}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          openDispatchIncidentCount={openDispatchIncidentCount}
          graph={graph}
          routing={routing}
          live={live}
          apiHealth={apiHealth}
          onFocusPoint={(pt) => setFocusPoint({ ...pt, key: Date.now() })}
          onNavigate={navigate}
        />
      )}

      <MapHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export default MapScreen;
