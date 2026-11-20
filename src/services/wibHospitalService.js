/**
 * WIB India Hospitals API Service.
 *
 * Integrates with the public, open-data WIB India Hospitals API:
 *   Endpoint: https://wibest.in/data/json/hospitals.json
 *   Licence: Creative Commons Attribution (CC-BY 4.0)
 *   Coverage: Hospital directory records may include Noida / Delhi-NCR entries.
 *
 * Fetches hospital directory records when available. Free-bed figures are
 * estimated from listed capacity for prototype use; this endpoint is not a
 * live hospital bed-management feed.
 */

export const WIB_API_CONFIG = {
  endpoint: 'https://wibest.in/data/json/hospitals.json',
  sourceName: 'WIB India Hospitals Open API',
  sourceUrl: 'https://wibest.in',
  licence: 'Creative Commons (CC-BY 4.0)',
};

/**
 * Maps WIB API medical specialty strings to emergency routing triage categories.
 *
 * @param {Array<string>} wibSpecialties
 * @returns {{ specialties: Array<string>, specialtyLabels: Array<string> }}
 */
export function mapWibSpecialties(wibSpecialties = []) {
  const norm = (wibSpecialties || []).map((s) => s.toLowerCase());
  const mapped = new Set(['general_emergency']); // Every multi-specialty hospital provides general emergency

  const hasCardio = norm.some((s) => s.includes('cardio') || s.includes('heart'));
  const hasTrauma = norm.some((s) => s.includes('neuro') || s.includes('ortho') || s.includes('critical') || s.includes('trauma') || s.includes('transplant'));
  const hasBurn = norm.some((s) => s.includes('critical') || s.includes('plastic') || s.includes('burn') || s.includes('surgery'));

  if (hasCardio) mapped.add('cardiology');
  if (hasTrauma) mapped.add('trauma_center');
  if (hasBurn) mapped.add('burn_unit');

  return {
    specialties: Array.from(mapped),
    specialtyLabels: wibSpecialties && wibSpecialties.length > 0 ? wibSpecialties : ['Multi-Specialty Care'],
  };
}

/**
 * Known geographic coordinates and road network node anchor points
 * for major hospitals in Greater Noida / Delhi-NCR study corridor.
 */
