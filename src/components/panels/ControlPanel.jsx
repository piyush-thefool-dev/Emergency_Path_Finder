/**
 * 21st.dev style Control Panel: Emergency Dispatch & Routing Controls.
 * High-density tactical CAD operations panel with triage filters, live weather telemetry, and scenario tuning.
 */

import { motion } from 'motion/react';
import { EMERGENCY_CATEGORIES } from '../../config/emergencyCategories.js';
import { TIME_OF_DAY_FACTORS, WEATHER_FACTORS } from '../../data/congestionFactors.js';
import Badge from '../ui/Badge.jsx';
import Switch from '../ui/Switch.jsx';
import {
  TraumaTriageLogo,
  CardiacTriageLogo,
  BurnTriageLogo,
  GeneralEmergencyLogo,
} from '../ui/BrandLogos.jsx';
import {
  Sliders,
  ShieldAlert,
  CloudSun,
  RefreshCw,
  Wind,
  Droplets,
  Eye,
} from 'lucide-react';

export function ControlPanel({
  emergencyCategory,
  onSelectCategory,
  timeOfDay,
  onChangeTimeOfDay,
  weather,
  onChangeWeather,
  signalPriority,
  onToggleSignalPriority,
  graphMode = 'real_osm',
  onChangeGraphMode,
  onDownloadOverpass,
  isDownloadingOverpass = false,
  overpassError = null,
  useLiveWeather = true,
  onToggleLiveWeather,
  liveWeather = null,
  onRefreshWeather,
  isFetchingWeather = false,
  trafficConfig = {},
}) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-4 sm:p-5 space-y-4 transition-colors @container">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <Sliders className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight leading-tight">
              Dispatch & Routing Controls
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
              Triage Specialty & Live Atmospheric Tuning
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="success">OSM GRAPH ONLINE</Badge>
        </div>
      </div>

      {/* Emergency Triage Category (Specialty Constraint) */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#D62828] dark:text-red-400" />
            <span>Triage Priority & Medical Specialty</span>
          </span>
          <span className="text-[10px] text-slate-400 normal-case font-normal">
            Hard Hospital Constraint
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(EMERGENCY_CATEGORIES).map((cat) => {
            const isSelected = emergencyCategory === cat.id;
            const CategoryLogo =
              cat.id === 'TRAUMA'
                ? TraumaTriageLogo
                : cat.id === 'CARDIAC'
                  ? CardiacTriageLogo
                  : cat.id === 'BURN'
                    ? BurnTriageLogo
                    : GeneralEmergencyLogo;

            return (
              <motion.button
                key={cat.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectCategory(cat.id)}
                title={`Route to a hospital with ${cat.requiredSpecialty}`}
                className={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between cursor-pointer min-h-[58px] ${isSelected
                    ? 'border-[#D62828] dark:border-red-500 bg-red-500/10 dark:bg-red-950/40 text-red-950 dark:text-red-100 ring-1 ring-red-500 font-semibold shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                    : 'border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/60 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                  }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 font-bold tracking-tight text-xs font-sans">
                    <CategoryLogo className="w-4 h-4 shrink-0" />
                    <span>{cat.shortLabel}</span>
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#D62828] dark:bg-red-500 animate-pulse"></span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Req: {cat.requiredSpecialty}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Weather Telemetry (Open-Meteo Greater Noida) */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none" title="Use live station telemetry from Open-Meteo">
            <input
              type="checkbox"
              checked={useLiveWeather}
              onChange={(e) => onToggleLiveWeather && onToggleLiveWeather(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-sky-500" />
              Live Weather Feed
            </span>
          </label>
          <div className="flex items-center gap-1.5">
            {liveWeather && (
              <Badge variant="primary" size="sm">NCR STATION</Badge>
            )}
            <button
              type="button"
              onClick={onRefreshWeather}
              disabled={isFetchingWeather}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Refresh weather data"
              aria-label="Refresh weather data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingWeather ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {liveWeather ? (
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
              <span className="text-slate-600 dark:text-slate-400 text-xs font-sans">{liveWeather.label}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {liveWeather.temperatureC}°C
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-sky-500" />
                {liveWeather.humidityPercent}% RH
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-teal-500" />
                {liveWeather.windSpeedKph} km/h
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {liveWeather.visibilityKm} km Vis
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 font-mono italic">
            Connecting to Open-Meteo station telemetry...
          </p>
        )}
      </div>

      {/* 4. Scenario Controls (Congestion Window & Weather Override) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
        <div>
          <label className="block text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Congestion Window
          </label>
          <select
            title="Typical traffic for this time of day"
            aria-label="Traffic congestion window"
            value={timeOfDay}
            onChange={(e) => onChangeTimeOfDay(e.target.value)}
            className="w-full text-xs font-mono bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
          >
            {Object.values(TIME_OF_DAY_FACTORS).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} (×{t.speedMultiplier})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Weather Model
          </label>
          <select
            title="Weather used for speed estimates. Turn off live feed to modify."
            aria-label="Manual weather factor"
            value={weather}
            onChange={(e) => onChangeWeather(e.target.value)}
            disabled={useLiveWeather}
            className={`w-full text-xs font-mono rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden transition-colors ${useLiveWeather
                ? 'bg-slate-100/70 dark:bg-slate-950/40 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-white/[0.06] cursor-not-allowed'
                : 'bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-white/[0.08] focus:border-blue-500'
              }`}
          >
            {Object.values(WEATHER_FACTORS).map((w) => (
              <option key={w.id} value={w.id}>
                {w.label} (×{w.speedMultiplier})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
