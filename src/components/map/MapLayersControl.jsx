/**
 * Shared Google Maps–inspired 2D Map Layer Switcher & Zoom Control Stack for React-Leaflet.
 * Used across both Mobile (`MapView` / `MapScreen`) and Desktop (`DesktopLiveMap`).
 */

import { useEffect, useRef, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Plus,
  Minus,
  LocateFixed,
  Network,
  Satellite,
  Moon,
  Sun,
  X,
} from 'lucide-react';

export const MAP_STYLES = [
  { id: 'auto', label: 'Default', icon: Moon, desc: 'Dark mode + tactical night map' },
  { id: 'street', label: 'Day Map', icon: Sun, desc: 'Light mode + original OSM' },
  { id: 'satellite', label: 'Satellite', icon: Satellite, desc: 'Aerial imagery + place names' },
];

/**
 * Renders the active 2D Leaflet TileLayer(s) — Default (tactical dark OSM), Day Map (Original OSM), or Satellite.
 */
export function MapTileLayers({ mapStyle = 'auto' }) {
  const map = useMap();

  useEffect(() => {
    const pane = map?.getPane?.('tilePane');
    if (!pane) return;
    if (mapStyle === 'auto') {
      pane.style.filter = 'brightness(0.65) invert(1) contrast(2.6) hue-rotate(200deg) saturate(0.3)';
    } else if (mapStyle === 'satellite') {
      pane.style.filter = 'brightness(0.98) contrast(1.04)';
    } else {
      pane.style.filter = 'none';
    }
  }, [map, mapStyle]);

  if (mapStyle === 'satellite') {
    return (
      <>
        <TileLayer
          key="esri-world-satellite"
          attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          detectRetina={true}
          maxNativeZoom={18}
          maxZoom={19}
          zIndex={1}
        />
        <TileLayer
          key="esri-reference-labels"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          detectRetina={true}
          maxNativeZoom={17}
          maxZoom={19}
          opacity={0.95}
          zIndex={2}
        />
      </>
    );
  }

  return (
    <TileLayer
      key={`osm-${mapStyle}`}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      detectRetina={true}
      maxNativeZoom={19}
      maxZoom={19}
      zIndex={1}
    />
  );
}

/**
 * Google Maps–style bottom-right Locate + connected (+ / -) vertical zoom stack
 * mounted inside a React-Leaflet `<MapContainer>`.
 */
export function MapZoomDock({
  onLocate,
  bottomClass = 'bottom-3',
  rightClass = 'right-3',
  extraTopContent = null,
}) {
  const map = useMap();
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    L.DomEvent.disableClickPropagation(ref.current);
    L.DomEvent.disableScrollPropagation(ref.current);
  }, []);

  return (
    <div
      ref={ref}
      className={`leaflet-top leaflet-right !pointer-events-auto !top-auto ${bottomClass} ${rightClass} !m-0 z-[500] flex flex-col items-end gap-2`}
      style={{ position: 'absolute' }}
    >
      {extraTopContent}

      {onLocate && (
        <button
          type="button"
          onClick={onLocate}
          aria-label="Center map on ambulance & route"
          title="Center map on ambulance & route"
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95 transition-all"
        >
          <LocateFixed className="w-[18px] h-[18px] text-[#D62828] dark:text-red-400" />
        </button>
      )}

      <div className="flex flex-col rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-lg overflow-hidden divide-y divide-slate-200/80 dark:divide-white/[0.08]">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          aria-label="Zoom in"
          title="Zoom in"
          className="w-10 h-9 flex items-center justify-center text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          aria-label="Zoom out"
          title="Zoom out"
          className="w-10 h-9 flex items-center justify-center text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
        >
          <Minus className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
}

/**
 * Iconic Google Maps bottom-left square "Layers" thumbnail card with expandable layer/detail popover.
 */
export function LayersThumbnail({
  mapStyle = 'auto',
  onChangeMapStyle,
  showGraphNetwork = false,
  onToggleGraphNetwork,
  onOpenLegend,
  isDark = false,
  sizeClass = 'w-14 h-14 sm:w-16 sm:h-16',
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0 pointer-events-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Map layers and graph overlay"
        title="Switch Default / Day Map / Satellite / Graph layers"
        className={`group relative ${sizeClass} rounded-xl overflow-hidden border-2 shadow-xl cursor-pointer transition-transform active:scale-95 ${
          open
            ? 'border-[#D62828] ring-2 ring-[#D62828]/40'
            : 'border-white/90 dark:border-slate-700 hover:border-white'
        }`}
      >
        <div
          className={`absolute inset-0 ${
            mapStyle === 'satellite'
              ? 'bg-[radial-gradient(circle_at_30%_30%,#365314,#1a2e05_55%,#0f172a)]'
              : mapStyle === 'street' || !isDark
              ? 'bg-[linear-gradient(135deg,#e2e8f0_0%,#cbd5e1_45%,#bae6fd_100%)]'
              : 'bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#0c4a6e_100%)]'
          }`}
        />
        <svg
          className="absolute inset-0 w-full h-full opacity-55"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <path d="M-4 44 L68 18" stroke={mapStyle === 'satellite' ? '#fde047' : '#ef4444'} strokeWidth="2.5" />
          <path d="M18 -4 L42 68" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" />
          <path d="M0 16 L64 46" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent px-1.5 py-1 flex items-center justify-center gap-1">
          <Layers className="w-3 h-3 text-white shrink-0" />
          <span className="text-[10px] font-sans font-bold text-white leading-none">Layers</span>
        </div>
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-60 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-2xl p-3 space-y-3 z-[750] text-xs font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#D62828]" />
              <span>Map Type &amp; Details</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              aria-label="Close layers menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MAP_STYLES.map((style) => {
              const Icon = style.icon;
              const active = mapStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onChangeMapStyle?.(style.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                    active
                      ? 'border-[#D62828] bg-red-500/10 text-[#D62828] dark:text-red-400 ring-1 ring-[#D62828]/40'
                      : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{style.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
            {onToggleGraphNetwork && (
              <button
                type="button"
                onClick={onToggleGraphNetwork}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  showGraphNetwork
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-[#D62828]" />
                  <span>Road Graph Nodes</span>
                </span>
                <span className="font-mono text-[10px] font-bold">
                  {showGraphNetwork ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {onOpenLegend && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenLegend();
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Map Symbology Guide</span>
                </span>
                <span className="text-[10px] text-slate-400">Open</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