export const REGIONAL_ANCHORS = [
  {
    nameMatch: /sharda/i,
    nodeId: 'n_kp3_north',
    lat: 28.4682,
    lon: 77.4988,
    defaultName: 'Sharda Super Speciality Hospital',
    defaultShortName: 'Sharda Hospital',
    defaultAddress: 'Plot 32, 34, Knowledge Park III, Greater Noida, UP 201310',
    defaultPhone: '+91 73000 40000',
    defaultType: 'Private / Medical College Hospital',
    defaultBeds: 1200,
    specialties: ['trauma_center', 'cardiology', 'general_emergency'],
    specialtyLabels: ['Level-1 Trauma Care', 'Cath Lab & Cardiac ICU', '24/7 Emergency'],
  },
  {
    nameMatch: /kailash/i,
    nodeId: 'n_pari_east',
    lat: 28.4820,
    lon: 77.5140,
    defaultName: 'Kailash Hospital & Neuro Institute',
    defaultShortName: 'Kailash Hospital',
    defaultAddress: 'Plot 23, Sector Alpha II (Near Pari Chowk), Greater Noida, UP 201308',
    defaultPhone: '+91 99902 22222',
    defaultType: 'Private / NABH Accredited',
    defaultBeds: 250,
    specialties: ['cardiology', 'general_emergency', 'trauma_center'],
    specialtyLabels: ['Interventional Cardiology', '24/7 Emergency & ICU', 'Neurology ICU'],
  },
  {
    nameMatch: /yatharth/i,
    nodeId: 'n_alpha1_center',
    lat: 28.4950,
    lon: 77.5250,
    defaultName: 'Yatharth Super Speciality Hospital',
    defaultShortName: 'Yatharth Hospital',
    defaultAddress: 'Sector Alpha I Commercial Belt, Greater Noida, UP 201308',
    defaultPhone: '+91 88004 47777',
    defaultType: 'Private / Super Speciality',
    defaultBeds: 450,
    specialties: ['burn_unit', 'trauma_center', 'general_emergency'],
    specialtyLabels: ['Burn & Plastic Surgery ICU', 'Trauma Emergency', 'Critical Care'],
  },
  {
    nameMatch: /jaypee/i,
    nodeId: 'n_delta1_east',
    lat: 28.4880,
    lon: 77.5450,
    defaultName: 'Jaypee Healthcare Center & Hospital',
    defaultShortName: 'Jaypee Hospital',
    defaultAddress: 'Sector Delta I Institutional Area, Greater Noida, UP 201315',
    defaultPhone: '+91 120 412 2222',
    defaultType: 'Private / Tertiary Care',
    defaultBeds: 525,
    specialties: ['general_emergency', 'cardiology'],
    specialtyLabels: ['Comprehensive Emergency Care', 'General Medicine', 'Cath Lab'],
  },
  {
    nameMatch: /gims|government/i,
    nodeId: 'n_surajpur_south',
    lat: 28.5120,
    lon: 77.4820,
    defaultName: 'Government Institute of Medical Sciences (GIMS)',
    defaultShortName: 'GIMS Hospital',
    defaultAddress: 'Surajpur-Kasna Institutional Road, Greater Noida, UP 201310',
    defaultPhone: '+91 73038 84224',
    defaultType: 'Autonomous / Government Teaching Hospital',
    defaultBeds: 500,
    specialties: ['trauma_center', 'burn_unit', 'cardiology', 'general_emergency'],
    specialtyLabels: ['Apex Trauma Center', 'Burn Unit', 'Cardiac ICU', 'Government ER'],
  },
  {
    nameMatch: /bakson|knowledge/i,
    nodeId: 'osm_kp3_south',
    lat: 28.4570,
    lon: 77.4975,
    defaultName: 'Bakson Multi-Speciality Hospital',
    defaultShortName: 'Bakson Hospital',
    defaultAddress: 'Plot 36B, Knowledge Park III, Greater Noida, UP 201310',
    defaultPhone: '+91 92893 22162',
    defaultType: 'Private / Multi-Speciality',
    defaultBeds: 150,
    specialties: ['general_emergency'],
    specialtyLabels: ['Multi-Speciality Emergency Care', 'Daycare & Observation'],
  },
];

/**
 * Transforms raw WIB API hospital records into road-network mapped hospital objects.
 * Strictly anchors to Greater Noida facilities (never falls back to distant Delhi hospitals).
 *
 * @param {Array<Object>} rawList
 * @returns {Array<Object>}
 */
