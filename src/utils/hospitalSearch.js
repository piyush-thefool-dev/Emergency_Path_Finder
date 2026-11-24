/**
 * Hospital Search and Spatial Relevance Utilities.
 * Provides multi-token fuzzy matching, space-insensitive aliases,
 * driving ETA estimates, and regional boundary tagging.
 */

/**
 * Classifies a hospital into its geographic region (ncr, north, west, south, east, central).
 *
 * @param {Object} hosp Hospital object
 * @returns {string} Region identifier
 */
export function getHospitalRegion(hosp) {
  if (!hosp) return 'central';
  const addr = (hosp.address || '').toLowerCase();
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
    id.startsWith('hosp_fortis_noida') ||
    id.startsWith('hosp_rml') ||
    id.startsWith('hosp_gangaram') ||
    id.startsWith('hosp_apollo_delhi') ||
    id.startsWith('hosp_lnjp') ||
    id.startsWith('hosp_fortis_escorts') ||
    id.startsWith('hosp_ilbs') ||
    id.startsWith('hosp_blk') ||
    id.startsWith('hosp_artemis') ||
    id.startsWith('hosp_max_gurugram') ||
    id.startsWith('hosp_fortis_faridabad') ||
    id.startsWith('hosp_metro_faridabad') ||
    id.startsWith('hosp_yashoda') ||
    id.startsWith('hosp_apollo_noida')
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

/**
 * Estimates driving duration based on Haversine distance and 38 km/h urban speed.
 *
 * @param {number|null} distM Distance in metres
 * @returns {string|null} Formatted duration (e.g. "3 min", "1h 15m")
 */
export function estimateDrivingTime(distM) {
  if (distM == null) return null;
  const mins = Math.max(1, Math.round((distM / 1000 / 38) * 60));
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  }
  return `${mins} min`;
}

/**
 * Calculates a search relevance score for a hospital given a user search query.
 * Supports:
 *   - Multi-token searching: e.g. "aiims delhi" matches "AIIMS New Delhi"
 *   - Word order independence: "delhi aiims" matches "AIIMS New Delhi"
 *   - Space-insensitive searching: e.g. "gangaram" matches "Sir Ganga Ram"
 *   - Search across name, shortName, city, district, address, and specialties.
 *
 * @param {Object} hosp Hospital record
 * @param {string} query User search input
 * @returns {number} Score > 0 if matching (higher is more relevant), 0 if no match
 */
export function getSearchRelevance(hosp, query) {
  if (!hosp) return 0;
  const q = (query || '').trim().toLowerCase();
  if (!q) return 1;

  const name = (hosp.name || '').toLowerCase();
  const shortName = (hosp.shortName || '').toLowerCase();
  const addr = (hosp.address || '').toLowerCase();
  const specialties = Array.isArray(hosp.specialties) ? hosp.specialties.join(' ').toLowerCase() : '';
  const specialtyLabels = Array.isArray(hosp.specialtyLabels) ? hosp.specialtyLabels.join(' ').toLowerCase() : '';

  // 1. Exact phrase matches (highest priority)
  if (shortName === q || name === q) return 1000;
  if (shortName.startsWith(q)) return 850;
  if (shortName.includes(q)) return 800;
  if (name.includes(q)) return 700;

  // 2. Space-insensitive match (e.g. "gangaram" -> "Sir Ganga Ram", "fortisescorts" -> "Fortis Escorts")
  const cleanQ = q.replace(/[^a-z0-9]/g, '');
  const cleanName = (name + ' ' + shortName).replace(/[^a-z0-9]/g, '');
  if (cleanQ.length >= 3 && cleanName.includes(cleanQ)) return 650;

  // 3. Multi-token match in name or shortName (e.g. "aiims delhi" -> "AIIMS New Delhi")
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return 0;

  const nameTokensText = (name + ' ' + shortName).replace(/[^a-z0-9]/g, ' ');
  const allTokensInName = tokens.every((t) => nameTokensText.includes(t));
  if (allTokensInName) return 500;

  // 4. Exact phrase in address or specialties
  if (addr.includes(q)) return 300;
  const cleanCombined = (name + ' ' + shortName + ' ' + addr + ' ' + specialties + ' ' + specialtyLabels).replace(/[^a-z0-9]/g, '');
  if (cleanQ.length >= 3 && cleanCombined.includes(cleanQ)) return 280;
  if (specialties.includes(q) || specialtyLabels.includes(q)) return 250;

  // 5. Multi-token match across all fields (name + address + specialties)
  const combinedTokensText = (name + ' ' + shortName + ' ' + addr + ' ' + specialties + ' ' + specialtyLabels).replace(/[^a-z0-9]/g, ' ');
  const allTokensInCombined = tokens.every((t) => combinedTokensText.includes(t));
  if (allTokensInCombined) return 100;

  return 0;
}
