/**
 * Interactive 2D Leaflet Map View Component (Desktop) with 3D Ambulance & 3D Hospital markers.
 */

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, Circle, useMap, useMapEvents } from 'react-leaflet';
import AmbulanceMarker from './AmbulanceMarker.jsx';
import HospitalMarkers from './HospitalMarkers.jsx';
import RouteLayer from './RouteLayer.jsx';
import MapHelpModal from './MapHelpModal.jsx';
import HospitalSearchBar from './HospitalSearchBar.jsx';
import { MapTileLayers, MapZoomDock } from './MapLayersControl.jsx';
import { computeBearingDeg } from '../../utils/geo.js';
import {
  Ambulance,
  Hospital,
  Navigation,
  Flame,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
  Network,
  Locate,
  Lock,
  Unlock,
} from 'lucide-react';

function VehicleFollower({ position, followVehicle }) {
  const map = useMap();

  useEffect(() => {
    if (followVehicle && position?.lat && position?.lon) {
      map.panTo([position.lat, position.lon], { animate: true, duration: 0.35 });
    }
  }, [map, position?.lat, position?.lon, followVehicle]);

  return null;
}

function MapRecenter({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
      } catch {
        map.setView(center, zoom);
      }
    } else if (center) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom, bounds]);

  return null;
}

function CameraActionHandler({ trigger, ambulancePos, targetHospital }) {
  const map = useMap();

  useEffect(() => {
    if (!trigger && !targetHospital) return;
    if (ambulancePos && targetHospital) {
      try {
        map.fitBounds(
          [
            [ambulancePos.lat, ambulancePos.lon],
            [targetHospital.lat, targetHospital.lon],
          ],
          { padding: [55, 55], maxZoom: 15 }
        );
      } catch {
        map.setView([targetHospital.lat, targetHospital.lon], 14);
      }
    } else if (targetHospital) {
      map.setView([targetHospital.lat, targetHospital.lon], 14);
    } else if (ambulancePos) {
      map.setView([ambulancePos.lat, ambulancePos.lon], 14);
    }
  }, [trigger, targetHospital?.id, map, ambulancePos, targetHospital]);

  return null;
}

