/**
 * 21st.dev style Dashboard Page: Central CAD Emergency Dispatch & Routing Console.
 * Dual-column command interface with top KPI telemetry metrics:
 *   - Top: 4 Mission-Critical KPI Metric Cards (Target, ETA, ICU Beds, Cockpit Telemetry).
 *   - Left: Controls, Manifest Result Card, Dual-Engine Comparison Table, Telemetry Feeds, Incident Injection.
 *   - Right: Real-time GPS/Vehicle Cockpit, Tactical Situational Awareness Map, Network Metadata Manifest.
 */

import DisclaimerBanner from '../components/layout/DisclaimerBanner.jsx';
import ControlPanel from '../components/panels/ControlPanel.jsx';
import ResultCard from '../components/panels/ResultCard.jsx';
import { Link } from 'react-router-dom';
import MapView from '../components/map/DesktopMapView.jsx';
import IncidentTool from '../components/map/IncidentTool.jsx';
import LiveLocationTracker from '../components/map/LiveLocationTracker.jsx';
import HospitalBedManagerModal from '../components/panels/HospitalBedManagerModal.jsx';
import ApiStatusPanel from '../components/panels/ApiStatusPanel.jsx';
import KpiStatCard from '../components/ui/KpiStatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import TrafficSpeedFrictionGraph from '../components/charts/TrafficSpeedFrictionGraph.jsx';
import RegionalBedCapacityGraph from '../components/charts/RegionalBedCapacityGraph.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { useBedManager } from '../context/BedManagerContext.jsx';
import { formatDistance } from '../utils/geo.js';
import { formatEtaShort } from '../utils/time.js';
import {
  CheckCircle2,
  Bed,
  Radio,
  Database,
  CloudSun,
  MapPin,
  Hospital,
  Clock,
  Gauge,
  PhoneCall,
  Navigation2,
  Zap,
  Cpu,
} from 'lucide-react';

