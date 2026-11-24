/**
 * Hospitals Page (Mobile Tab).
 * Optimal Receiving Medical Facility, Alternate Contingencies, Bed Capacity, and Comparative Telemetry.
 */

import { Hospital } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import DisclaimerBanner from '../components/layout/DisclaimerBanner.jsx';
import ResultCard from '../components/panels/ResultCard.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { useBedManager } from '../context/BedManagerContext.jsx';
import { EMERGENCY_CATEGORIES } from '../config/emergencyCategories.js';

export function HospitalsPage() {
  const { routing } = useDispatch();
  const { openBedManager } = useBedManager();
  const {
    activeHospital,
    rankingResult,
    selectedHospitalId,
    setSelectedHospitalId,
    snappedSourceNode,
    algorithm,
    wibApiStatus,
    refreshWibData,
    isSyncingWib,
    comparisonData,
    emergencyCategory,
  } = routing;

  const category = EMERGENCY_CATEGORIES[emergencyCategory];

  return (
    <div className="page-shell">
      <PageHeader
        icon={Hospital}
        title="Receiving Facilities"
        subtitle={category ? `Triage Filter: ${category.label}` : 'All Specializations'}
      />
      <div className="px-3.5 pt-3.5 pb-8 space-y-4">
        <DisclaimerBanner />
        <ResultCard
          hospital={activeHospital}
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
      </div>
    </div>
  );
}

export default HospitalsPage;
