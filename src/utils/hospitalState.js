/**
 * Canonical Indian States & Union Territories Registry and Grouping Utilities.
 *
 * Normalizes address strings and hospital records across all 28 States and 8 Union Territories
 * (36 total jurisdictions) for consistent state-wise directory division, analytics aggregation,
 * and search indexing.
 */

export const INDIAN_STATES_AND_UTS = [
  { name: 'Andhra Pradesh', zone: 'SOUTH', type: 'State' },
  { name: 'Arunachal Pradesh', zone: 'NORTHEAST', type: 'State' },
  { name: 'Assam', zone: 'NORTHEAST', type: 'State' },
  { name: 'Bihar', zone: 'EAST', type: 'State' },
  { name: 'Chhattisgarh', zone: 'CENTRAL', type: 'State' },
  { name: 'Goa', zone: 'WEST', type: 'State' },
  { name: 'Gujarat', zone: 'WEST', type: 'State' },
  { name: 'Haryana', zone: 'NORTH', type: 'State' },
  { name: 'Himachal Pradesh', zone: 'NORTH', type: 'State' },
  { name: 'Jharkhand', zone: 'EAST', type: 'State' },
  { name: 'Karnataka', zone: 'SOUTH', type: 'State' },
  { name: 'Kerala', zone: 'SOUTH', type: 'State' },
  { name: 'Madhya Pradesh', zone: 'CENTRAL', type: 'State' },
  { name: 'Maharashtra', zone: 'WEST', type: 'State' },
  { name: 'Manipur', zone: 'NORTHEAST', type: 'State' },
  { name: 'Meghalaya', zone: 'NORTHEAST', type: 'State' },
  { name: 'Mizoram', zone: 'NORTHEAST', type: 'State' },
  { name: 'Nagaland', zone: 'NORTHEAST', type: 'State' },
  { name: 'Odisha', zone: 'EAST', type: 'State' },
  { name: 'Punjab', zone: 'NORTH', type: 'State' },
  { name: 'Rajasthan', zone: 'NORTH', type: 'State' },
  { name: 'Sikkim', zone: 'NORTHEAST', type: 'State' },
  { name: 'Tamil Nadu', zone: 'SOUTH', type: 'State' },
  { name: 'Telangana', zone: 'SOUTH', type: 'State' },
  { name: 'Tripura', zone: 'NORTHEAST', type: 'State' },
  { name: 'Uttar Pradesh', zone: 'NORTH', type: 'State' },
  { name: 'Uttarakhand', zone: 'NORTH', type: 'State' },
  { name: 'West Bengal', zone: 'EAST', type: 'State' },
  { name: 'Andaman & Nicobar Islands', zone: 'SOUTH', type: 'UT' },
  { name: 'Chandigarh', zone: 'NORTH', type: 'UT' },
  { name: 'Dadra & Nagar Haveli and Daman & Diu', zone: 'WEST', type: 'UT' },
  { name: 'Delhi (NCT)', zone: 'NORTH', type: 'UT' },
  { name: 'Jammu & Kashmir', zone: 'NORTH', type: 'UT' },
  { name: 'Ladakh', zone: 'NORTH', type: 'UT' },
  { name: 'Lakshadweep', zone: 'SOUTH', type: 'UT' },
  { name: 'Puducherry', zone: 'SOUTH', type: 'UT' },
];

const STATE_META_MAP = new Map(INDIAN_STATES_AND_UTS.map((entry) => [entry.name, entry]));

const STATE_ALIASES = [
  ['andaman & nicobar', 'Andaman & Nicobar Islands'],
  ['andaman and nicobar', 'Andaman & Nicobar Islands'],
  ['port blair', 'Andaman & Nicobar Islands'],
  ['andhra pradesh', 'Andhra Pradesh'],
  ['arunachal pradesh', 'Arunachal Pradesh'],
  ['assam', 'Assam'],
  ['bihar', 'Bihar'],
  ['chandigarh', 'Chandigarh'],
  ['chhattisgarh', 'Chhattisgarh'],
  ['dadra & nagar haveli', 'Dadra & Nagar Haveli and Daman & Diu'],
  ['dadra and nagar haveli', 'Dadra & Nagar Haveli and Daman & Diu'],
  ['daman & diu', 'Dadra & Nagar Haveli and Daman & Diu'],
  ['daman and diu', 'Dadra & Nagar Haveli and Daman & Diu'],
  ['silvassa', 'Dadra & Nagar Haveli and Daman & Diu'],
  ['delhi (nct)', 'Delhi (NCT)'],
  ['new delhi', 'Delhi (NCT)'],
  ['delhi', 'Delhi (NCT)'],
  ['goa', 'Goa'],
  ['gujarat', 'Gujarat'],
  ['haryana', 'Haryana'],
  ['himachal pradesh', 'Himachal Pradesh'],
  ['jammu & kashmir', 'Jammu & Kashmir'],
  ['jammu and kashmir', 'Jammu & Kashmir'],
  ['jharkhand', 'Jharkhand'],
  ['karnataka', 'Karnataka'],
  ['kerala', 'Kerala'],
  ['ladakh', 'Ladakh'],
  ['lakshadweep', 'Lakshadweep'],
  ['kavaratti', 'Lakshadweep'],
  ['madhya pradesh', 'Madhya Pradesh'],
  ['maharashtra', 'Maharashtra'],
  ['manipur', 'Manipur'],
  ['meghalaya', 'Meghalaya'],
  ['mizoram', 'Mizoram'],
  ['nagaland', 'Nagaland'],
  ['odisha', 'Odisha'],
  ['orissa', 'Odisha'],
  ['puducherry', 'Puducherry'],
  ['pondicherry', 'Puducherry'],
  ['punjab', 'Punjab'],
  ['rajasthan', 'Rajasthan'],
  ['sikkim', 'Sikkim'],
  ['tamil nadu', 'Tamil Nadu'],
  ['telangana', 'Telangana'],
  ['tripura', 'Tripura'],
  ['uttar pradesh', 'Uttar Pradesh'],
  ['greater noida', 'Uttar Pradesh'],
  ['noida', 'Uttar Pradesh'],
  ['ghaziabad', 'Uttar Pradesh'],
  ['uttarakhand', 'Uttarakhand'],
  ['west bengal', 'West Bengal'],
];

