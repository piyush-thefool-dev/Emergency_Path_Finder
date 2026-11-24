/**
 * Interactive Leaflet Map View Component: Tactical CAD Situational Awareness Display.
 * Supports dark mode night radar, vehicle tracking, draggable ambulance pin, and incident overlay.
 */

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import AmbulanceMarker from './AmbulanceMarker.jsx';
import HospitalMarkers from './HospitalMarkers.jsx';
import RouteLayer from './RouteLayer.jsx';
import MapHelpModal from './MapHelpModal.jsx';
import HospitalSearchBar from './HospitalSearchBar.jsx';
import {
  Ambulance,
  Hospital,
  Navigation,
  AlertOctagon,
  Flame,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Radio,
  Network,
  Locate,
  Lock,
  Unlock,
} from 'lucide-react';

/**
 * Panning controller when vehicle is in active transit.
 */
function VehicleFollower({ position, followVehicle }) {
  const map = useMap();

  useEffect(() => {
    if (followVehicle && position?.lat && position?.lon) {
      map.panTo([position.lat, position.lon], { animate: true, duration: 0.35 });
    }
  }, [map, position?.lat, position?.lon, followVehicle]);

  return null;
}

/**
 * Bounds fitting controller.
 */
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

/**
 * Camera controller triggered on manual recenter action.
 */
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

