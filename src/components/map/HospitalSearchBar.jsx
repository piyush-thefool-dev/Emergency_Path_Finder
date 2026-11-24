/**
 * Hospital Search and Destination Selection Bar.
 * Allows instant search and selection across all Pan-India apex hospitals and Delhi-NCR facilities.
 * Supports filtering by hospital name, city, state, address, and clinical specialties.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Hospital, MapPin, Bed, Navigation, ChevronRight, Check } from 'lucide-react';
import { haversineDistance, formatDistance } from '../../utils/geo.js';

const REGION_DEFINITIONS = [
  { id: 'all', label: 'All India' },
  { id: 'ncr', label: 'Delhi-NCR' },
  { id: 'north', label: 'North' },
  { id: 'west', label: 'West' },
  { id: 'south', label: 'South' },
  { id: 'east', label: 'East & NE' },
  { id: 'central', label: 'Central' },
];

function getHospitalRegion(hosp) {
  const addr = (hosp.address || '').toLowerCase();
  const name = (hosp.name || '').toLowerCase();
  const id = hosp.id || '';

  if (
    addr.includes('noida') ||
    addr.includes('delhi') ||
    addr.includes('gurugram') ||
    addr.includes('faridabad') ||
    addr.includes('ghaziabad') ||
    id.startsWith('hosp_delhi') ||
    id.startsWith('hosp_noida') ||
    id.startsWith('hosp_sharda') ||
    id.startsWith('hosp_kailash') ||
    id.startsWith('hosp_yatharth') ||
    id.startsWith('hosp_jaypee') ||
    id.startsWith('hosp_gims') ||
    id.startsWith('hosp_bakson') ||
    id.startsWith('hosp_felix') ||
    id.startsWith('hosp_fortis_noida')
  ) {
    return 'ncr';
  }
  if (
    addr.includes('punjab') ||
    addr.includes('chandigarh') ||
    addr.includes('jammu') ||
    addr.includes('kashmir') ||
    addr.includes('uttarakhand') ||
    addr.includes('dehradun') ||
    addr.includes('rishikesh') ||
    addr.includes('lucknow') ||
    addr.includes('varanasi') ||
    addr.includes('jaipur') ||
    addr.includes('jodhpur') ||
    addr.includes('ludhiana') ||
    addr.includes('amritsar')
  ) {
    return 'north';
  }
  if (
    addr.includes('mumbai') ||
    addr.includes('pune') ||
    addr.includes('nagpur') ||
    addr.includes('maharashtra') ||
    addr.includes('gujarat') ||
    addr.includes('ahmedabad') ||
    addr.includes('surat') ||
    addr.includes('vadodara') ||
    addr.includes('goa')
  ) {
    return 'west';
  }
  if (
    addr.includes('bengaluru') ||
    addr.includes('bangalore') ||
    addr.includes('karnataka') ||
    addr.includes('chennai') ||
    addr.includes('tamil nadu') ||
    addr.includes('hyderabad') ||
    addr.includes('telangana') ||
    addr.includes('andhra') ||
    addr.includes('kerala') ||
    addr.includes('kochi') ||
    addr.includes('thiruvananthapuram') ||
    addr.includes('vellore') ||
    addr.includes('coimbatore')
  ) {
    return 'south';
  }
  if (
    addr.includes('kolkata') ||
    addr.includes('west bengal') ||
    addr.includes('odisha') ||
    addr.includes('bhubaneswar') ||
    addr.includes('cuttack') ||
    addr.includes('bihar') ||
    addr.includes('patna') ||
    addr.includes('jharkhand') ||
    addr.includes('ranchi') ||
    addr.includes('assam') ||
    addr.includes('guwahati') ||
    addr.includes('meghalaya') ||
    addr.includes('shillong')
  ) {
    return 'east';
  }
  return 'central';
}

export function HospitalSearchBar({
  hospitals = [],
  selectedHospitalId = null,
  activeHospital = null,
  onSelectHospital,
  ambulancePos = null,
  compact = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and sort hospitals
  const filteredHospitals = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (hospitals || [])
      .map((h) => {
        const distM =
          ambulancePos?.lat != null && ambulancePos?.lon != null && h.lat != null && h.lon != null
            ? haversineDistance(ambulancePos.lat, ambulancePos.lon, h.lat, h.lon)
            : null;
        const region = getHospitalRegion(h);
        return { ...h, _distM: distM, _region: region };
      })
      .filter((h) => {
        // Region filter
        if (selectedRegion !== 'all' && h._region !== selectedRegion) {
          return false;
        }

        // Query filter
        if (!q) return true;
        const nameMatch = (h.name || '').toLowerCase().includes(q);
        const shortMatch = (h.shortName || '').toLowerCase().includes(q);
        const addrMatch = (h.address || '').toLowerCase().includes(q);
        const specMatch = Array.isArray(h.specialties) && h.specialties.some((s) => s.toLowerCase().includes(q));
        const specLabelsMatch =
          Array.isArray(h.specialtyLabels) && h.specialtyLabels.some((s) => s.toLowerCase().includes(q));

        return nameMatch || shortMatch || addrMatch || specMatch || specLabelsMatch;
      })
      .sort((a, b) => {
        // Active destination first, then nearest distance
        if (a.id === selectedHospitalId) return -1;
        if (b.id === selectedHospitalId) return 1;
        if (a._distM != null && b._distM != null) return a._distM - b._distM;
        return 0;
      });
  }, [hospitals, query, selectedRegion, ambulancePos, selectedHospitalId]);

  const handleSelect = (hospitalId) => {
    if (onSelectHospital) {
      onSelectHospital(hospitalId);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    if (onSelectHospital) {
      onSelectHospital(null);
    }
    setQuery('');
  };

  const regionCounts = useMemo(() => {
    const counts = { all: (hospitals || []).length, ncr: 0, north: 0, west: 0, south: 0, east: 0, central: 0 };
    (hospitals || []).forEach((h) => {
      const reg = getHospitalRegion(h);
      if (counts[reg] !== undefined) counts[reg]++;
    });
    return counts;
  }, [hospitals]);

  const currentlyMarked = useMemo(() => {
    if (selectedHospitalId) {
      return hospitals.find((h) => h.id === selectedHospitalId);
    }
    return activeHospital || null;
  }, [selectedHospitalId, activeHospital, hospitals]);

  const totalHospitals = hospitals.length || 80;

  return (
    <div ref={containerRef} className={`relative font-mono ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
          <Search className="w-4 h-4 text-[#D62828]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={
            currentlyMarked
              ? `🎯 ${currentlyMarked.shortName || currentlyMarked.name} (Search ${totalHospitals} hospitals...)`
              : `Search ${totalHospitals} hospitals by name, city, specialty...`
          }
          className={`w-full pl-8 pr-16 py-1.5 rounded-lg border text-xs font-sans transition-all backdrop-blur-md shadow-xs ${
            isOpen
              ? 'bg-white dark:bg-slate-900 border-[#D62828] ring-2 ring-red-500/20 text-slate-900 dark:text-slate-100'
              : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search text"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : selectedHospitalId ? (
            <button
              type="button"
              onClick={handleClear}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
              title="Reset manual destination override back to automated CAD recommendation"
            >
              Auto
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline px-1">
              {totalHospitals} Hubs
            </span>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[800] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[70vh] flex flex-col page-enter">
          {/* Region Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar bg-slate-50/70 dark:bg-slate-950/60 shrink-0">
            {REGION_DEFINITIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRegion(r.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedRegion === r.id
                    ? 'bg-[#1F3C6D] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {r.label} ({regionCounts[r.id] ?? 0})
              </button>
            ))}
          </div>

          {/* Results Count & Quick Reset Header */}
          <div className="px-3 py-1.5 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            <span>
              Showing <strong>{filteredHospitals.length}</strong> matching facilities
            </span>
            {selectedHospitalId && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-bold text-[#D62828] dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Reset to Automated CAD Route</span>
              </button>
            )}
          </div>

          {/* Scrollable Hospitals List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1 flex-1">
            {filteredHospitals.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <Hospital className="w-6 h-6 mx-auto text-slate-400" />
                <p className="font-bold">No hospitals found matching &ldquo;{query}&rdquo;</p>
                <p className="text-[10px]">Try searching by city (e.g. Mumbai, Bengaluru, Lucknow, Noida) or clinical specialty.</p>
              </div>
            ) : (
              filteredHospitals.map((hosp) => {
                const isSelected = hosp.id === selectedHospitalId;
                const isCadBest = activeHospital && hosp.id === activeHospital.id && !selectedHospitalId;
                const beds = hosp.bedAvailability || {};

                return (
                  <button
                    key={hosp.id}
                    type="button"
                    onClick={() => handleSelect(hosp.id)}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border border-emerald-500/30 dark:bg-emerald-950/40'
                        : isCadBest
                        ? 'bg-blue-500/10 border border-blue-500/20 dark:bg-blue-950/30'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">
                          {hosp.name}
                        </span>

                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            ACTIVE TARGET
                          </span>
                        )}

                        {isCadBest && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                            ★ CAD RECOMMENDED
                          </span>
                        )}

                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {beds.status || 'AVAILABLE'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-sans">
                        {hosp.address}
                      </p>

                      {/* Specialties chips */}
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {(hosp.specialties || []).map((spec) => (
                          <span
                            key={spec}
                            className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                          >
                            {spec.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Distance / ETA Column */}
                    <div className="text-right shrink-0 pt-0.5 space-y-0.5 font-mono">
                      {hosp._distM != null ? (
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {formatDistance(hosp._distM)}
                        </span>
                      ) : null}
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                        {beds.icuBedsFree ?? 0} ICU Beds
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalSearchBar;