export function Dashboard() {
  const {
    graph,
    routing,
    live,
    apiHealth,
    canDragAmbulance,
    setCanDragAmbulance,
    roadTelemetry,
    setRoadTelemetry,
  } = useDispatch();
  const {
    weightedGraph, graphMode, setGraphMode, timeOfDay, setTimeOfDay, weather, setWeather,
    useLiveWeather, toggleLiveWeather, liveWeather, isFetchingWeather, refreshLiveWeather,
    signalPriority, setSignalPriority, trafficConfig, fetchFreshOverpassGrid,
    isDownloadingOverpass, overpassDownloadError, incidents, addIncident, removeIncident, clearIncidents,
    reporter, setReporter,
  } = graph;
  const {
    ambulancePos, setAmbulanceCoordinates, snappedSourceNode, emergencyCategory, setEmergencyCategory,
    algorithm, selectedHospitalId, setSelectedHospitalId, rankingResult, activeHospital,
    comparisonData, availableHospitals, topHospitals,
    effectiveRadiusKm, isRadiusFallback, wibApiStatus, refreshWibData, isSyncingWib,
    saveCustomHospitals, resetCustomHospitals,
  } = routing;
  const {
    isGpsActive, isMoving, followVehicle, setFollowVehicle, gpsAccuracy, gpsSpeedKph,
    gpsHeading, gpsError, totalDistanceMovedM, startGps, stopGps,
  } = live;
  const { isBedManagerOpen, openBedManager, closeBedManager } = useBedManager();

  // Primary active hospital metrics
  const activeDistance = roadTelemetry?.distanceM || activeHospital?.distanceM || 0;
  const activeTravelTime = roadTelemetry?.durationSec || activeHospital?.travelTimeSec || 0;
  const activeEta = activeTravelTime > 0 ? formatEtaShort(activeTravelTime) : '2m';
  const icuBedsCount = activeHospital?.bedAvailability?.icuBedsFree ?? 4;
  const traumaBedsCount = activeHospital?.bedAvailability?.traumaBedsFree ?? 2;

  return (
    <div className="page-shell space-y-5">
      {/* 21st.dev style Top Tactical Advisory Banner */}
      <DisclaimerBanner />

      {/* ──────────────── 21st.dev KPI METRIC STAT CARDS ROW ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Target Receiving Facility */}
        <KpiStatCard
          title="Optimal Facility"
          value={activeHospital?.shortName || activeHospital?.name || 'Searching...'}
          subtitle={
            activeHospital?.roadDistanceKm
              ? `${activeHospital.roadDistanceKm} km road · Corridor`
              : activeDistance > 0
              ? `${formatDistance(activeDistance)} · Corridor`
              : 'Pan-India Grid'
          }
          icon={Hospital}
          tint="red"
          trend={activeHospital?.nabhAccredited ? 'NABH' : 'LEVEL-1'}
          trendPositive={true}
          action={
            activeHospital?.phone ? (
              <a
                href={`tel:${activeHospital.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call Desk</span>
              </a>
            ) : null
          }
        />

        {/* KPI 2: Dynamic ETA Window */}
        <KpiStatCard
          title="Projected ETA"
          value={activeHospital?.durationMin ? `${activeHospital.durationMin} min` : activeEta}
          subtitle={signalPriority ? 'Signal Preempted' : 'Friction Calibrated'}
          icon={Clock}
          tint="emerald"
          trend={algorithm === 'compare' ? 'DUAL OPTIMAL' : `${algorithm.toUpperCase()} OPTIMAL`}
          trendPositive={true}
        />

        {/* KPI 3: Live Clinical Bed Intake */}
        <KpiStatCard
          title="Intake Capacity"
          value={`${icuBedsCount} ICU Beds`}
          subtitle={`${traumaBedsCount} Trauma · ${activeHospital?.bedAvailability?.emergencyWardFree ?? 18} Ward`}
          icon={Bed}
          tint="blue"
          trend={icuBedsCount > 2 ? 'SURPLUS' : 'LIMITED'}
          trendPositive={icuBedsCount > 2}
          action={
            <button
              type="button"
              onClick={openBedManager}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
            >
              Edit Registry
            </button>
          }
        />

        {/* KPI 4: Vehicle Cockpit & Road Topology */}
        <KpiStatCard
          title="Vehicle Velocity"
          value={`${Math.round(gpsSpeedKph || 42)} km/h`}
          subtitle={`${weightedGraph.nodes.length} Nodes · ${weightedGraph.edges.length} Edges`}
          icon={Gauge}
          tint="amber"
          trend={isGpsActive ? 'DEVICE GPS' : 'SIMULATED'}
          trendPositive={isGpsActive}
        />
      </div>

      {/* ──────────────── MAIN DUAL-COLUMN CAD WORKSPACE ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 min-w-0 space-y-5 order-2 lg:order-1">
          <ControlPanel
            emergencyCategory={emergencyCategory}
            onSelectCategory={setEmergencyCategory}
            timeOfDay={timeOfDay}
            onChangeTimeOfDay={setTimeOfDay}
            weather={weather}
            onChangeWeather={setWeather}
            signalPriority={signalPriority}
            onToggleSignalPriority={setSignalPriority}
            graphMode={graphMode}
            onChangeGraphMode={setGraphMode}
            onDownloadOverpass={fetchFreshOverpassGrid}
            isDownloadingOverpass={isDownloadingOverpass}
            overpassError={overpassDownloadError}
            useLiveWeather={useLiveWeather}
            onToggleLiveWeather={toggleLiveWeather}
            liveWeather={liveWeather}
            onRefreshWeather={refreshLiveWeather}
            isFetchingWeather={isFetchingWeather}
            trafficConfig={trafficConfig}
          />

          <ResultCard
            hospital={
              roadTelemetry?.distanceM &&
              activeHospital &&
              (!roadTelemetry.hospitalId || roadTelemetry.hospitalId === activeHospital.id)
                ? {
                    ...activeHospital,
                    distanceM: roadTelemetry.distanceM,
                    travelTimeSec: roadTelemetry.durationSec || activeHospital.travelTimeSec,
                  }
                : activeHospital
            }
            alternateHospitals={rankingResult.alternateCandidates}
            searchHospitals={routing.searchHospitals}
            selectedHospitalId={selectedHospitalId}
            onSelectHospital={setSelectedHospitalId}
            sourceNode={snappedSourceNode}
            algorithm={algorithm}
            isFigure2Mode={false}
            wibApiStatus={wibApiStatus}
            onRefreshWib={refreshWibData}
            isSyncingWib={isSyncingWib}
            onOpenBedManager={openBedManager}
          />

          {algorithm === 'compare' && (
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/20">
                  <Cpu className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block font-mono truncate">
                    Dual-Engine Compare Router Active
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans truncate">
                    Dijkstra vs A* audit table moved to Benchmark page
                  </span>
                </div>
              </div>
              <Link
                to="/benchmark"
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-mono text-[11px] font-bold shadow-xs transition-all cursor-pointer shrink-0"
              >
                View Benchmark →
              </Link>
            </div>
          )}

          <IncidentTool
            edges={weightedGraph.edges}
            nodes={weightedGraph.nodes}
            incidents={incidents}
            ambulancePos={ambulancePos}
            reporter={reporter}
            onChangeReporter={setReporter}
            onAddIncident={addIncident}
            onRemoveIncident={removeIncident}
            onClearIncidents={clearIncidents}
          />
        </div>

        {/* Right Column (7 Cols) */}
        <div className="lg:col-span-7 min-w-0 space-y-5 order-1 lg:order-2">
          {/* Live Vehicle Telemetry & GPS Controller */}
          <LiveLocationTracker
            isGpsActive={isGpsActive}
            gpsAccuracy={gpsAccuracy}
            gpsSpeedKph={gpsSpeedKph}
            gpsHeading={gpsHeading}
            gpsError={gpsError}
            totalDistanceMovedM={totalDistanceMovedM}
            followVehicle={followVehicle}
            onToggleFollow={setFollowVehicle}
            onStartGps={startGps}
            onStopGps={stopGps}
            currentPos={ambulancePos}
            snappedNode={snappedSourceNode}
            canDragPin={canDragAmbulance}
            onTogglePinLock={setCanDragAmbulance}
          />

          {/* Tactical Situational Awareness Leaflet Display framed in 21st.dev glass card */}
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] p-1.5 shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
            <MapView
              nodes={weightedGraph.nodes}
              edges={weightedGraph.edges}
              ambulancePos={ambulancePos}
              onAmbulanceMove={setAmbulanceCoordinates}
              snappedSourceNode={snappedSourceNode}
              hospitals={topHospitals && topHospitals.length > 0 ? topHospitals : availableHospitals.slice(0, 5)}
              searchHospitals={routing.searchHospitals}
              activeHospitalId={activeHospital?.id}
              activeHospital={activeHospital}
              onSelectHospital={setSelectedHospitalId}
              activePathNodeIds={activeHospital?.pathNodeIds || []}
              incidents={incidents}
              onAddIncident={addIncident}
              onRemoveIncident={removeIncident}
              isFigure2Mode={false}
              isMoving={isMoving}
              isRealGps={isGpsActive}
              gpsAccuracy={gpsAccuracy}
              gpsSpeedKph={gpsSpeedKph || 0}
              followVehicle={followVehicle}
              canDragPin={canDragAmbulance}
              onTogglePinLock={setCanDragAmbulance}
              onRoadResolved={setRoadTelemetry}
              algorithm={algorithm}
              effectiveRadiusKm={effectiveRadiusKm}
              isRadiusFallback={isRadiusFallback}
            />
          </div>

          {/* Network Topology & Operational Manifest Card */}
          <div className="@container rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-5 shadow-xs text-xs font-mono space-y-3.5 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-500/10 text-[#D62828] dark:text-red-400 flex items-center justify-center">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <span>Road Network Topology & Telemetry State</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Study Area: Pan-India & Delhi-NCR (ODbL 1.0)
              </span>
            </div>

            <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-x-6 gap-y-3.5 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1 text-[11px]">
                  Graph Engine Architecture:
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Real OSM Directed Graph (Pan-India & Delhi-NCR)
                </span>
              </div>

              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1 text-[11px]">
                  Atmospheric Conditions Feed:
                </span>
                {liveWeather ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25">
                    <CloudSun className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    Open-Meteo NCR: {liveWeather.label} ({liveWeather.temperatureC}°C, {liveWeather.humidityPercent}% RH)
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">Manual scenario overrides</span>
                )}
              </div>

              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1 text-[11px]">
                  Speed & Friction Modeling:
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  v(e) Traffic Multiplier + Signal Delays
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1 text-[11px]">
                    Hospital Facilities Registry:
                  </span>
                  <button
                    type="button"
                    onClick={openBedManager}
                    className="text-[11px] text-[#D62828] dark:text-red-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Bed className="w-3 h-3" />
                    <span>Edit Capacity</span>
                  </button>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {availableHospitals.length} Apex Facilities (Pan-India & Delhi-NCR)
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
              * Operational Guidance: Origin coordinates are locked to prevent inadvertent relocation during vehicle tracking. Toggle &quot;Lock Pin&quot; above to reposition manually across street nodes.
            </p>
          </div>

          {/* External Telemetry Feeds & Health Monitoring */}
          <ApiStatusPanel health={apiHealth} />
        </div>
      </div>

      {/* ──────────────── 21st.dev VISUAL TELEMETRY & REGIONAL CAPACITY ANALYTICS ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        <RegionalBedCapacityGraph hospitals={availableHospitals} />
        <TrafficSpeedFrictionGraph
          activeTimeOfDay={timeOfDay}
          activeWeather={weather}
        />
      </div>

      {/* Hospital Bed Estimate Manager Modal */}
      <HospitalBedManagerModal
        isOpen={isBedManagerOpen}
        onClose={closeBedManager}
        hospitals={availableHospitals}
        onSaveHospitals={saveCustomHospitals}
        onResetToDefaults={resetCustomHospitals}
      />
    </div>
  );
}

export default Dashboard;