export function processWibRecords(rawList) {
  if (!Array.isArray(rawList) || rawList.length === 0) return [];

  // Filter strictly for Greater Noida and Noida facilities
  const gnList = rawList.filter((h) => {
    const city = (h.city || '').toLowerCase();
    const addr = (h.address || '').toLowerCase();
    const name = (h.name || '').toLowerCase();
    return (
      (city.includes('noida') || addr.includes('noida') || name.includes('noida')) &&
      !addr.includes('south delhi') &&
      !name.includes('aiims')
    );
  });

  const now = new Date().toISOString();
  const mappedHospitals = [];

  // Map each regional anchor to a WIB directory match or bundled reference details.
  REGIONAL_ANCHORS.forEach((anchor, index) => {
    const match = gnList.find((h) => anchor.nameMatch.test(h.name || '') || anchor.nameMatch.test(h.address || ''));

    const hospitalName = match?.name || anchor.defaultName;
    const shortName = match ? (match.name.split('Hospital')[0].trim() || match.name) : anchor.defaultShortName;
    const totalBeds = match?.beds || anchor.defaultBeds;

    const { specialties, specialtyLabels } = match
      ? mapWibSpecialties(match.specialties)
      : { specialties: anchor.specialties, specialtyLabels: anchor.specialtyLabels };

    // Calculate free ICU and Trauma beds
    const icuBedsFree = Math.max(2, Math.round(totalBeds * 0.015));
    const traumaBedsFree = Math.max(1, Math.round(totalBeds * 0.008));
    const emergencyWardFree = Math.max(6, Math.round(totalBeds * 0.04));

    mappedHospitals.push({
      id: `hosp_gn_${index}_${shortName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: hospitalName,
      shortName,
      nodeId: anchor.nodeId,
      lat: anchor.lat,
      lon: anchor.lon,
      city: 'Greater Noida',
      institutionType: match?.type || anchor.defaultType,
      totalBeds,
      rating: match?.rating || 4.5,
      nabhAccredited: Boolean(match?.nabh ?? false),
      specialties,
      specialtyLabels,
      bedAvailability: {
        status: 'AVAILABLE',
        totalCapacity: totalBeds,
        icuBedsFree,
        traumaBedsFree,
        emergencyWardFree,
        source: match ? 'WIB directory record — bed counts estimated' : 'Bundled regional reference estimate',
        sourceUrl: WIB_API_CONFIG.endpoint,
        licence: WIB_API_CONFIG.licence,
        lastUpdated: now,
      },
      address: match?.address || anchor.defaultAddress,
      phone: match?.phone || anchor.defaultPhone,
      hasWibDirectoryRecord: Boolean(match),
      isLiveWibData: false,
      isSimulatedAvailability: true,
    });
  });

  return mappedHospitals;
}

/**
 * Fetches hospital directory records from the WIB endpoint.
 * Falls back to bundled reference records if network or CORS is constrained.
 *
 * @returns {Promise<{ hospitals: Array<Object>, isLive: boolean, totalFetched: number, source: string }>}
 */
export async function fetchWibHospitals() {
  try {
    const response = await fetch(WIB_API_CONFIG.endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WIB API returned status ${response.status}`);
    }

    const json = await response.json();
    const rawList = Array.isArray(json) ? json : json.data || [];

    if (!rawList || rawList.length === 0) {
      throw new Error('Empty payload returned from WIB API');
    }

    const mapped = processWibRecords(rawList);

    return {
      hospitals: mapped,
      isLive: true,
      totalFetched: rawList.length,
      source: WIB_API_CONFIG.sourceName,
    };
  } catch (err) {
    console.warn('WIB API live fetch failed, using bundled regional reference data:', err.message);

    // Bundled directory reference records; not a live API response.
    const fallbackWib = [
      {
        name: 'Sharda Super Speciality Hospital',
        city: 'Noida',
        type: 'Private / Medical College',
        beds: 1200,
        rating: 4.5,
        specialties: ['Cardiology', 'Critical Care', 'Neurosciences', 'Orthopedics', 'Trauma'],
        address: 'Plot 32, 34, Knowledge Park III, Greater Noida 201306',
      },
      {
        name: 'Kailash Hospital & Heart Institute',
        city: 'Noida',
        type: 'Private',
        beds: 250,
        rating: 4.4,
        specialties: ['Cardiology', 'Cardiac Surgery', 'Neurosciences', 'Critical Care'],
        address: 'Sector Alpha II, Pari Chowk Corridor, Greater Noida 201308',
      },
      {
        name: 'Yatharth Super Speciality Hospital',
        city: 'Noida',
        type: 'Private',
        beds: 450,
        rating: 4.3,
        specialties: ['Cardiology', 'Neurosciences', 'Critical Care', 'Plastic Surgery', 'Trauma'],
        address: 'Sector Alpha I Commercial Belt, Greater Noida 201308',
      },
      {
        name: 'Jaypee Hospital',
        city: 'Noida',
        type: 'Private',
        beds: 525,
        rating: 4.4,
        specialties: ['Cardiac Sciences', 'Neurosciences', 'Liver Transplant', 'Orthopedics', 'Critical Care'],
        address: 'Sector 128 / Delta Expressway Link, Greater Noida 201304',
      },
      {
        name: 'Government Institute of Medical Sciences (GIMS)',
        city: 'Noida',
        type: 'Government',
        beds: 500,
        rating: 4.2,
        specialties: ['General Medicine', 'Trauma', 'Surgery', 'Pediatrics', 'Critical Care'],
        address: 'Surajpur-Kasna Arterial Road, Greater Noida 201310',
      },
      {
        name: 'Felix Hospital Noida',
        city: 'Noida',
        type: 'Private',
        beds: 200,
        rating: 4.2,
        specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Critical Care'],
        address: 'Sector 137 / Institutional Express, Noida 201305',
      },
    ];

    const mapped = processWibRecords(fallbackWib);

    return {
      hospitals: mapped,
      isLive: false,
      totalFetched: fallbackWib.length,
      source: `${WIB_API_CONFIG.sourceName} (endpoint unavailable; bundled reference data)`,
    };
  }
}
