/**
 * Beds Page (Mobile Tab).
 * Full-screen Bed Capacity Registry and Specialty Manager.
 */

import { useState } from 'react';
import { Bed } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import HospitalBedManagerModal from '../components/panels/HospitalBedManagerModal.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';

export function BedsPage() {
  const { routing } = useDispatch();
  const { availableHospitals, searchHospitals, saveCustomHospitals, resetCustomHospitals } = routing;
  const hospitalsToDisplay = searchHospitals && searchHospitals.length > 0 ? searchHospitals : availableHospitals;
  const [version, setVersion] = useState(0);

  return (
    <div className="h-full w-full flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <PageHeader
        icon={Bed}
        title="Bed Capacity Registry"
        subtitle={`${hospitalsToDisplay.length} Regional Facilities · Verified Clinical Telemetry`}
      />
      <HospitalBedManagerModal
        key={version}
        asPage
        isOpen
        hospitals={hospitalsToDisplay}
        onSaveHospitals={saveCustomHospitals}
        onResetToDefaults={() => {
          resetCustomHospitals();
          setVersion((v) => v + 1);
        }}
      />
    </div>
  );
}

export default BedsPage;
