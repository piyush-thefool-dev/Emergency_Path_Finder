/**
 * Full-screen 2D Leaflet Map View with Uber/Rapido-style 3D Ambulance & 3D Hospital markers.
 * All floating UI lives in MapScreen so the 2D map stays crisp and full-bleed.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Circle, useMap, useMapEvents } from 'react-leaflet';
import AmbulanceMarker from './AmbulanceMarker.jsx';
import HospitalMarkers from './HospitalMarkers.jsx';
import RouteLayer from './RouteLayer.jsx';
import { MapTileLayers, MapZoomDock } from './MapLayersControl.jsx';
import { computeBearingDeg } from '../../utils/geo.js';
import { DEFAULT_AMBULANCE_ORIGIN } from '../../config/constants.js';

function getResponsiveFitPadding() {
  if (typeof window === 'undefined') {
    return { topLeft: [40, 24], bottomRight: [40, 24] };
  }
  const isMobile = window.innerWidth < 768;
  return isMobile
    ? { topLeft: [75, 20], bottomRight: [85, 20] }
    : { topLeft: [45, 60], bottomRight: [45, 60] };
}

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

  const lastFocusRef = useRef(null);
  useEffect(() => {
    if (!focusPoint || lastFocusRef.current === focusPoint.key) return;
    lastFocusRef.current = focusPoint.key;
    map.flyTo([focusPoint.lat, focusPoint.lon], 17, { duration: 0.6 });
  }, [map, focusPoint]);

  useEffect(() => {
    if (followVehicle && ambLat != null && ambLon != null) {
      map.panTo([ambLat, ambLon], { animate: true, duration: 0.4 });
    }
  }, [map, ambLat, ambLon, followVehicle]);

  return null;
}

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
  activeHospital: activeHospitalProp = null,
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
  gpsHeading = null,
  followVehicle = true,
  canDragPin = false,
  onTogglePinLock,
  recenterKey = 0,
  onRoadResolved = null,
  showGraphNetwork = false,
  mapStyle = 'auto',
  onLocate = null,
  zoomExtraContent = null,
  zoomBottomClass = 'bottom-[5.25rem]',
  effectiveRadiusKm = 10,
  isRadiusFallback = false,
}) {
  const [routeCoords, setRouteCoords] = useState([]);
  const defaultCenter = useMemo(
    () => (isFigure2Mode ? [28.475, 77.51] : [DEFAULT_AMBULANCE_ORIGIN.lat, DEFAULT_AMBULANCE_ORIGIN.lon]),
    [isFigure2Mode]
  );

  const activeHospital = useMemo(
    () => activeHospitalProp || hospitals.find((h) => h.id === activeHospitalId) || null,
    [activeHospitalProp, hospitals, activeHospitalId]
  );

  const vehicleBearing = useMemo(() => {
    if (gpsHeading != null && Number.isFinite(gpsHeading) && isMoving) return gpsHeading;
    if (routeCoords.length >= 2) {
      const look = routeCoords[Math.min(3, routeCoords.length - 1)];
      return computeBearingDeg(routeCoords[0][0], routeCoords[0][1], look[0], look[1]);
    }
    if (ambulancePos && activeHospital) {
      return computeBearingDeg(ambulancePos.lat, ambulancePos.lon, activeHospital.lat, activeHospital.lon);
    }
    return 0;
  }, [gpsHeading, isMoving, routeCoords, ambulancePos, activeHospital]);

  return (
    <div className={`absolute inset-0 w-full h-full map-${mapStyle}`}>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={true}
        className="epf-map w-full h-full"
      >
        <MapTileLayers mapStyle={mapStyle} />

        <MapZoomDock
          onLocate={onLocate}
          bottomClass={zoomBottomClass}
          rightClass="right-3"
          extraTopContent={zoomExtraContent}
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
          onDisplayCoordsChange={setRouteCoords}
          showAllNodes={showGraphNetwork}
          showGraphEdges={showGraphNetwork}
          canDragPin={canDragPin}
        />

        <HospitalMarkers
          hospitals={hospitals}
          activeHospitalId={activeHospitalId}
          onSelectHospital={onSelectHospital}
        />

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
    </div>
  );
}

export default MapView;
