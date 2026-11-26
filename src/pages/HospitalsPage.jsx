/**
 * Hospitals Page (Mobile Tab).
 * Optimal Receiving Medical Facility, Alternate Contingencies, Bed Capacity, and Comparative Telemetry.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, MapPin, PhoneCall } from 'lucide-react';
import MobilePageHeader from '../components/layout/MobilePageHeader.jsx';
import DisclaimerBanner from '../components/layout/DisclaimerBanner.jsx';
import ResultCard from '../components/panels/ResultCard.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { useBedManager } from '../context/BedManagerContext.jsx';
import { EMERGENCY_CATEGORIES } from '../config/emergencyCategories.js';
import { groupHospitalsByState } from '../utils/hospitalState.js';

export function HospitalsPage() {
  const navigate = useNavigate();
  const { routing } = useDispatch();
  const { openBedManager } = useBedManager();
  const {
    availableHospitals = [],
    activeHospital,
    rankingResult,
    selectedHospitalId,
    setSelectedHospitalId,
    isHospitalLocked,
    toggleHospitalLock,
    snappedSourceNode,
    algorithm,
    wibApiStatus,
    refreshWibData,
    isSyncingWib,
    emergencyCategory,
  } = routing;

  const stateGroups = useMemo(
    () => groupHospitalsByState(availableHospitals),
    [availableHospitals]
  );
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');

  const activeGroup =
    stateGroups.find((g) => g.state === selectedState) || stateGroups[0] || null;

  const category = EMERGENCY_CATEGORIES[emergencyCategory];

  return (
    <div className="page-shell">
      <MobilePageHeader
        icon={Hospital}
        title="Receiving Facilities"
        subtitle={category ? `Triage Filter: ${category.label}` : 'All Specializations'}
        backTo="/"
      />
      <div className="px-3.5 pt-3.5 pb-8 space-y-4">
        <DisclaimerBanner />
        <ResultCard
          hospital={activeHospital}
          alternateHospitals={rankingResult.alternateCandidates}
          searchHospitals={routing.searchHospitals}
          selectedHospitalId={selectedHospitalId}
          onSelectHospital={setSelectedHospitalId}
          isHospitalLocked={isHospitalLocked}
          onToggleHospitalLock={toggleHospitalLock}
          sourceNode={snappedSourceNode}
          algorithm={algorithm}
          isFigure2Mode={false}
          wibApiStatus={wibApiStatus}
          onRefreshWib={refreshWibData}
          isSyncingWib={isSyncingWib}
          onOpenBedManager={openBedManager}
        />

        {/* State-Wise Pan-India Hospital Selector */}
        {stateGroups.length > 0 && activeGroup && (
          <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/[0.08] p-3.5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  State-Wise India Directory ({availableHospitals.length})
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  All {stateGroups.length} Indian States &amp; Union Territories
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {activeGroup.icuFreeTotal} ICU Free
              </span>
            </div>

            <select
              aria-label="Select Indian State or Union Territory"
              value={activeGroup.state}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-xs font-semibold bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 focus:border-[#D62828] focus:outline-hidden"
            >
              {stateGroups.map((grp) => (
                <option key={grp.state} value={grp.state}>
                  {grp.state} ({grp.totalCount} hospitals · {grp.icuFreeTotal} ICU)
                </option>
              ))}
            </select>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-0.5">
              {activeGroup.hospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {hosp.shortName || hosp.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {hosp.city || hosp.address} · {hosp.bedAvailability?.icuBedsFree ?? 0} ICU
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hosp.phone && (
                      <a
                        href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
                        className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-emerald-400"
                        aria-label={`Call ${hosp.name}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHospitalId(hosp.id);
                        navigate('/');
                      }}
                      className="h-7 px-2.5 rounded-lg bg-[#D62828] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Route</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default HospitalsPage;
