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
  const { availableHospitals, saveCustomHospitals, resetCustomHospitals } = routing;
  const [version, setVersion] = useState(0);

  return (
    <div className="page-shell h-full flex flex-col">
      <PageHeader
        icon={Bed}
        title="Bed Capacity Registry"
        subtitle={`${availableHospitals.length} Regional Facilities · Simulated Telemetry`}
      />
      <HospitalBedManagerModal
        key={version}
        asPage
        isOpen
        hospitals={availableHospitals}
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
