/**
 * Dashboard Page: Central CAD Emergency Dispatch & Routing Console.
 * Dual-column command interface:
 *   - Left: Controls, Manifest Result Card, Dual-Engine Comparison Table, Telemetry Feeds, Incident Injection.
 *   - Right: Real-time GPS/Vehicle Cockpit, Tactical Situational Awareness Map, Network Metadata Manifest.
 */

import DisclaimerBanner from '../components/layout/DisclaimerBanner.jsx';
import ControlPanel from '../components/panels/ControlPanel.jsx';
import ResultCard from '../components/panels/ResultCard.jsx';
import CompareTable from '../components/panels/CompareTable.jsx';
import MapView from '../components/map/DesktopMapView.jsx';
import IncidentTool from '../components/map/IncidentTool.jsx';
import LiveLocationTracker from '../components/map/LiveLocationTracker.jsx';
import HospitalBedManagerModal from '../components/panels/HospitalBedManagerModal.jsx';
import ApiStatusPanel from '../components/panels/ApiStatusPanel.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { useBedManager } from '../context/BedManagerContext.jsx';
import { CheckCircle2, Bed, Radio, Database, CloudSun, MapPin } from 'lucide-react';

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
    comparisonData, availableHospitals, wibApiStatus, refreshWibData, isSyncingWib,
    saveCustomHospitals, resetCustomHospitals,
  } = routing;
  const {
    isGpsActive, isMoving, followVehicle, setFollowVehicle, gpsAccuracy, gpsSpeedKph,
    gpsHeading, gpsError, totalDistanceMovedM, startGps, stopGps,
  } = live;
  const { isBedManagerOpen, openBedManager, closeBedManager } = useBedManager();

  return (
    <div className="page-shell space-y-4">
      {/* Tactical Advisory Banner */}
      <DisclaimerBanner />

      {/* Main Grid: Left Controls & Results, Right Telemetry Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 min-w-0 space-y-4 order-2 lg:order-1">
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
            <CompareTable comparisonData={comparisonData} />
          )}

          <ApiStatusPanel health={apiHealth} />

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
        <div className="lg:col-span-7 min-w-0 space-y-4 order-1 lg:order-2">
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

          {/* Tactical Situational Awareness Leaflet Display */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-1 sm:p-1.5 shadow-xs">
            <MapView
              nodes={weightedGraph.nodes}
              edges={weightedGraph.edges}
              ambulancePos={ambulancePos}
              onAmbulanceMove={setAmbulanceCoordinates}
              snappedSourceNode={snappedSourceNode}
              hospitals={availableHospitals}
              activeHospitalId={activeHospital?.id}
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
            />
          </div>

          {/* Network Topology & Operational Manifest Card */}
          <div className="@container bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs text-xs font-mono space-y-3.5 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#D62828]" />
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
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Real OSM Directed Graph (Pan-India & Delhi-NCR)
                </span>
              </div>

              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1 text-[11px]">
                  Atmospheric Conditions Feed:
                </span>
                {liveWeather ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
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
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
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
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {availableHospitals.length} Apex Facilities (Pan-India & Delhi-NCR)
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
              * Operational Guidance: Origin coordinates are locked to prevent inadvertent relocation during vehicle tracking. Toggle &quot;Lock Pin&quot; above to reposition manually across street nodes.
            </p>
          </div>
        </div>
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
