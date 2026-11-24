/**
 * Result Card Component: Emergency Patient Transport & Triage Manifest.
 * Renders primary facility recommendation, ETA countdown window, bed capacity telemetry, and contingency alternates.
 */

import { Hospital, Clock, Check, AlertTriangle, ArrowRight, Bed, Navigation, ShieldCheck, Phone, PhoneCall } from 'lucide-react';
import { formatDistance } from '../../utils/geo.js';
import { formatDuration } from '../../utils/time.js';
import { WarningsList } from './WarningsList.jsx';
import { DataFreshness } from './DataFreshness.jsx';

export function ResultCard({
  hospital,
  alternateHospitals = [],
  selectedHospitalId,
  onSelectHospital,
  sourceNode,
  algorithm,
  isFigure2Mode,
  wibApiStatus,
  onRefreshWib,
  isSyncingWib,
  onOpenBedManager,
}) {
  if (!hospital) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-5 text-center space-y-3 transition-colors">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No Reachable Medical Facility</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          No hospital meeting the requested specialty constraint is reachable from the current coordinate.
          Verify road closures or adjust the emergency triage category.
        </p>
      </div>
    );
  }

  const isFigure2 = Boolean(isFigure2Mode);
  const etaText = isFigure2
    ? `${hospital.travelTimeSec || 9} min`
    : formatDuration(hospital.travelTimeSec);

  const icuCount = hospital.bedAvailability?.icuBedsFree ?? 0;
  const wardCount = hospital.bedAvailability?.emergencyWardFree ?? 0;
  const traumaCount = hospital.bedAvailability?.traumaBedsFree ?? 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs p-4 sm:p-5 space-y-4 transition-colors @container">
      {/* Manifest Header: Primary Recommendation */}
      <div className="flex flex-col @2xl:flex-row @2xl:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-lg bg-red-500/10 text-[#D62828] dark:text-red-400 shrink-0 mt-0.5 border border-red-500/20">
              <Hospital className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    hospital.isManualOverride
                      ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
                      : 'text-[#D62828] dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900'
                  }`}
                >
                  {hospital.isManualOverride ? 'Manual Destination Override' : 'Optimal Receiving Hospital'}
                </span>
                {selectedHospitalId && onSelectHospital && (
                  <button
                    type="button"
                    onClick={() => onSelectHospital(null)}
                    className="text-[10px] font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline cursor-pointer"
                  >
                    ↺ Reset to Best Match
                  </button>
                )}
                {hospital.nabhAccredited && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[#16A34A] dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    NABH ACCREDITED
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#1F3C6D] dark:text-slate-100 leading-tight mt-1 truncate">
                {hospital.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                {hospital.address || 'Greater Noida Road Network Node'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                {hospital.phone && (
                  <a
                    href={`tel:${hospital.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 no-underline max-w-full truncate"
                    title={`Call ${hospital.name} emergency desk to confirm seat/bed occupancy (${hospital.phone})`}
                  >
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Call: {hospital.phone}</span>
                  </a>
                )}
                <a
                  href="tel:108"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 no-underline"
                  title="24/7 Government Emergency Ambulance Dispatch (Toll-Free 108)"
                >
                  <Phone className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Ambulance: 108</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Capacity: {hospital.totalBeds || 150} beds · {hospital.institutionType || 'Multi-Specialty'}
            </span>
            {onOpenBedManager && (
              <button
                type="button"
                onClick={onOpenBedManager}
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer min-h-[28px]"
                title="Edit ICU, trauma, and emergency ward capacity"
              >
                <Bed className="w-3 h-3 text-[#D62828]" />
                <span>Edit Capacity</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary ETA Readout Window */}
        <div className="text-left @2xl:text-right @2xl:shrink-0 bg-slate-50 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-lg p-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 @2xl:justify-end">
            <Clock className="w-3 h-3 text-[#D62828]" />
            Predicted En-Route ETA
          </span>
          <div className="text-2xl @2xl:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono leading-none my-1 tracking-tight tabular-nums">
            {etaText}
          </div>
          <span className="inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            CALIBRATED DYNAMIC ETA
          </span>
        </div>
      </div>

      {/* Bed Availability Telemetry Matrix */}
      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3 flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs ${
              icuCount > 0 ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          >
            <Bed className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Facility Triage Capacity Status
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                  icuCount > 0
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                {hospital.bedAvailability?.status || 'AVAILABLE'}
              </span>
              {hospital.seatReadinessLabel && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                    hospital.seatReadinessLevel === 'OPTIMAL'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : hospital.seatReadinessLevel === 'CRITICAL'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  {hospital.seatReadinessLabel}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Live capacity telemetry · Confirm with receiving desk during transport
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center @2xl:shrink-0 @2xl:min-w-[15rem]">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-1.5 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">ICU Free</span>
            <span
              className={`text-sm font-bold font-mono tabular-nums ${
                icuCount > 0 ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#D62828] dark:text-red-400'
              }`}
            >
              {icuCount}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-1.5 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Ward Free</span>
            <span className="text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
              {wardCount}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-1.5 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Trauma Bay</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {traumaCount}
            </span>
          </div>
        </div>
      </div>

      {/* Route & Computational Telemetry Strip */}
      <div className="grid grid-cols-2 @2xl:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Corridor Length</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs tabular-nums">
            {isFigure2 ? 'N/A (Schematic)' : formatDistance(hospital.distanceM)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Snapped Origin</span>
          <span
            className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate block"
            title={sourceNode?.name}
          >
            {sourceNode?.name || 'Nearest node'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Graph Engine</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs uppercase">
            {algorithm === 'compare' ? 'A* / Dijkstra Dual' : `${algorithm} Router`}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Compute Latency</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs tabular-nums">
            {hospital.nodesExpanded} nodes · {hospital.queryTimeMs} ms
          </span>
        </div>
      </div>

      {/* Alternate Contingency Facilities */}
      {alternateHospitals.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Contingency Facilities ({alternateHospitals.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Select to override route</span>
          </div>
          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-2">
            {alternateHospitals.map((alt) => {
              const isSelected = selectedHospitalId === alt.id;
              const deltaSec = (alt.travelTimeSec || 0) - (hospital.travelTimeSec || 0);
              const deltaMinutes = Math.round(deltaSec / 60);
              return (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => onSelectHospital(alt.id)}
                  className={`text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between cursor-pointer min-h-[46px] active:scale-[0.98] ${
                    isSelected
                      ? 'border-[#D62828] dark:border-red-500 bg-red-50/70 dark:bg-red-950/40 ring-1 ring-[#D62828] dark:ring-red-500 font-semibold'
                      : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-[#1F3C6D] dark:text-slate-200 block truncate leading-tight">
                      {alt.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 block">
                      ETA: {formatDuration(alt.travelTimeSec)} · {formatDistance(alt.distanceM)}
                      {deltaMinutes > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 ml-1">
                          (+{deltaMinutes} min)
                        </span>
                      )}
                      {alt.phone && (
                        <span className="text-slate-400 ml-1.5 font-sans">
                          · {alt.phone}
                        </span>
                      )}
                    </span>
                  </div>
                  {isSelected ? (
                    <span className="p-1 rounded bg-[#D62828] text-white shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-semibold text-[#D62828] dark:text-red-400 shrink-0">
                      Route →
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings & Data Limitations */}
      <WarningsList warnings={hospital.warnings} />
      <DataFreshness
        hospital={hospital}
        wibApiStatus={wibApiStatus}
        onRefreshWib={onRefreshWib}
        isSyncingWib={isSyncingWib}
      />
    </div>
  );
}

export default ResultCard;
