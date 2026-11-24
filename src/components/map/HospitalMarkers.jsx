/**
 * Hospital Markers for Leaflet Map.
 *
 * Implements custom Leaflet DivIcons and permanent highlighted callout badges:
 *   - Real Greater Noida healthcare facilities (Sharda, Kailash, Yatharth, Jaypee, GIMS)
 *   - Hospital markers show illustrative bed-estimate pills for prototype testing
 *   - Recommended Hospital is prominently distinguished in Emerald Green (#16A34A) with a gold "BEST" badge
 *   - Alternate hospitals are highlighted in Deep Navy (#1F3C6D) / Indigo
 */

import { useState } from 'react';
import { Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Phone, PhoneCall } from 'lucide-react';
import { PlaceholderBadge } from '../panels/PlaceholderBadge.jsx';

export function HospitalMarkers({ hospitals = [], activeHospitalId, onSelectHospital }) {
  // Prominently highlight and label all nearby hospitals in the active map corridor
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const showAllLabels = zoom >= 13 || map.getSize().x > 600; // Always label nearby hospitals at standard dispatch zoom

  // Custom SVG DivIcon factory for hospitals
  const createHospitalIcon = (isTarget) => {
    if (isTarget) {
      // Recommended Hospital: Bright Emerald Pin with Gold "BEST" Banner and pulsing glow
      return L.divIcon({
        className: 'custom-hospital-pin',
        html: `
          <div style="width: 44px; height: 52px; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(22, 163, 74, 0.55));">
            <svg width="44" height="50" viewBox="0 0 44 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Pin Outer Body -->
              <path
                d="M22 2C11.5 2 3 10.5 3 21C3 34 20.2 47.5 21.2 48.5C21.7 48.9 22.3 48.9 22.8 48.5C23.8 47.5 41 34 41 21C41 10.5 32.5 2 22 2Z"
                fill="#16A34A"
                stroke="#FFFFFF"
                stroke-width="2.5"
              />

              <!-- Top Golden BEST Banner -->
              <rect x="13.5" y="4.5" width="17" height="5.5" rx="2.75" fill="#FEF08A" stroke="#FFFFFF" stroke-width="0.8"/>
              <text x="22" y="9" font-family="Plus Jakarta Sans, sans-serif" font-size="4.2" font-weight="900" fill="#854D0E" text-anchor="middle">BEST</text>

              <!-- Center White Disc -->
              <circle cx="22" cy="23" r="11" fill="#FFFFFF"/>

              <!-- Tactical Hospital Symbology Icon (Hospital Building with Cross) -->
              <g transform="translate(14.5, 15.5) scale(0.625)" stroke="#16A34A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none">
                <path d="M12 7v4"/>
                <path d="M14 21v-3a2 2 0 0 0-4 0v3"/>
                <path d="M14 9h-4"/>
                <path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/>
                <path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16"/>
              </g>
            </svg>
          </div>
        `,
        iconSize: [44, 52],
        iconAnchor: [22, 50], // Bottom needle points directly at the coordinates
        popupAnchor: [0, -48],
      });
    }

    // Alternative Hospital: High-contrast Navy/Blue Pin with Medical Cross
    return L.divIcon({
      className: 'custom-hospital-pin',
      html: `
        <div style="width: 38px; height: 46px; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 3px 8px rgba(31, 60, 109, 0.45));">
          <svg width="38" height="44" viewBox="0 0 38 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Pin Outer Body -->
            <path
              d="M19 2C9.5 2 2 9.5 2 19C2 30 17.5 42 18.3 42.8C18.7 43.2 19.3 43.2 19.7 42.8C20.5 42 36 30 36 19C36 9.5 28.5 2 19 2Z"
              fill="#1F3C6D"
              stroke="#FFFFFF"
              stroke-width="2.2"
            />

            <!-- Center White Disc -->
            <circle cx="19" cy="19" r="9.5" fill="#FFFFFF"/>

            <!-- Tactical Hospital Symbology Icon (Hospital Building with Cross) -->
            <g transform="translate(12.8, 12.8) scale(0.52)" stroke="#1F3C6D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <path d="M12 7v4"/>
              <path d="M14 21v-3a2 2 0 0 0-4 0v3"/>
              <path d="M14 9h-4"/>
              <path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/>
              <path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16"/>
            </g>
          </svg>
        </div>
      `,
      iconSize: [38, 46],
      iconAnchor: [19, 44], // Bottom needle points directly at the coordinates
      popupAnchor: [0, -42],
    });
  };

  return (
    <>
      {hospitals.map((hosp) => {
        const isTarget = hosp.id === activeHospitalId;
        const icon = createHospitalIcon(isTarget);
        const displayName = hosp.shortName || hosp.name;

        return (
          <Marker
            key={hosp.id}
            position={[hosp.lat, hosp.lon]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectHospital && onSelectHospital(hosp.id),
            }}
          >
            {/* Permanent on-map callout label ensuring all hospitals are highlighted all the time */}
            {(isTarget || showAllLabels) && (
            <Tooltip
              permanent={true}
              direction="top"
              offset={[0, isTarget ? -52 : -46]}
              className={isTarget ? 'custom-hospital-label-recommended' : 'custom-hospital-label'}
            >
              <div className="flex items-center gap-1.5 text-2xs select-none">
                <span className="font-bold whitespace-nowrap">
                  {isTarget && '★ '}
                  {displayName}
                </span>
                {isTarget ? (
                  <span className="text-3xs font-mono font-bold bg-white/20 px-1 rounded text-white">
                    RECOMMENDED
                  </span>
                ) : (
                  <span className="text-3xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 px-1 rounded border border-transparent dark:border-slate-700">
                    {hosp.bedAvailability?.status || 'Active'}
                  </span>
                )}
              </div>
            </Tooltip>
            )}

                {/* Click Popup with Clinical & Telemetry Details */}
            <Popup>
              <div className="text-xs p-1 font-sans space-y-2 max-w-xs text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-tight">
                      {hosp.name}
                    </h4>
                    <span className="text-3xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      {hosp.address}
                    </span>
                  </div>
                  {isTarget ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-3xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                        ★ ACTIVE DESTINATION
                      </span>
                      {activeHospitalId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onSelectHospital === 'function') {
                              onSelectHospital(null);
                            }
                          }}
                          className="text-3xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-medium cursor-pointer"
                          title="Reset to automated CAD recommendation"
                        >
                          Auto
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof onSelectHospital === 'function') {
                          onSelectHospital(hosp.id);
                        }
                      }}
                      className="text-3xs px-2.5 py-1 rounded bg-[#1F3C6D] hover:bg-blue-800 text-white font-bold border border-blue-900 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      Set Destination
                    </button>
                  )}
                </div>

                {/* Illustrative bed estimate readout */}
                <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-3xs uppercase tracking-wide text-slate-700 dark:text-slate-300">Demo Bed Estimates</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-3xs font-mono font-bold ${
                        (hosp.bedAvailability?.icuBedsFree ?? 0) > 0
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : (hosp.bedAvailability?.emergencyWardFree ?? 0) > 0
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
                      }`}
                    >
                      {(hosp.bedAvailability?.icuBedsFree ?? 0) > 0
                        ? 'EST. ICU > 0'
                        : (hosp.bedAvailability?.emergencyWardFree ?? 0) > 0
                        ? 'EST. ICU 0'
                        : 'EST. 0 BEDS'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-2xs font-mono">
                    <div className="bg-white dark:bg-slate-950/90 p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-3xs text-slate-500 dark:text-slate-400 block">ICU Est.</span>
                      <span className={`text-xs font-bold ${
                        (hosp.bedAvailability?.icuBedsFree ?? 0) > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {hosp.bedAvailability?.icuBedsFree ?? 0}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-950/90 p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-3xs text-slate-500 dark:text-slate-400 block">Ward Est.</span>
                      <span className="text-xs font-bold text-[#1F3C6D] dark:text-sky-400">
                        {hosp.bedAvailability?.emergencyWardFree ?? 0}
                      </span>
                    </div>
                  </div>

                  {hosp.bedAvailability?.traumaBedsFree !== undefined && (
                    <div className="text-3xs text-slate-600 dark:text-slate-400 flex items-center justify-between px-1">
                      <span>Trauma Est.:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{hosp.bedAvailability.traumaBedsFree}</span>
                    </div>
                  )}
                </div>

                <div className="text-3xs text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Specialties: </span>
                    {(hosp.specialtyLabels || hosp.specialties || []).join(' · ')}
                  </div>
                </div>

                {/* Call Desk Button for Seat/Bed Confirmation & Emergency Hotline */}
                <div className="pt-1 space-y-1">
                  {hosp.phone && (
                    <a
                      href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[11px] shadow-xs active:scale-95 transition-all cursor-pointer no-underline"
                      title={`Call hospital emergency desk to confirm seat/bed availability (${hosp.phone})`}
                    >
                      <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                      <span>Call to Confirm Seat: {hosp.phone}</span>
                    </a>
                  )}
                  <a
                    href="tel:108"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold text-[10px] transition-all cursor-pointer no-underline border border-transparent dark:border-slate-700"
                    title="Direct 24/7 Government Emergency Ambulance Dispatch (Toll-Free 108)"
                  >
                    <Phone className="w-3 h-3 text-red-600 shrink-0" />
                    <span>24/7 Emergency Ambulance: 108 (Toll-Free)</span>
                  </a>
                </div>

                {/* Data limitation note */}
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-3xs font-mono">
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Illustrative values
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono">Confirm with hospital</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default HospitalMarkers;
