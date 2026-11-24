/**
 * 21st.dev style Live Location & Vehicle Tracking Telemetry Component.
 * Supports physical browser GPS geolocation, automated vehicle dispatch, and spatial telemetry.
 */

import { motion } from 'motion/react';
import {
  Navigation2,
  MapPin,
  Gauge,
  Square,
  AlertCircle,
  Eye,
  Lock,
  Unlock,
  Radio,
  Compass,
} from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { formatDistance } from '../../utils/geo.js';

export function LiveLocationTracker({
  isGpsActive,
  gpsAccuracy,
  gpsSpeedKph,
  gpsError,
  totalDistanceMovedM,
  followVehicle,
  onToggleFollow,
  onStartGps,
  onStopGps,
  currentPos,
  snappedNode,
  canDragPin = false,
  onTogglePinLock,
}) {
  const isMoving = Boolean(isGpsActive);

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-4 sm:p-5 space-y-4 transition-colors @container">
      {/* Top Header & Tactical Action Controls */}
      <div className="flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${isMoving
                ? 'bg-emerald-600 shadow-emerald-600/30 animate-pulse'
                : 'bg-gradient-to-tr from-[#D62828] to-rose-600 shadow-red-600/25 border border-red-400/40'
              }`}
          >
            <Navigation2 className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono flex flex-wrap items-center gap-2">
              <span>Ambulance Telemetry & GPS Tracking</span>
              {isGpsActive && (
                <Badge variant="success" size="sm">LIVE DEVICE GPS</Badge>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono leading-relaxed">
              Track actual physical device coordinates with real-time road snapping and emergency dispatch telemetry.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 @3xl:shrink-0">
          {!isGpsActive ? (
            <Button
              variant="destructive"
              size="md"
              onClick={onStartGps}
              className="flex-1 min-w-[140px]"
              title="Track physical phone/device GPS"
            >
              <MapPin className="w-4 h-4" />
              <span>Track GPS Location</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={onStopGps}
              className="flex-1 min-w-[140px]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Halt GPS</span>
            </Button>
          )}

          {!isMoving && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => onTogglePinLock && onTogglePinLock(!canDragPin)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer min-h-[40px] shadow-xs ${canDragPin
                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-500'
                  : 'bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              title={canDragPin ? 'Ambulance pin draggable (click to lock)' : 'Pin locked to coordinate (click to unlock)'}
            >
              {canDragPin ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pin Unlocked</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pin Locked</span>
                </>
              )}
            </motion.button>
          )}

          <label
            className="flex items-center justify-center gap-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] cursor-pointer select-none min-h-[40px] shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Keep map centered on vehicle"
          >
            <input
              type="checkbox"
              checked={followVehicle}
              onChange={(e) => onToggleFollow && onToggleFollow(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
            />
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Follow</span>
          </label>
        </div>
      </div>

      {/* GPS Error Notification */}
      {gpsError && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 p-3.5 rounded-xl text-xs font-mono flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">{gpsError}</span>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
              Enable location access in browser permissions or unlock the pin to reposition the ambulance on the map.
            </p>
          </div>
        </div>
      )}

      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 @2xl:grid-cols-6 gap-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-3.5 text-xs font-mono">
        <div className="col-span-2 min-w-0">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
            Vehicle Coordinate
          </span>
          <span
            className="font-bold text-slate-900 dark:text-slate-100 text-xs block truncate"
            title={`${currentPos?.lat}, ${currentPos?.lon}`}
          >
            {currentPos?.lat ? `${currentPos.lat.toFixed(5)}°N, ${currentPos.lon.toFixed(5)}°E` : '28.46250°N, 77.50500°E'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
            Speed
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1 tabular-nums">
            <Gauge className="w-3 h-3 text-[#D62828]" />
            <span>{gpsSpeedKph !== null ? `${gpsSpeedKph} km/h` : '0 km/h'}</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
            GPS Precision
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs tabular-nums">
            {gpsAccuracy !== null ? `±${gpsAccuracy} m` : '±3 m (Model)'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
            Corridor Progress
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">
            {formatDistance(totalDistanceMovedM)}
          </span>
        </div>

        <div className="col-span-2 min-w-0">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
            Snapped Intersection
          </span>
          <span
            className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate block"
            title={snappedNode?.name}
          >
            {snappedNode?.name || 'Locating…'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default LiveLocationTracker;
