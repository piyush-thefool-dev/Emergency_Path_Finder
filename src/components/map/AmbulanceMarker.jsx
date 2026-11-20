/**
 * Draggable Ambulance Marker for Leaflet Map.
 *
 * Implements a custom Leaflet DivIcon featuring:
 *   - Distinctive Emergency Red (#D62828) Teardrop Map Pin
 *   - Emergency Vehicle Siren & Cross SVG icon
 *   - Animated radar beacon ripple at the anchor point
 *   - Smooth dragging and snapping to nearest valid graph node
 */

import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export function AmbulanceMarker({
  position,
  onDragEnd,
  snappedNode,
  isMoving = false,
  isRealGps = false,
  speedKph = 0,
  canDragPin = false,
  onTogglePinLock,
}) {
  // Custom SVG DivIcon for Ambulance replacing default blue pin
  const ambulanceIcon = useMemo(() => {
    const wrapperClass = canDragPin && !isMoving ? 'ambulance-pin-wrapper' : 'ambulance-pin-wrapper-locked';
    return L.divIcon({
      className: 'custom-ambulance-pin',
      html: `
        <div class="${wrapperClass}" style="width: 44px; height: 54px;">
          <!-- Animated radar ripple at needle anchor point -->
          <div class="${isMoving ? 'ambulance-beacon-pulse-moving' : 'ambulance-beacon-pulse'}"></div>

          <!-- Teardrop Pin SVG with Siren and Ambulance Vehicle -->
          <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
            <!-- Pin Outer Body -->
            <path
              d="M22 2C11.5 2 3 10.5 3 21C3 33.5 20.2 49 21.2 49.9C21.7 50.3 22.3 50.3 22.8 49.9C23.8 49 41 33.5 41 21C41 10.5 32.5 2 22 2Z"
              fill="${isRealGps ? '#16A34A' : '#D62828'}"
              stroke="#FFFFFF"
              stroke-width="2.5"
            />

            <!-- Top Siren Light -->
            <ellipse cx="22" cy="7.5" rx="3.5" ry="2" fill="#FBBF24" stroke="#FFFFFF" stroke-width="0.8"/>

            <!-- White Circle Background for Vehicle Icon -->
            <circle cx="22" cy="20" r="13" fill="#FFFFFF"/>

            <!-- Inner Ambulance Vehicle Icon (Deep Navy on White) -->
            <g transform="translate(13, 11)">
              <!-- Ambulance Body Outline -->
              <path d="M1 12V3C1 2.44772 1.44772 2 2 2H11C11.5523 2 12 2.44772 12 3V12" stroke="#1F3C6D" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M12 5H15.2C15.8 5 16.3 5.4 16.5 6L17.5 8.5C17.8 9.1 18 9.5 18 10.1V12H12" stroke="#1F3C6D" stroke-width="1.6" stroke-linecap="round"/>

              <!-- Red Cross in Ambulance Window/Body -->
              <path d="M5.5 6.5H8.5" stroke="#D62828" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M7 5V8" stroke="#D62828" stroke-width="1.8" stroke-linecap="round"/>

              <!-- Wheels -->
              <circle cx="4.5" cy="13" r="1.8" fill="#1F3C6D" stroke="#FFFFFF" stroke-width="0.8"/>
              <circle cx="14.5" cy="13" r="1.8" fill="#1F3C6D" stroke="#FFFFFF" stroke-width="0.8"/>
            </g>
          </svg>
        </div>
      `,
      iconSize: [44, 54],
      iconAnchor: [22, 52], // Bottom tip points directly at the coordinates
      popupAnchor: [0, -50],
    });
  }, [isMoving, isRealGps, canDragPin]);

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
      position={[position.lat, position.lon]}
      icon={ambulanceIcon}
      draggable={canDragPin && !isMoving}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div className="text-xs p-1 font-sans space-y-2">
          <div className="font-bold uppercase tracking-wider text-2xs flex items-center justify-between text-slate-900 border-b border-slate-100 pb-1">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  isRealGps ? 'bg-emerald-600 animate-pulse' : 'bg-[#D62828] animate-pulse'
                }`}
              ></span>
              <span>
                {isRealGps ? 'Live Device GPS Active' : isMoving ? 'Simulated Movement Active' : 'Ambulance Position'}
              </span>
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-3xs font-mono font-bold ${
                canDragPin
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {canDragPin ? 'UNLOCKED' : 'FIXED'}
            </span>
          </div>

          <div className="space-y-0.5">
            <p className="text-slate-800 text-xs">
              <strong>Nearest junction:</strong> {snappedNode?.name || 'On road network'}
            </p>
            <p className="text-slate-500 font-mono text-3xs">
              Coordinates: {position.lat.toFixed(5)}°N, {position.lon.toFixed(5)}°E
            </p>
            {speedKph > 0 && (
              <p className="text-emerald-700 font-mono text-3xs font-bold">
                Current Speed: {Math.round(speedKph)} km/h
              </p>
            )}
          </div>

          {/* Lock / Unlock Toggle Button in Popup */}
          {!isMoving && (
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onTogglePinLock && onTogglePinLock(!canDragPin)}
                className={`w-full py-1 px-2 rounded text-3xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  canDragPin
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{canDragPin ? '🔒 Fix Position (Lock)' : '🔓 Unlock to Drag Ambulance'}</span>
              </button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default AmbulanceMarker;
