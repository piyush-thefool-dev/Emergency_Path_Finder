/**
 * Uber / Rapido–style 3D Emergency Ambulance Marker on the 2D Leaflet Map.
 * Scales smoothly with map zoom so zoomed-out views stay clean and uncluttered.
 */

import { useMemo, useState } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { getMarkerScaleForZoom } from '../../utils/geo.js';

export function AmbulanceMarker({
  position,
  onDragEnd,
  snappedNode,
  isMoving = false,
  isRealGps = false,
  speedKph = 0,
  bearing = 0,
  canDragPin = false,
  onTogglePinLock,
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  const angle = Number.isFinite(bearing) ? Math.round(bearing) : 0;
  const scale = getMarkerScaleForZoom(zoom);
  const showTag = zoom >= 13;

  const ambulanceIcon = useMemo(() => {
    const wrapperClass = canDragPin && !isMoving ? 'ambulance-pin-wrapper' : 'ambulance-pin-wrapper-locked';
    const ringColor = isRealGps ? 'rgba(16,185,129,0.5)' : 'rgba(214,40,40,0.45)';
    const coneColor = isRealGps ? 'rgba(16,185,129,0.4)' : 'rgba(56,189,248,0.45)';
    const badgeBg = isRealGps ? '#059669' : '#D62828';

    const box = Math.max(22, Math.round(58 * scale));
    const imgSize = Math.max(16, Math.round(42 * scale));
    const coneW = Math.max(12, Math.round(30 * scale));
    const coneH = Math.max(10, Math.round(22 * scale));

    return L.divIcon({
      className: 'custom-ambulance-pin',
      html: `
        <div class="${wrapperClass}" style="position:relative;width:${box}px;height:${box}px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:${Math.round(box * 0.12)}px;border-radius:9999px;background:radial-gradient(circle, ${ringColor} 0%, transparent 72%);pointer-events:none;"></div>
          <div class="${isMoving ? 'ambulance-beacon-pulse-moving' : 'ambulance-beacon-pulse'}" style="bottom:${Math.round(box * 0.18)}px;width:${Math.round(box * 0.38)}px;height:${Math.round(box * 0.38)}px;"></div>
          <div style="position:relative;width:${imgSize}px;height:${imgSize}px;display:flex;align-items:center;justify-content:center;transform:rotate(${angle}deg);transition:transform 0.3s ease-out;pointer-events:none;">
            <div style="position:absolute;top:-${Math.round(coneH * 0.55)}px;left:50%;transform:translateX(-50%);width:${coneW}px;height:${coneH}px;background:linear-gradient(to top, ${coneColor}, transparent);clip-path:polygon(50% 0%, 100% 100%, 0% 100%);filter:blur(1px);"></div>
            <img
              src="/assets/ambulance-3d.png"
              alt="3D Ambulance"
              draggable="false"
              style="width:${imgSize}px;height:${imgSize}px;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.55));"
            />
          </div>
          ${
            showTag
              ? `<span style="position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);padding:1px 5px;border-radius:9999px;background:${badgeBg};color:#fff;font:800 8px/1.2 'JetBrains Mono',monospace;letter-spacing:0.04em;border:1px solid rgba(255,255,255,0.9);box-shadow:0 2px 5px rgba(0,0,0,0.4);white-space:nowrap;pointer-events:none;">AMB-01</span>`
              : ''
          }
        </div>
      `,
      iconSize: [box, box],
      iconAnchor: [Math.round(box / 2), Math.round(box / 2)],
      popupAnchor: [0, -Math.round(box / 2)],
    });
  }, [isMoving, isRealGps, canDragPin, angle, scale, showTag]);

  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        const marker = e.target;
        if (marker) {
          const latLng = marker.getLatLng();
          onDragEnd(latLng.lat, latLng.lng);
        }
      },
    }),
    [onDragEnd]
  );

  return (
    <Marker
      key={`ambulance-${isRealGps ? 'gps' : 'manual'}-${canDragPin ? 'unlocked' : 'locked'}`}
      position={[position.lat, position.lon]}
      icon={ambulanceIcon}
      draggable={canDragPin && !isMoving}
      eventHandlers={eventHandlers}
      zIndexOffset={2000}
    >
      <Popup>
        <div className="text-xs p-1 font-sans space-y-2 text-slate-900 dark:text-slate-100">
          <div className="font-bold uppercase tracking-wider text-2xs flex items-center justify-between text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  isRealGps ? 'bg-emerald-600 animate-pulse' : 'bg-[#D62828] animate-pulse'
                }`}
              />
              <span>
                {isRealGps ? 'Live Device GPS Active' : isMoving ? 'Vehicle Traversal Active' : 'Ambulance Position'}
              </span>
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-3xs font-mono font-bold ${
                canDragPin
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {canDragPin ? 'UNLOCKED' : 'FIXED'}
            </span>
          </div>

          <div className="space-y-0.5">
            <p className="text-slate-800 dark:text-slate-200 text-xs">
              <strong>Nearest junction:</strong> {snappedNode?.name || 'On road network'}
            </p>
            <p className="text-slate-500 dark:text-slate-400 font-mono text-3xs">
              Coordinates: {position.lat.toFixed(5)}°N, {position.lon.toFixed(5)}°E · {angle}°
            </p>
            {speedKph > 0 && (
              <p className="text-emerald-700 dark:text-emerald-400 font-mono text-3xs font-bold">
                Current Speed: {Math.round(speedKph)} km/h
              </p>
            )}
          </div>

          {!isMoving && (
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onTogglePinLock && onTogglePinLock(!canDragPin)}
                className={`w-full py-1 px-2 rounded text-3xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  canDragPin
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{canDragPin ? 'Lock Position' : 'Unlock to Drag Ambulance'}</span>
              </button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default AmbulanceMarker;
