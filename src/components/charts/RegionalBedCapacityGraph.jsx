/**
 * 21st.dev style Regional Bed & ICU Capacity Telemetry Graph.
 * Visualizes live clinical intake, trauma bay availability, and ICU readiness across 6 Indian macro-zones.
 */

import { useState, useMemo } from 'react';
import { Bed, ShieldCheck, Activity, BarChart2, CheckCircle2 } from 'lucide-react';
import { PAN_INDIA_HOSPITALS } from '../../data/panIndiaHospitals.js';

export function RegionalBedCapacityGraph({ hospitals = PAN_INDIA_HOSPITALS, className = '' }) {
  const [activeZone, setActiveZone] = useState('ALL');

  // Compute aggregated capacity metrics by geographic zone
  const regionalMetrics = useMemo(() => {
    const zones = {
      NORTH: { name: 'North India', count: 0, icuFree: 0, traumaFree: 0, wardFree: 0, totalCapacity: 0 },
      WEST: { name: 'West India', count: 0, icuFree: 0, traumaFree: 0, wardFree: 0, totalCapacity: 0 },
      SOUTH: { name: 'South India', count: 0, icuFree: 0, traumaFree: 0, wardFree: 0, totalCapacity: 0 },
      EAST: { name: 'East India', count: 0, icuFree: 0, traumaFree: 0, wardFree: 0, totalCapacity: 0 },
      CENTRAL: { name: 'Central India', count: 0, icuFree: 0, traumaFree: 0, wardFree: 0, totalCapacity: 0 },
      NORTHEAST: { name: 'North-East', count: 0, icuFree: 0, traumaFree: 0, wardFree: 0, totalCapacity: 0 },
    };

    hospitals.forEach((h) => {
      const addr = (h.address || '').toLowerCase();
      const name = (h.name || '').toLowerCase();
      let zone = 'NORTH'; // default fallback for NCR

      if (addr.includes('maharashtra') || addr.includes('mumbai') || addr.includes('pune') || addr.includes('nagpur') || addr.includes('gujarat') || addr.includes('ahmedabad') || addr.includes('surat') || addr.includes('goa')) {
        zone = 'WEST';
      } else if (addr.includes('karnataka') || addr.includes('bengaluru') || addr.includes('tamil nadu') || addr.includes('chennai') || addr.includes('telangana') || addr.includes('hyderabad') || addr.includes('andhra') || addr.includes('kerala') || addr.includes('kochi') || addr.includes('puducherry')) {
        zone = 'SOUTH';
      } else if (addr.includes('west bengal') || addr.includes('kolkata') || addr.includes('bihar') || addr.includes('patna') || addr.includes('jharkhand') || addr.includes('ranchi') || addr.includes('odisha') || addr.includes('bhubaneswar')) {
        zone = 'EAST';
      } else if (addr.includes('madhya pradesh') || addr.includes('bhopal') || addr.includes('indore') || addr.includes('chhattisgarh') || addr.includes('raipur')) {
        zone = 'CENTRAL';
      } else if (addr.includes('assam') || addr.includes('guwahati') || addr.includes('meghalaya') || addr.includes('shillong') || addr.includes('tripura') || addr.includes('manipur')) {
        zone = 'NORTHEAST';
      }

      const z = zones[zone];
      z.count += 1;
      z.icuFree += h.bedAvailability?.icuBedsFree || 0;
      z.traumaFree += h.bedAvailability?.traumaBedsFree || 0;
      z.wardFree += h.bedAvailability?.emergencyWardFree || 0;
      z.totalCapacity += h.bedAvailability?.totalCapacity || 300;
    });

    return zones;
  }, [hospitals]);

  const maxZoneIcu = Math.max(...Object.values(regionalMetrics).map((z) => z.icuFree), 1);

  return (
    <div className={`rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-5 shadow-xs font-mono space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Bed className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Pan-India Regional Clinical Intake Matrix ({hospitals.length} Hospitals)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              ICU beds, trauma resuscitation bays, and emergency ward telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-2xs text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-xs bg-emerald-500"></span>
            Free ICU
          </span>
          <span className="flex items-center gap-1.5 text-2xs text-amber-600 dark:text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-xs bg-amber-500"></span>
            Trauma Bays
          </span>
          <span className="flex items-center gap-1.5 text-2xs text-blue-600 dark:text-blue-400 font-bold">
            <span className="w-2 h-2 rounded-xs bg-blue-500"></span>
            Ward Free
          </span>
        </div>
      </div>

      {/* Regional Zone Bars */}
      <div className="space-y-3.5">
        {Object.entries(regionalMetrics).map(([key, zone]) => {
          const isSelected = activeZone === key || activeZone === 'ALL';
          const icuPercent = Math.round((zone.icuFree / maxZoneIcu) * 100);

          return (
            <div
              key={key}
              onClick={() => setActiveZone((prev) => (prev === key ? 'ALL' : key))}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/90 dark:border-white/[0.08]'
                  : 'bg-transparent border-transparent opacity-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>{zone.name}</span>
                  <span className="text-[10px] font-normal text-slate-400">({zone.count} apex centers)</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {zone.icuFree} ICU · {zone.traumaFree} Trauma · {zone.wardFree} Ward
                </span>
              </div>

              {/* Stacked Progress Bars */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex gap-0.5">
                <div
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-300"
                  style={{ width: `${Math.max(4, icuPercent * 0.45)}%` }}
                  title={`${zone.icuFree} ICU Beds Free`}
                ></div>
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(3, icuPercent * 0.25)}%` }}
                  title={`${zone.traumaFree} Trauma Bays Free`}
                ></div>
                <div
                  className="bg-blue-500 h-full rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.max(5, icuPercent * 0.30)}%` }}
                  title={`${zone.wardFree} Emergency Ward Beds Free`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary Strip */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-2xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Total Monitored Bed Capacity: <strong className="text-slate-800 dark:text-slate-200">
            {Object.values(regionalMetrics).reduce((s, z) => s + z.totalCapacity, 0).toLocaleString()} Beds
          </strong></span>
        </span>
        <span>
          Total Ready ICU Beds: <strong className="text-emerald-600 dark:text-emerald-400">
            {Object.values(regionalMetrics).reduce((s, z) => s + z.icuFree, 0)} Active Free
          </strong>
        </span>
      </div>
    </div>
  );
}

export default RegionalBedCapacityGraph;