/** Relocates the ambulance pin when user clicks anywhere on the Greater Noida map. */
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
  activeHospitalId,
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
  followVehicle = true,
  canDragPin = false,
  onTogglePinLock,
  onRoadResolved = null,
  algorithm = 'astar',
  effectiveRadiusKm = 5,
  isRadiusFallback = false,
}) {
  const [legendOpen, setLegendOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [showQuickHint, setShowQuickHint] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  // Graph network overlay: displays all road intersection nodes and directed edges (ON by default for Pan-India & NCR inspection)
  const [showGraphNetwork, setShowGraphNetwork] = useState(true);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const handleRecenter = () => setRecenterTrigger((t) => t + 1);

  const targetHospital = useMemo(
    () => hospitals.find((h) => h.id === activeHospitalId) || null,
    [hospitals, activeHospitalId]
  );

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
      className={`relative w-full rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800/80 shadow-xs bg-slate-100 dark:bg-[#080D1A] transition-all duration-200 ${
        isMapExpanded ? 'h-[75dvh]' : 'h-[440px] sm:h-[500px] lg:h-[580px]'
      }`}
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        {/* OpenStreetMap TileLayer with compulsory ODbL attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapClickHandler
          onAmbulanceMove={onAmbulanceMove}
          canDragPin={canDragPin}
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
          routeEnd={hospitals.find((h) => h.id === activeHospitalId) || null}
          onRoadResolved={onRoadResolved}
          showAllNodes={showGraphNetwork}
          showGraphEdges={showGraphNetwork}
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

        {/* Dynamic semi-transparent search radius circle (5km, 10km, or 20km) */}
        {ambulancePos && effectiveRadiusKm && (
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
            canDragPin={canDragPin}
            onTogglePinLock={onTogglePinLock}
          />
        )}
      </MapContainer>

      {/* Top Floating Bar: Unified non-overlapping flex row (Search Bar on Left, Map Utilities on Right) */}
      <div className="absolute top-2.5 left-14 right-2.5 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Clean 21st.dev Command Search Bar & Auto Corridor Status Badge */}
        <div className="pointer-events-auto flex items-center gap-2 flex-1 max-w-xl min-w-0">
          <div className="flex-1 min-w-[200px]">
            <HospitalSearchBar
              hospitals={hospitals}
              selectedHospitalId={activeHospitalId}
              activeHospital={targetHospital}
              onSelectHospital={onSelectHospital}
              ambulancePos={ambulancePos}
            />
          </div>
          {effectiveRadiusKm && (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0 select-none"
              title={`Automatic corridor filtering: showing hospitals within ${effectiveRadiusKm} km`}
            >
              <span className={`w-2 h-2 rounded-full ${isRadiusFallback ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
              <span>{effectiveRadiusKm} km auto</span>
            </div>
          )}
        </div>

        {/* Right: Map Utility Controls (Expand & Interactive Guide) */}
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

      {/* Top Telemetry & Interactive Tip Ribbon - Positioned below search bar */}
      {showQuickHint && (
        <div className="absolute top-[52px] left-14 z-20 flex min-w-0 items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs text-[11px] font-mono text-slate-800 dark:text-slate-200 animate-in fade-in duration-200 max-w-sm">
          <div className="flex items-center gap-1.5 truncate min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D62828] animate-pulse shrink-0"></span>
            <span className="truncate">
              {canDragPin
                ? 'PIN UNLOCKED: Drag pin to move'
                : 'PIN LOCKED: Toggle "Lock Pin" below'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setHelpModalOpen(true)}
              className="text-[#D62828] dark:text-red-400 font-bold underline cursor-pointer text-[10px]"
            >
              Guide
            </button>
            <button
              type="button"
              onClick={() => setShowQuickHint(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              aria-label="Dismiss hint"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom-Right Tactical Map Controls Dock (Google Maps Style) */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 flex-wrap justify-end">
        {onTogglePinLock && (
          <button
            type="button"
            onClick={() => onTogglePinLock(!canDragPin)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl border shadow-xs text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] active:scale-95 ${
              canDragPin
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-400'
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={canDragPin ? 'Ambulance pin is unlocked (drag on map to reposition). Click to lock.' : 'Ambulance pin is locked. Click to unlock.'}
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
          title="Recenter camera on ambulance and route corridor"
          aria-label="Recenter camera on ambulance and route corridor"
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
          title={showGraphNetwork ? 'Hide graph network & nodes' : 'Show road graph network & intersection nodes (default: ON)'}
          aria-pressed={showGraphNetwork}
        >
          <Network className="w-3.5 h-3.5 text-[#D62828]" />
          <span>Nodes: {showGraphNetwork ? `ON (${nodes.length})` : 'OFF'}</span>
        </button>
      </div>

      {/* Floating Tactical Map Legend */}
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
          <div id="map-legend-items" className="p-3 space-y-2.5 text-xs font-mono max-h-[min(15rem,40dvh)] overflow-y-auto overscroll-contain">
            {/* 1. Ambulance Pin */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#D62828] border border-white shadow-2xs flex items-center justify-center text-white shrink-0">
                <Ambulance className="w-3 h-3 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] leading-tight">
                  Emergency Unit (Ambulance)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  Snaps to nearest graph intersection
                </span>
              </div>
            </div>

            {/* 2. Recommended Hospital */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-[#16A34A] border border-white shadow-2xs flex items-center justify-center text-white shrink-0">
                <Hospital className="w-3 h-3 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] leading-tight">
                    Recommended Receiving Facility
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  Lowest t(P) travel time with specialty match
                </span>
              </div>
            </div>

            {/* 3. Alternate Hospital */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-slate-700 dark:bg-slate-800 border border-white/60 shadow-2xs flex items-center justify-center text-white shrink-0">
                <Hospital className="w-3 h-3 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] leading-tight">
                  Contingency Hospital
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  Click pin on map to redirect ambulance
                </span>
              </div>
            </div>

            {/* 4. Optimal Route Polyline */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-center justify-center text-[#D62828] dark:text-red-400 shrink-0">
                <Navigation className="w-3 h-3 fill-current" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] leading-tight">
                  Dispatched Corridor
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-4 h-1 bg-[#D62828] rounded-full inline-block"></span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    A* Minimum travel-time path
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Incidents / Road Closures */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Flame className="w-3 h-3" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] leading-tight">
                  Road Bottleneck / Crash
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  Click any road segment to inject delay
                </span>
              </div>
            </div>

            {/* 6. Road Graph Network */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Network className="w-3 h-3" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] leading-tight">
                  Graph Intersections & Edges
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  Click &ldquo;Graph Nodes&rdquo; button to toggle (Default: OFF)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <MapHelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </div>
  );
}

export default MapView;