function MapClickHandler({ onAmbulanceMove, canDragPin, isMoving }) {
  useMapEvents({
    click(e) {
      if (canDragPin && !isMoving && onAmbulanceMove && e?.latlng) {
        onAmbulanceMove(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export function MapView({
  nodes = [],
  edges = [],
  ambulancePos,
  onAmbulanceMove,
  snappedSourceNode,
  hospitals = [],
  searchHospitals = [],
  activeHospitalId,
  activeHospital: activeHospitalProp = null,
  onSelectHospital,
  activePathNodeIds = [],
  incidents = new Map(),
  onSelectEdge,
  onAddIncident,
  onRemoveIncident,
  isFigure2Mode,
  isMoving = false,
  isRealGps = false,
  gpsAccuracy = null,
  gpsSpeedKph = 0,
  gpsHeading = null,
  followVehicle = true,
  canDragPin = false,
  onTogglePinLock,
  onRoadResolved = null,
  effectiveRadiusKm = 10,
  isRadiusFallback = false,
  mapStyle = 'auto',
  showGraphNetwork: controlledGraph,
  roadReportMode: controlledRoadReport,
  bare = false,
  zoomExtraContent = null,
  zoomBottomClass = 'bottom-5',
  heightClass = null,
}) {
  const [legendOpen, setLegendOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [localShowGraph, setLocalShowGraph] = useState(false);
  const [localRoadReport, setLocalRoadReport] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [routeCoords, setRouteCoords] = useState([]);

  const showGraphNetwork = controlledGraph !== undefined ? controlledGraph : localShowGraph;
  const setShowGraphNetwork = (v) => setLocalShowGraph(typeof v === 'function' ? v(localShowGraph) : v);
  const roadReportMode = controlledRoadReport !== undefined ? controlledRoadReport : localRoadReport;
  const setRoadReportMode = (v) => setLocalRoadReport(typeof v === 'function' ? v(localRoadReport) : v);
  const handleRecenter = () => setRecenterTrigger((t) => t + 1);

  const targetHospital = useMemo(
    () => activeHospitalProp || hospitals.find((h) => h.id === activeHospitalId) || null,
    [activeHospitalProp, hospitals, activeHospitalId]
  );

  const vehicleBearing = useMemo(() => {
    if (gpsHeading != null && Number.isFinite(gpsHeading) && isMoving) return gpsHeading;
    if (routeCoords.length >= 2) {
      const look = routeCoords[Math.min(3, routeCoords.length - 1)];
      return computeBearingDeg(routeCoords[0][0], routeCoords[0][1], look[0], look[1]);
    }
    if (ambulancePos && targetHospital) {
      return computeBearingDeg(ambulancePos.lat, ambulancePos.lon, targetHospital.lat, targetHospital.lon);
    }
    return 0;
  }, [gpsHeading, isMoving, routeCoords, ambulancePos, targetHospital]);

  const defaultCenter = useMemo(() => {
    if (ambulancePos?.lat && ambulancePos?.lon) {
      return [ambulancePos.lat, ambulancePos.lon];
    }
    return isFigure2Mode ? [28.475, 77.51] : [28.482, 77.51];
  }, [ambulancePos, isFigure2Mode]);
  const defaultZoom = isFigure2Mode ? 14 : 13;
  const bounds = useMemo(() => {
    if (ambulancePos && targetHospital) {
      return [
        [ambulancePos.lat, ambulancePos.lon],
        [targetHospital.lat, targetHospital.lon],
      ];
    }
    return null;
  }, [ambulancePos, targetHospital]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-100 dark:bg-[#080D1A] transition-all duration-200 map-${mapStyle} ${
        heightClass
          ? heightClass
          : isMapExpanded
          ? 'h-[75dvh] rounded-xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs'
          : 'h-[440px] sm:h-[500px] lg:h-[580px] rounded-xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs'
      }`}
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapTileLayers mapStyle={mapStyle} />
        <MapZoomDock
          onLocate={handleRecenter}
          bottomClass={zoomBottomClass}
          rightClass="right-3.5"
          extraTopContent={zoomExtraContent}
        />

        <MapClickHandler
          onAmbulanceMove={onAmbulanceMove}
          canDragPin={canDragPin && !roadReportMode}
          isMoving={isMoving}
        />

        <MapRecenter center={defaultCenter} zoom={defaultZoom} bounds={bounds} />

        <CameraActionHandler
          trigger={recenterTrigger}
          ambulancePos={ambulancePos}
          targetHospital={targetHospital}
        />

        <RouteLayer
          nodes={nodes}
          edges={edges}
          activePathNodeIds={activePathNodeIds}
          incidents={incidents}
          onSelectEdge={onSelectEdge}
          onAddIncident={onAddIncident}
          onRemoveIncident={onRemoveIncident}
          routeStart={ambulancePos}
          routeEnd={targetHospital}
          onRoadResolved={onRoadResolved}
          onDisplayCoordsChange={setRouteCoords}
          showAllNodes={showGraphNetwork}
          showGraphEdges={showGraphNetwork}
          canDragPin={canDragPin}
          roadReportMode={roadReportMode}
        />

        <HospitalMarkers
          hospitals={hospitals}
          activeHospitalId={activeHospitalId}
          onSelectHospital={onSelectHospital}
        />

        <VehicleFollower position={ambulancePos} followVehicle={followVehicle && isMoving} />

        {ambulancePos && gpsAccuracy && gpsAccuracy > 0 && (
          <Circle
            center={[ambulancePos.lat, ambulancePos.lon]}
            radius={gpsAccuracy}
            pathOptions={{
              color: isRealGps ? '#10B981' : '#E11D48',
              fillColor: isRealGps ? '#34D399' : '#FB7185',
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        )}

        {ambulancePos && effectiveRadiusKm > 0 && (
          <Circle
            center={[ambulancePos.lat, ambulancePos.lon]}
            radius={effectiveRadiusKm * 1000}
            pathOptions={{
              color: isRadiusFallback ? '#F59E0B' : '#0284C7',
              fillColor: isRadiusFallback ? '#FBBF24' : '#38BDF8',
              fillOpacity: 0.06,
              weight: 1.5,
              dashArray: '6, 6',
            }}
          />
        )}

        {ambulancePos && (
          <AmbulanceMarker
            position={ambulancePos}
            onDragEnd={onAmbulanceMove}
            snappedNode={snappedSourceNode}
            isMoving={isMoving}
            isRealGps={isRealGps}
            speedKph={gpsSpeedKph}
            bearing={vehicleBearing}
            canDragPin={canDragPin}
            onTogglePinLock={onTogglePinLock}
          />
        )}
      </MapContainer>

      {!bare && (
        <>
          <div className="absolute top-2.5 left-14 right-2.5 z-30 flex items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto flex-1 max-w-sm sm:max-w-md md:max-w-lg min-w-0">
              <HospitalSearchBar
                hospitals={searchHospitals && searchHospitals.length > 0 ? searchHospitals : hospitals}
                selectedHospitalId={activeHospitalId}
                activeHospital={targetHospital}
                onSelectHospital={onSelectHospital}
                ambulancePos={ambulancePos}
              />
            </div>

            <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer min-h-[36px] active:scale-95"
                title={isMapExpanded ? 'Collapse map' : 'Expand map'}
                aria-label={isMapExpanded ? 'Collapse map' : 'Expand map'}
              >
                {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isMapExpanded ? 'Restore' : 'Expand'}</span>
              </button>

              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs text-xs font-mono font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer select-none min-h-[36px] active:scale-95"
                title="Interactive CAD Map Guide"
                aria-label="Interactive CAD Map Guide"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#D62828]" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 flex-wrap justify-end">
            {onAddIncident && (
              <button
                type="button"
                onClick={() => setRoadReportMode((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl border shadow-xs text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] active:scale-95 ${
                  roadReportMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-300'
                    : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-pressed={roadReportMode}
              >
                <TriangleAlert className={`w-3.5 h-3.5 ${roadReportMode ? 'text-slate-950' : 'text-amber-500'}`} />
                <span>{roadReportMode ? 'Click Road: ON' : 'Report Road'}</span>
              </button>
            )}

            {onTogglePinLock && (
              <button
                type="button"
                onClick={() => onTogglePinLock(!canDragPin)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl border shadow-xs text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] active:scale-95 ${
                  canDragPin
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-400'
                    : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-pressed={canDragPin}
              >
                {canDragPin ? <Unlock className="w-3.5 h-3.5 text-amber-500" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{canDragPin ? 'Pin: Free' : 'Pin: Locked'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRecenter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer min-h-[36px] active:scale-95"
              aria-label="Recenter camera"
            >
              <Locate className="w-3.5 h-3.5 text-[#D62828]" />
              <span className="hidden sm:inline">Recenter</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGraphNetwork((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl border shadow-xs text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] active:scale-95 ${
                showGraphNetwork
                  ? 'bg-[#1F3C6D] text-white border-blue-900 shadow-md ring-1 ring-blue-400'
                  : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-pressed={showGraphNetwork}
            >
              <Network className="w-3.5 h-3.5 text-[#D62828]" />
              <span>Nodes: {showGraphNetwork ? `ON (${nodes.length})` : 'OFF'}</span>
            </button>
          </div>

          <div className="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-sm w-[min(16rem,calc(100%-1.5rem))] transition-all">
            <button
              type="button"
              onClick={() => setLegendOpen((open) => !open)}
              aria-expanded={legendOpen}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 cursor-pointer border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-t-lg transition-colors select-none text-left"
            >
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-[11px] font-mono uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-[#D62828]" />
                <span>Map Symbology</span>
              </div>
              <span className="text-slate-400" aria-hidden="true">
                {legendOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </span>
            </button>

            {legendOpen && (
              <div className="p-3 space-y-2.5 text-xs font-mono max-h-[min(15rem,40dvh)] overflow-y-auto overscroll-contain">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#D62828] border border-white flex items-center justify-center text-white shrink-0">
                    <Ambulance className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">Emergency Unit (3D)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-[#16A34A] border border-white flex items-center justify-center text-white shrink-0">
                    <Hospital className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">Receiving Hospital (3D)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-center justify-center text-[#D62828] shrink-0">
                    <Navigation className="w-3 h-3 fill-current" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">Optimal Corridor</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
                    <Flame className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">Road Bottleneck</span>
                </div>
              </div>
            )}
          </div>

          <MapHelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
        </>
      )}
    </div>
  );
}

export default MapView;
