/**
 * 3D Architectural Hospital Landmark Markers for the 2D Leaflet Map (Uber / Rapido / Google Maps style).
 *   - Recommended Hospital: 3D Helipad Tower (`/assets/hospital-3d.png`) on illuminated emerald pad + gold BEST crown + callout banner
 *   - Contingency Hospitals: 3D Slate-Navy Medical Towers (`/assets/hospital-alt-3d.png`) on glowing navy base pads
 */

import { useState } from 'react';
import { Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Phone, PhoneCall } from 'lucide-react';
import { getMarkerScaleForZoom } from '../../utils/geo.js';

export function HospitalMarkers({ hospitals = [], activeHospitalId, onSelectHospital }) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  const scale = getMarkerScaleForZoom(zoom);
  const showPermanentAltNames = zoom >= 13;
  const showTargetBanner = zoom >= 10;

  const createHospitalIcon = (isTarget, displayName = '') => {
    const safeTitle = String(displayName).replace(/"/g, '&quot;');
    const spec = isTarget
      ? {
          boxW: Math.max(22, Math.round(58 * scale)),
          boxH: Math.max(24, Math.round(64 * scale)),
          imgSize: Math.max(18, Math.round(50 * scale)),
          padW: Math.max(18, Math.round(46 * scale)),
          padH: Math.max(7, Math.round(15 * scale)),
          marginBottom: 3,
          imgSrc: '/assets/hospital-3d.png',
          padBg: 'radial-gradient(circle, rgba(16,185,129,0.58) 0%, rgba(16,185,129,0.14) 68%, transparent 100%)',
          padBorder: '1.5px solid rgba(52,211,153,0.85)',
          imgShadow: 'drop-shadow(0 6px 8px rgba(0,0,0,0.5))',
          showBest: zoom >= 13,
        }
      : {
          boxW: Math.max(16, Math.round(42 * scale)),
          boxH: Math.max(18, Math.round(46 * scale)),
          imgSize: Math.max(14, Math.round(38 * scale)),
          padW: Math.max(14, Math.round(34 * scale)),
          padH: Math.max(5, Math.round(11 * scale)),
          marginBottom: 2,
          imgSrc: '/assets/hospital-alt-3d.png',
          padBg: 'radial-gradient(circle, rgba(37,99,235,0.42) 0%, transparent 75%)',
          padBorder: '1px solid rgba(96,165,250,0.65)',
          imgShadow: 'drop-shadow(0 4px 6px rgba(0,0,0,0.45))',
          showBest: false,
        };

    // Anchor on the 3D building's isometric footprint base so the tower covers the exact OSM POI coordinate
    const anchorY = Math.round(
      spec.boxH - spec.marginBottom - Math.max(4, Math.round(spec.imgSize * 0.24))
    );
    const padBottom = Math.max(1, spec.boxH - anchorY - Math.round(spec.padH / 2));

    return L.divIcon({
      className: 'custom-hospital-pin',
      html: `
        <div title="${safeTitle}" style="position:relative;width:${spec.boxW}px;height:${spec.boxH}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;">
          <div style="position:absolute;bottom:${padBottom}px;width:${spec.padW}px;height:${spec.padH}px;border-radius:9999px;background:${spec.padBg};border:${spec.padBorder};pointer-events:none;"></div>
          ${
            spec.showBest
              ? `<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);padding:1px 6px;border-radius:9999px;background:#FEF08A;color:#854D0E;border:1px solid #FFFFFF;font:900 8px/1.2 'Plus Jakarta Sans',sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.35);z-index:3;pointer-events:none;">BEST</div>`
              : ''
          }
          <img
            src="${spec.imgSrc}"
            alt=""
            draggable="false"
            style="position:relative;z-index:2;width:${spec.imgSize}px;height:${spec.imgSize}px;object-fit:contain;margin-bottom:${spec.marginBottom}px;filter:${spec.imgShadow};pointer-events:none;"
          />
        </div>
      `,
      iconSize: [spec.boxW, spec.boxH],
      iconAnchor: [Math.round(spec.boxW / 2), anchorY],
      popupAnchor: [0, -Math.max(16, Math.round(anchorY * 0.9))],
    });
  };

  return (
    <>
      {hospitals.map((hosp) => {
        const isTarget = hosp.id === activeHospitalId;
        const displayName = hosp.shortName || hosp.name;
        const icon = createHospitalIcon(isTarget, displayName);
        const durationMin = hosp.durationMin != null
          ? hosp.durationMin
          : hosp.travelTimeSec != null
          ? Number((hosp.travelTimeSec / 60).toFixed(1))
          : null;
        const roadDistanceKm = hosp.roadDistanceKm != null
          ? hosp.roadDistanceKm
          : hosp.distanceM != null
          ? Number((hosp.distanceM / 1000).toFixed(1))
          : null;

        return (
          <Marker
            key={hosp.id}
            position={[hosp.lat, hosp.lon]}
            icon={icon}
            zIndexOffset={isTarget ? 1500 : 100}
            eventHandlers={{
              click: (e) => {
                if (e?.originalEvent) {
                  L.DomEvent.stopPropagation(e.originalEvent);
                }
                if (onSelectHospital) {
                  onSelectHospital(hosp.id);
                }
              },
            }}
          >
            {isTarget ? (
              <Tooltip
                key={`tip-target-${showTargetBanner}`}
                permanent={showTargetBanner}
                direction="top"
                offset={[0, -Math.max(18, Math.round(44 * scale))]}
                className="custom-hospital-label-recommended"
              >
                <div className="flex items-center gap-1.5 text-2xs select-none whitespace-nowrap">
                  <span className="font-bold whitespace-nowrap">
                    ★ {displayName}
                  </span>
                  <span className="text-3xs font-mono font-bold bg-white/20 px-1 rounded text-white shrink-0">
                    RECOMMENDED
                  </span>
                </div>
              </Tooltip>
            ) : (
              <Tooltip
                key={`tip-alt-${showPermanentAltNames}`}
                permanent={showPermanentAltNames}
                direction="top"
                offset={[0, -Math.max(14, Math.round(32 * scale))]}
                className="custom-hospital-label"
              >
                <span className="font-semibold text-[10px] select-none whitespace-nowrap">
                  {displayName}
                </span>
              </Tooltip>
            )}

            <Popup autoPan={true} autoPanPaddingTopLeft={[24, 150]} autoPanPaddingBottomRight={[24, 100]}>
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
                        ★ ACTIVE
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

                {(durationMin != null || roadDistanceKm != null) && (
                  <div className="grid grid-cols-2 gap-1.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-lg p-1.5 text-center">
                    <div>
                      <span className="text-3xs uppercase font-mono text-slate-500 dark:text-slate-400 block font-semibold">Driving ETA</span>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {durationMin != null ? `${durationMin} mins` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-3xs uppercase font-mono text-slate-500 dark:text-slate-400 block font-semibold">Road Distance</span>
                      <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">
                        {roadDistanceKm != null ? `${roadDistanceKm} km` : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-3xs uppercase tracking-wide text-slate-700 dark:text-slate-300">Clinical Bed Capacity</span>
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
                        ? 'ICU AVAILABLE'
                        : (hosp.bedAvailability?.emergencyWardFree ?? 0) > 0
                        ? 'WARD AVAILABLE'
                        : 'FULL CAPACITY'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-2xs font-mono">
                    <div className="bg-white dark:bg-slate-950/90 p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-3xs text-slate-500 dark:text-slate-400 block">ICU Free</span>
                      <span className={`text-xs font-bold ${
                        (hosp.bedAvailability?.icuBedsFree ?? 0) > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {hosp.bedAvailability?.icuBedsFree ?? 0}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-950/90 p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-3xs text-slate-500 dark:text-slate-400 block">Ward Free</span>
                      <span className="text-xs font-bold text-[#1F3C6D] dark:text-sky-400">
                        {hosp.bedAvailability?.emergencyWardFree ?? 0}
                      </span>
                    </div>
                  </div>

                  {hosp.bedAvailability?.traumaBedsFree !== undefined && (
                    <div className="text-3xs text-slate-600 dark:text-slate-400 flex items-center justify-between px-1">
                      <span>Trauma Bay:</span>
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
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default HospitalMarkers;
