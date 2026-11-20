/**
 * Control Panel Component: Emergency Dispatch & Routing Controls.
 * High-density tactical CAD operations panel with triage filters, live weather telemetry, and scenario tuning.
 */

import { EMERGENCY_CATEGORIES } from '../../config/emergencyCategories.js';
import { TIME_OF_DAY_FACTORS, WEATHER_FACTORS } from '../../data/congestionFactors.js';
import {
  Sliders,
  ShieldAlert,
  CloudSun,
  Radio,
  RefreshCw,
  MapPin,
  Download,
  CheckCircle2,
  Wind,
  Droplets,
  Eye,
  Activity,
  Zap,
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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs p-4 sm:p-5 space-y-4 transition-colors @container">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1F3C6D] dark:text-blue-400 uppercase tracking-wider font-mono min-w-0">
          <Sliders className="w-4 h-4 text-[#D62828] dark:text-red-400 shrink-0" />
          <span>Dispatch & Routing Controls</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-[#16A34A] dark:text-emerald-400 border border-emerald-500/30">
            OSM GRAPH ONLINE
          </span>
        </div>
      </div>

      {/* 1. Road Network Data Status */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#1F3C6D] dark:text-blue-400" />
            <span>Road Network Topology</span>
          </span>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-[#16A34A] dark:text-emerald-400 border border-emerald-500/30">
            GREATER NOIDA GRID
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Greater Noida High-Fidelity OSM Grid
              </div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Directed weighted graph G=(V,E,w) · Always active
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            Calibrated
          </span>
        </div>
        {overpassError && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
            Overpass sync notice: {overpassError}. Bundled OSM grid active.
          </p>
        )}
      </div>

      {/* 2. Emergency Triage Category (Specialty Constraint) */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
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
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                title={`Route to a hospital with ${cat.requiredSpecialty}`}
                className={`text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col justify-between cursor-pointer min-h-[54px] active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#D62828] dark:border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-950 dark:text-red-100 ring-1 ring-[#D62828] dark:ring-red-500 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold tracking-tight text-xs">{cat.shortLabel}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D62828] animate-pulse"></span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Req: {cat.requiredSpecialty}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Weather Telemetry (Open-Meteo Greater Noida) */}
      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2.5 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none" title="Use live station telemetry from Open-Meteo">
            <input
              type="checkbox"
              checked={useLiveWeather}
              onChange={(e) => onToggleLiveWeather && onToggleLiveWeather(e.target.checked)}
              className="rounded border-slate-300 text-[#1F3C6D] focus:ring-[#1F3C6D] w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-sky-500" />
              Live Weather Feed
            </span>
          </label>
          <div className="flex items-center gap-1.5">
            {liveWeather && (
              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-semibold border border-sky-500/20">
                NCR STATION
              </span>
            )}
            <button
              type="button"
              onClick={onRefreshWeather}
              disabled={isFetchingWeather}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
              title="Refresh weather data"
              aria-label="Refresh weather data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingWeather ? 'animate-spin text-[#1F3C6D]' : ''}`} />
            </button>
          </div>
        </div>

        {liveWeather ? (
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
              <span className="text-slate-600 dark:text-slate-400 text-xs">{liveWeather.label}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {liveWeather.temperatureC}°C
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div>
          <label className="block text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Congestion Window
          </label>
          <select
            title="Typical traffic for this time of day"
            aria-label="Traffic congestion window"
            value={timeOfDay}
            onChange={(e) => onChangeTimeOfDay(e.target.value)}
            className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#1F3C6D] transition-colors"
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
            className={`w-full text-xs font-mono rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden transition-colors ${
              useLiveWeather
                ? 'bg-slate-100/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-800 cursor-not-allowed'
                : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 focus:border-[#1F3C6D]'
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

      {/* 5. Emergency Green Corridor (Signal Preemption) */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <label className="flex items-start gap-2.5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={signalPriority}
            onChange={(e) => onToggleSignalPriority(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
          />
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              <Zap className={`w-3.5 h-3.5 ${signalPriority ? 'text-emerald-500 fill-emerald-500' : 'text-slate-400'}`} />
              Emergency Green Corridor (Signal Preemption)
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-mono">
              Simulates junction signal preemption, dropping average intersection delay from 25s to 4s.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

export default ControlPanel;
