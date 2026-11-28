import { motion } from 'motion/react';
import {
  AlertTriangle,
  Bed,
  Clock,
  Lock,
  Phone,
  PhoneCall,
  Unlock,
} from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { HospitalBrandLogo } from '../ui/BrandLogos.jsx';
import { formatDistance } from '../../utils/geo.js';
import { formatDuration } from '../../utils/time.js';
import { WarningsList } from './WarningsList.jsx';
import { DataFreshness } from './DataFreshness.jsx';
import ContingencyFacilitiesSection from './ContingencyFacilitiesSection.jsx';

export function ResultCard({
  hospital,
  alternateHospitals = [],
  searchHospitals = [],
  selectedHospitalId,
  onSelectHospital,
  isHospitalLocked = false,
  onToggleHospitalLock,
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
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] p-6 text-center space-y-3 transition-colors shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-sans">
          No Reachable Medical Facility
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-sans">
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
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-4 sm:p-5 space-y-4 transition-colors @container">
      <div className="flex flex-col @2xl:flex-row @2xl:items-start justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5 border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
              <HospitalBrandLogo hospitalName={hospital.name} className="w-8 h-8 rounded-lg" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isHospitalLocked ? 'warning' : hospital.isManualOverride ? 'warning' : 'destructive'}>
                  {isHospitalLocked
                    ? 'Locked Hospital Choice'
                    : hospital.isManualOverride
                    ? 'Manual Destination Override'
                    : 'Closest Optimal (Default)'}
                </Badge>
                {onToggleHospitalLock && (
                  <button
                    type="button"
                    onClick={onToggleHospitalLock}
                    aria-pressed={isHospitalLocked}
                    title={
                      isHospitalLocked
                        ? 'Hospital choice is locked. Click to unlock and revert to closest default.'
                        : 'Lock this hospital so moving the ambulance or changing triage keeps your choice.'
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                      isHospitalLocked
                        ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-500/60 hover:bg-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isHospitalLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{isHospitalLocked ? 'Locked (Click for Closest)' : 'Lock Choice'}</span>
                  </button>
                )}
                {selectedHospitalId && !isHospitalLocked && onSelectHospital && (
                  <button
                    type="button"
                    onClick={() => onSelectHospital(null)}
                    className="text-[10px] font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline cursor-pointer"
                  >
                    ↺ Use Closest Default
                  </button>
                )}
                {hospital.nabhAccredited && (
                  <Badge variant="success">NABH ACCREDITED</Badge>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight mt-1 truncate font-sans">
                {hospital.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                {hospital.address || 'Greater Noida Road Network Node'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                {hospital.phone && (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    href={`tel:${hospital.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-all shadow-sm cursor-pointer no-underline max-w-full truncate"
                    title={`Call ${hospital.name} emergency desk to confirm seat/bed occupancy (${hospital.phone})`}
                  >
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Call: {hospital.phone}</span>
                  </motion.a>
                )}
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  href="tel:108"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold transition-all border border-slate-200 dark:border-white/[0.08] cursor-pointer no-underline"
                  title="24/7 Government Emergency Ambulance Dispatch (Toll-Free 108)"
                >
                  <Phone className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Ambulance: 108</span>
                </motion.a>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.06]">
              Capacity: {hospital.totalBeds || 150} beds · {hospital.institutionType || 'Multi-Specialty'}
            </span>
            {onOpenBedManager && (
              <button
                type="button"
                onClick={onOpenBedManager}
                className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer min-h-[28px]"
                title="Edit ICU, trauma, and emergency ward capacity"
              >
                <Bed className="w-3 h-3 text-[#D62828]" />
                <span>Edit Capacity</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-left @2xl:text-right @2xl:shrink-0 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 @2xl:justify-end">
            <Clock className="w-3 h-3 text-[#D62828]" />
            Predicted En-Route ETA
          </span>
          <div className="text-2xl @2xl:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono leading-none my-1 tracking-tight tabular-nums">
            {etaText}
          </div>
          <Badge variant="success" size="sm">CALIBRATED DYNAMIC ETA</Badge>
        </div>
      </div>

      <div className="bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-3.5 flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
              icuCount > 0 ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          >
            <Bed className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 font-sans">
                Facility Triage Capacity Status
              </span>
              <Badge variant={icuCount > 0 ? 'success' : 'warning'} size="sm">
                {hospital.bedAvailability?.status || 'AVAILABLE'}
              </Badge>
              {hospital.seatReadinessLabel && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
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
          {[
            { label: 'ICU Free', value: icuCount, cls: icuCount > 0 ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#D62828] dark:text-red-400' },
            { label: 'Ward Free', value: wardCount, cls: 'text-slate-800 dark:text-slate-200' },
            { label: 'Trauma Bay', value: traumaCount, cls: 'text-amber-600 dark:text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-2 shadow-2xs">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">{stat.label}</span>
              <span className={`text-sm font-bold font-mono tabular-nums ${stat.cls}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 @2xl:grid-cols-4 gap-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-3.5 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Corridor Length</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs tabular-nums">
            {isFigure2 ? 'N/A (Schematic)' : hospital.roadDistanceKm ? `${hospital.roadDistanceKm} km road` : formatDistance(hospital.distanceM)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Snapped Origin</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate block" title={sourceNode?.name}>
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

      <ContingencyFacilitiesSection
        hospital={hospital}
        alternateHospitals={alternateHospitals}
        searchHospitals={searchHospitals}
        selectedHospitalId={selectedHospitalId}
        onSelectHospital={onSelectHospital}
        sourceNode={sourceNode}
      />

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