const SHORT_CODE_ALIASES = {
  up: 'Uttar Pradesh',
  mp: 'Madhya Pradesh',
  hp: 'Himachal Pradesh',
  uk: 'Uttarakhand',
  wb: 'West Bengal',
  tn: 'Tamil Nadu',
  ap: 'Andhra Pradesh',
  ts: 'Telangana',
  jk: 'Jammu & Kashmir',
  dl: 'Delhi (NCT)',
  mh: 'Maharashtra',
  gj: 'Gujarat',
  rj: 'Rajasthan',
  pb: 'Punjab',
  hr: 'Haryana',
  ka: 'Karnataka',
  kl: 'Kerala',
  br: 'Bihar',
  jh: 'Jharkhand',
  od: 'Odisha',
  cg: 'Chhattisgarh',
  ga: 'Goa',
  as: 'Assam',
};

/**
 * Resolves any hospital record to its canonical Indian State or Union Territory name.
 */
export function resolveHospitalState(hosp) {
  if (!hosp) return 'Uttar Pradesh';
  if (hosp.state && STATE_META_MAP.has(hosp.state)) {
    return hosp.state;
  }

  const explicitLower = (hosp.state || '').trim().toLowerCase();
  if (explicitLower && SHORT_CODE_ALIASES[explicitLower]) {
    return SHORT_CODE_ALIASES[explicitLower];
  }

  const addr = (hosp.address || '').toLowerCase();
  const segments = addr
    .split(',')
    .map((part) => part.replace(/\b\d{6}\b/g, '').trim())
    .filter(Boolean);

  // Inspect tail segments first so a street named "Delhi Road" in UP doesn't override ", UP"
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (SHORT_CODE_ALIASES[seg]) {
      return SHORT_CODE_ALIASES[seg];
    }
    for (const [needle, canonical] of STATE_ALIASES) {
      if (seg === needle || seg.includes(needle)) {
        return canonical;
      }
    }
  }

  return 'Uttar Pradesh';
}

/**
 * Maps a hospital to its 6-zone Indian emergency dispatch macro-zone.
 */
export function getHospitalMacroZone(hosp) {
  const canonicalState = resolveHospitalState(hosp);
  return STATE_META_MAP.get(canonicalState)?.zone || 'NORTH';
}

/**
 * Groups an array of hospitals by canonical Indian State / UT, enriched with capacity rollups.
 */
export function groupHospitalsByState(hospitals = []) {
  const groups = new Map();

  for (const hosp of hospitals) {
    const stateName = resolveHospitalState(hosp);
    const meta = STATE_META_MAP.get(stateName) || { name: stateName, zone: 'NORTH', type: 'State' };
    let bucket = groups.get(stateName);
    if (!bucket) {
      bucket = {
        state: stateName,
        zone: meta.zone,
        type: meta.type,
        hospitals: [],
        totalCount: 0,
        icuFreeTotal: 0,
        traumaFreeTotal: 0,
        wardFreeTotal: 0,
        totalCapacity: 0,
      };
      groups.set(stateName, bucket);
    }

    bucket.hospitals.push(hosp);
    bucket.totalCount += 1;
    bucket.icuFreeTotal += hosp.bedAvailability?.icuBedsFree ?? 0;
    bucket.traumaFreeTotal += hosp.bedAvailability?.traumaBedsFree ?? 0;
    bucket.wardFreeTotal += hosp.bedAvailability?.emergencyWardFree ?? 0;
    bucket.totalCapacity += hosp.bedAvailability?.totalCapacity ?? 250;
  }

  return [...groups.values()].sort((a, b) => a.state.localeCompare(b.state));
}

export default INDIAN_STATES_AND_UTS;
