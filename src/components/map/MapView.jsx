/**
 * Full-screen Leaflet map layer.
 *
 * This component renders ONLY the map and its layers (roads, route, hospitals,
 * ambulance). All floating UI (destination banner, speed circle, buttons) lives
 * in MapScreen so the map can fill the whole page like a navigation app.
 *
 * OpenStreetMap (ODbL) attribution is kept visible bottom-right.
 */

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import AmbulanceMarker from './AmbulanceMarker.jsx';
import HospitalMarkers from './HospitalMarkers.jsx';
import RouteLayer from './RouteLayer.jsx';

// Responsive camera framing padding avoiding coordinate clipping on narrow mobile viewports
function getResponsiveFitPadding() {
  if (typeof window === 'undefined') {
    return { topLeft: [40, 24], bottomRight: [40, 24] };
  }
  const isMobile = window.innerWidth < 768;
  return isMobile
    ? { topLeft: [75, 20], bottomRight: [85, 20] }
    : { topLeft: [45, 60], bottomRight: [45, 60] };
}

/**
 * Keeps the camera sensible:
 *  - fits ambulance + destination when the destination changes
 *  - re-fits when `recenterKey` is bumped (locate button)
 *  - follows the vehicle while it is moving
 */
function CameraController({ ambulancePos, destination, recenterKey, followVehicle, focusPoint }) {
  const map = useMap();
  const lastDestRef = useRef(null);
  const lastRecenterRef = useRef(recenterKey);
  const didInitRef = useRef(false);

  const destId = destination?.id ?? null;
  const destLat = destination?.lat;
  const destLon = destination?.lon;
  const ambLat = ambulancePos?.lat;
  const ambLon = ambulancePos?.lon;

  // Fit to ambulance + destination on first load, destination change, or recenter.
  useEffect(() => {
    if (ambLat == null || ambLon == null) return;
    const destChanged = lastDestRef.current !== destId;
    const recenterRequested = lastRecenterRef.current !== recenterKey;
    if (didInitRef.current && !destChanged && !recenterRequested) return;

    didInitRef.current = true;
    lastDestRef.current = destId;
    lastRecenterRef.current = recenterKey;

    const points = [[ambLat, ambLon]];
    if (destLat != null && destLon != null) points.push([destLat, destLon]);

    const { topLeft, bottomRight } = getResponsiveFitPadding();
    try {
      if (points.length > 1) {
        map.fitBounds(points, {
          paddingTopLeft: topLeft,
          paddingBottomRight: bottomRight,
          maxZoom: 15,
          animate: true,
        });
      } else {
        map.setView(points[0], 15);
      }
    } catch {
      map.setView([ambLat, ambLon], 14);
    }
  }, [map, ambLat, ambLon, destId, destLat, destLon, recenterKey]);

  // Jump to a point (used when a congestion report is tapped in the list).
  const lastFocusRef = useRef(null);
  useEffect(() => {
    if (!focusPoint || lastFocusRef.current === focusPoint.key) return;
    lastFocusRef.current = focusPoint.key;
    map.flyTo([focusPoint.lat, focusPoint.lon], 17, { duration: 0.6 });
  }, [map, focusPoint]);

  // Follow the vehicle while it is driving.
  useEffect(() => {
    if (followVehicle && ambLat != null && ambLon != null) {
      map.panTo([ambLat, ambLon], { animate: true, duration: 0.4 });
    }
  }, [map, ambLat, ambLon, followVehicle]);

  return null;
}

/** Re-measures the map when its container changes size (tab switches, rotation). */
function SizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
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
  focusPoint = null,
  isFigure2Mode,
  isMoving = false,
  isRealGps = false,
  gpsAccuracy = null,
  gpsSpeedKph = 0,
  followVehicle = true,
  canDragPin = false,
  onTogglePinLock,
  recenterKey = 0,
  onRoadResolved = null,
  showGraphNetwork = false,
}) {
  const defaultCenter = useMemo(
    () => (isFigure2Mode ? [28.475, 77.51] : [28.4625, 77.493]),
    [isFigure2Mode]
  );

  const activeHospital = useMemo(
    () => hospitals.find((h) => h.id === activeHospitalId) || null,
    [hospitals, activeHospitalId]
  );

  return (
    <MapContainer
      center={defaultCenter}
      zoom={14}
      zoomControl={false}
      scrollWheelZoom={true}
      className="epf-map absolute inset-0 w-full h-full"
    >
      {/* OpenStreetMap TileLayer with compulsory ODbL attribution */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <SizeWatcher />
      <MapClickHandler
        onAmbulanceMove={onAmbulanceMove}
        canDragPin={canDragPin}
        isMoving={isMoving}
      />
      <CameraController
        ambulancePos={ambulancePos}
        destination={activeHospital}
        recenterKey={recenterKey}
        followVehicle={followVehicle && isMoving && !focusPoint}
        focusPoint={focusPoint}
      />

      {/* Road Network & Route Lines */}
      <RouteLayer
        nodes={nodes}
        edges={edges}
        activePathNodeIds={activePathNodeIds}
        incidents={incidents}
        onSelectEdge={onSelectEdge}
        onAddIncident={onAddIncident}
        onRemoveIncident={onRemoveIncident}
        routeStart={ambulancePos}
        routeEnd={activeHospital}
        onRoadResolved={onRoadResolved}
        showAllNodes={showGraphNetwork}
        showGraphEdges={showGraphNetwork}
      />

      {/* Hospital Destination Pins */}
      <HospitalMarkers
        hospitals={hospitals}
        activeHospitalId={activeHospitalId}
        onSelectHospital={onSelectHospital}
      />

      {/* GPS Accuracy Radius Bubble */}
      {ambulancePos && gpsAccuracy && gpsAccuracy > 0 && (
        <Circle
          center={[ambulancePos.lat, ambulancePos.lon]}
          radius={gpsAccuracy}
          pathOptions={{
            color: isRealGps ? '#10B981' : '#3B82F6',
            fillColor: isRealGps ? '#34D399' : '#60A5FA',
            fillOpacity: 0.15,
            weight: 1.5,
            dashArray: '4, 4',
          }}
        />
      )}

      {/* Draggable & Live-Moving Ambulance Pin */}
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
  );
}

export default MapView;
