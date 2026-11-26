/**
 * Smart Route Optimization Workbench (`/routing`).
 * Calculates real shortest, fastest, recommended, and alternative routes using
 * Dijkstra, A*, OSRM/Valhalla/ORS road geometry, weather/time multipliers, and TomTom Flow.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Navigation,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CloudSun,
  Wind,
  Zap,
  Map as MapIcon,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { EMERGENCY_CATEGORIES } from '../config/emergencyCategories.js';
import { TIME_OF_DAY_FACTORS, WEATHER_FACTORS } from '../data/congestionFactors.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { astar } from '../algorithms/astar.js';
import { fetchRoadRoute } from '../services/roadSnapService.js';
import { buildIncidentList, extractLocalStreetSegment } from '../utils/incidents.js';
import { haversineDistance, formatDistance } from '../utils/geo.js';
import { formatDuration } from '../utils/time.js';
import { isOffline } from '../utils/network.js';

export function RouteOptimization() {
  const {
    graph,
    routing,
    roadTelemetry,
    dispatchIncidents,
    fleetUnits,
    selectedUnitId,
    activateFleetUnitOnMap,
  } = useDispatch();

  const {
    weightedGraph, timeOfDay, setTimeOfDay, weather, setWeather,
    useLiveWeather, toggleLiveWeather, liveWeather, refreshLiveWeather, isFetchingWeather,
    signalPriority, setSignalPriority, incidents,
  } = graph;

  const {
    ambulancePos, setAmbulanceCoordinates, snappedSourceNode,
    emergencyCategory, setEmergencyCategory,
    selectedHospitalId, setSelectedHospitalId,
    rankingResult, activeHospital, availableHospitals,
  } = routing;

  const [liveRoadProbe, setLiveRoadProbe] = useState(null);
  const [probingRoad, setProbingRoad] = useState(false);

  const weatherMult =
    (useLiveWeather && liveWeather?.frictionFactor) ||
    WEATHER_FACTORS[weather]?.speedMultiplier ||
    1.0;
  const timeMult = TIME_OF_DAY_FACTORS[timeOfDay]?.speedMultiplier || 1.0;
  const combinedSpeedMult = Math.max(0.2, weatherMult * timeMult);

  // All registered hospitals sorted closest-first so Target Hospital dropdown covers all 280 facilities
  const sortedHospitals = useMemo(() => {
    if (!ambulancePos?.lat || !availableHospitals?.length) return availableHospitals || [];
    return [...availableHospitals].sort(
      (a, b) =>
        haversineDistance(ambulancePos.lat, ambulancePos.lon, a.lat, a.lon) -
        haversineDistance(ambulancePos.lat, ambulancePos.lon, b.lat, b.lon)
    );
  }, [availableHospitals, ambulancePos?.lat, ambulancePos?.lon]);

  // Real-time Dijkstra vs A* comparison for current source -> activeHospital
  const solverMetrics = useMemo(() => {
    if (!snappedSourceNode?.id || !activeHospital?.nodeId || !weightedGraph) return null;
    const dRes = dijkstra(weightedGraph, snappedSourceNode.id, activeHospital.nodeId);
    const aRes = astar(weightedGraph, snappedSourceNode.id, activeHospital.nodeId);
    return { dRes, aRes };
  }, [weightedGraph, snappedSourceNode?.id, activeHospital?.nodeId]);

  const recalculateLiveRoad = useCallback(async () => {
    if (!ambulancePos || !activeHospital || isOffline()) {
      setLiveRoadProbe(null);
      return;
    }
    setProbingRoad(true);
    try {
      const nodeMap = new Map(weightedGraph.nodes.map((n) => [n.id, n]));
      const closed = [];
      const slow = [];
      const activeIncidents = buildIncidentList(incidents instanceof Map ? incidents : new Map(), weightedGraph.edges, weightedGraph.nodes);
      for (const item of activeIncidents) {
        const a = item.edge ? nodeMap.get(item.edge.from) : null;
        const b = item.edge ? nodeMap.get(item.edge.to) : null;
        const raw = a && b ? [[a.lat, a.lon], [b.lat, b.lon]] : null;
        const seg =
          Array.isArray(item.streetSegment) && item.streetSegment.length >= 2
            ? item.streetSegment
            : raw
            ? extractLocalStreetSegment(raw, item.point || [(raw[0][0] + raw[1][0]) / 2, (raw[0][1] + raw[1][1]) / 2], 45)?.streetSegment || raw
            : null;
        if (!seg) continue;
        if (item.level?.closed) closed.push(seg);
        else if (item.level?.factor > 1) slow.push({ segment: seg, factor: item.level.factor });
      }
      const res = await fetchRoadRoute({
        start: [ambulancePos.lat, ambulancePos.lon],
        end: [activeHospital.lat, activeHospital.lon],
        closed,
        slow,
      });
      setLiveRoadProbe(res);
    } catch {
      setLiveRoadProbe(null);
    } finally {
      setProbingRoad(false);
    }
  }, [ambulancePos, activeHospital, weightedGraph.nodes, weightedGraph.edges, incidents]);

  useEffect(() => {
    recalculateLiveRoad();
  }, [recalculateLiveRoad]);

  const effectiveRoadDuration = useMemo(() => {
    const rawRoadSec = liveRoadProbe?.durationSec || roadTelemetry?.durationSec || 0;
    const isProbeCalibrated = Boolean(liveRoadProbe ? liveRoadProbe.isWeatherCalibrated : roadTelemetry?.isWeatherCalibrated);
    if (rawRoadSec > 0) {
      const scaled = isProbeCalibrated || combinedSpeedMult >= 1
        ? rawRoadSec
        : Math.round(rawRoadSec / combinedSpeedMult);
      return signalPriority ? Math.max(30, Math.round(scaled * 0.9)) : scaled;
    }
    return activeHospital?.travelTimeSec || 0;
  }, [liveRoadProbe, roadTelemetry, activeHospital?.travelTimeSec, combinedSpeedMult, signalPriority]);

  const routeOptions = useMemo(() => {
    const list = [];
    if (activeHospital) {
      list.push({
        id: 'recommended',
        tag: 'Recommended',
        tone: 'primary',
        title: `CAD Optimal Corridor -> ${activeHospital.shortName || activeHospital.name}`,
        etaSec: effectiveRoadDuration || activeHospital.travelTimeSec || 0,
        distanceM: liveRoadProbe?.distanceM || roadTelemetry?.distanceM || activeHospital.distanceM || 0,
        trafficNote: liveRoadProbe?.status === 'rerouted'
          ? 'Detoured around reported blockage'
          : `${TIME_OF_DAY_FACTORS[timeOfDay]?.label || timeOfDay} · Weather ×${weatherMult.toFixed(2)}`,
        roadDetail: `ICU Ready: ${activeHospital.bedAvailability?.icuBedsFree ?? 0} beds · Specialty Match`,
      });
    }

    if (liveRoadProbe || roadTelemetry) {
      const r = liveRoadProbe || roadTelemetry;
      list.push({
        id: 'fastest',
        tag: 'Fastest Road',
        tone: 'success',
        title: 'Live OSRM / Valhalla Arterial Path',
        etaSec: r.durationSec || 0,
        distanceM: r.distanceM || 0,
        trafficNote: r.status === 'blocked' ? 'Crosses closure alert' : 'Direct paved centerline geometry',
        roadDetail: `${r.coords?.length || 0} geometry waypoints resolved`,
      });
    }

    if (solverMetrics?.dRes?.success) {
      list.push({
        id: 'shortest',
        tag: 'Graph Baseline',
        tone: 'neutral',
        title: 'Directed Graph Optimal Cost (Dijkstra / A*)',
        etaSec: Math.round(solverMetrics.dRes.totalCost || 0),
        distanceM: activeHospital?.distanceM || 0,
        trafficNote: `A* pruned to ${solverMetrics.aRes?.nodesExpanded ?? 0} nodes (vs ${solverMetrics.dRes.nodesExpanded} Dijkstra)`,
        roadDetail: `${solverMetrics.dRes.path?.length || 0} road intersection hops`,
      });
    }

    const alt = (rankingResult?.alternateCandidates || []).slice(0, 2);
    alt.forEach((h, idx) => {
      list.push({
        id: `alt-${h.id}`,
        tag: `Alternative ${idx + 1}`,
        tone: 'warning',
        title: `Fallback -> ${h.shortName || h.name}`,
        etaSec: h.travelTimeSec || 0,
        distanceM: h.distanceM || 0,
        trafficNote: `${h.bedAvailability?.icuBedsFree ?? 0} ICU beds free`,
        roadDetail: h.city || h.address || 'Alternate emergency facility',
        hospitalId: h.id,
      });
    });

    return list;
  }, [
    activeHospital,
    effectiveRoadDuration,
    liveRoadProbe,
    roadTelemetry,
    timeOfDay,
    weatherMult,
    solverMetrics,
    rankingResult?.alternateCandidates,
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Smart Route Optimization"
        description="Compute and compare multi-criteria emergency corridors using real Dijkstra/A*, OSRM/Valhalla road geometry, and traffic multipliers."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={recalculateLiveRoad}
              disabled={probingRoad}
              className="h-9 px-3.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D62828] dark:text-red-400 ${probingRoad ? 'animate-spin' : ''}`} />
              <span>Recalculate</span>
            </button>
            <Link
              to="/map"
              className="h-9 px-3.5 rounded-lg bg-[#D62828] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 no-underline"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Open Live Map</span>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Parameters Panel (4 cols) */}
        <div className="xl:col-span-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
            Route Inputs &amp; Constraints
          </h2>

          {/* Unit / Pickup Origin */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-900 dark:text-slate-100">
              Dispatch Unit / Pickup Origin
            </label>
            <select
              aria-label="Select ambulance unit origin"
              value={selectedUnitId}
              onChange={(e) => {
                const u = fleetUnits.find((item) => item.id === e.target.value);
                if (u) activateFleetUnitOnMap(u);
              }}
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-slate-100"
            >
              {fleetUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id} — {u.locationName}
                </option>
              ))}
            </select>

            {/* Quick Incident Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              {dispatchIncidents.slice(0, 3).map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => {
                    setEmergencyCategory(inc.type);
                    setAmbulanceCoordinates(inc.lat, inc.lon);
                  }}
                  className="px-2 py-1 rounded text-[11px] bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  {inc.id}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Specialty */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-900 dark:text-slate-100">Emergency Specialty</label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(EMERGENCY_CATEGORIES).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setEmergencyCategory(cat.id)}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium text-left cursor-pointer transition-colors ${
                    emergencyCategory === cat.id
                      ? 'bg-[#D62828] text-white border-[#D62828]'
                      : 'bg-slate-50/80 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 border-slate-200/90 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Hospital */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-900 dark:text-slate-100">Target Hospital</label>
            <select
              aria-label="Select destination hospital"
              value={selectedHospitalId || ''}
              onChange={(e) => setSelectedHospitalId(e.target.value || null)}
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="">Auto Select Optimal Hospital</option>
              {sortedHospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.city || 'NCR'})
                </option>
              ))}
            </select>
          </div>

          {/* Time of Day & Weather */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-100 mb-1">Traffic Window</label>
              <select
                aria-label="Time of day traffic window"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-slate-100"
              >
                {Object.values(TIME_OF_DAY_FACTORS).map((t) => (
                  <option key={t.id} value={t.id}>{t.label} (×{t.speedMultiplier})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-100 mb-1">Weather Override</label>
              <select
                aria-label="Weather condition"
                value={weather}
                disabled={useLiveWeather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-slate-100 disabled:opacity-60"
              >
                {Object.values(WEATHER_FACTORS).map((w) => (
                  <option key={w.id} value={w.id}>{w.label} (×{w.speedMultiplier})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Weather & Signal Toggles */}
          <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLiveWeather}
                  onChange={(e) => toggleLiveWeather(e.target.checked)}
                  className="rounded border-slate-200/90 dark:border-white/[0.08]"
                />
                <CloudSun className="w-3.5 h-3.5 text-[#D62828] dark:text-red-400" />
                <span>Live Open-Meteo Weather</span>
              </label>
              <button
                type="button"
                onClick={refreshLiveWeather}
                className="text-[#D62828] dark:text-red-400 hover:underline cursor-pointer"
                disabled={isFetchingWeather}
              >
                Refresh
              </button>
            </div>
            {liveWeather && (
              <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{liveWeather.label} ({liveWeather.temperatureC}°C)</span>
                <span className="inline-flex items-center gap-1">
                  <Wind className="w-3 h-3" /> {liveWeather.windSpeedKph} km/h
                </span>
              </div>
            )}
            <label className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08] font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={signalPriority}
                onChange={(e) => setSignalPriority(e.target.checked)}
                className="rounded border-slate-200/90 dark:border-white/[0.08]"
              />
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Signal Priority Delay Reduction</span>
            </label>
          </div>
        </div>

        {/* Right Route Options Comparison (8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {routeOptions.map((opt) => (
              <div
                key={opt.id}
                className={`bg-white/80 dark:bg-slate-900/80 border rounded-xl p-4 space-y-2 ${
                  opt.id === 'recommended' ? 'border-[#D62828] ring-1 ring-[#D62828]/40/40' : 'border-slate-200/80 dark:border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge tone={opt.tone} dot>
                    {opt.tag}
                  </StatusBadge>
                  {opt.hospitalId && (
                    <button
                      type="button"
                      onClick={() => setSelectedHospitalId(opt.hospitalId)}
                      className="text-xs font-medium text-[#D62828] dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Select Route
                    </button>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{opt.title}</div>
                <div className="flex items-baseline gap-4 font-mono">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {opt.etaSec > 0 ? formatDuration(opt.etaSec) : '--'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {opt.distanceM > 0 ? formatDistance(opt.distanceM) : '--'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <div>{opt.trafficNote}</div>
                  <div>{opt.roadDetail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteOptimization;
