/**
 * Geographic calculation and unit conversion utilities.
 */

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 Latitude of first point in decimal degrees
 * @param {number} lon1 Longitude of first point in decimal degrees
 * @param {number} lat2 Latitude of second point in decimal degrees
 * @param {number} lon2 Longitude of second point in decimal degrees
 * @returns {number} Distance in metres
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    Number.isNaN(lat1) ||
    Number.isNaN(lon1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371000; // Earth mean radius in metres
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) *
      Math.cos(lat2 * toRad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts speed from kilometres per hour to metres per second.
 * v(m/s) = v(km/h) * 1000 / 3600
 *
 * @param {number} kph Speed in km/h
 * @returns {number} Speed in m/s
 */
export function kphToMps(kph) {
  if (typeof kph !== 'number' || Number.isNaN(kph) || kph <= 0) {
    return 0;
  }
  return (kph * 1000) / 3600;
}

/**
 * Converts speed from metres per second to kilometres per hour.
 *
 * @param {number} mps Speed in m/s
 * @returns {number} Speed in km/h
 */
export function mpsToKph(mps) {
  if (typeof mps !== 'number' || Number.isNaN(mps) || mps < 0) {
    return 0;
  }
  return (mps * 3600) / 1000;
}

/**
 * Formats a metric distance into a human-readable string.
 *
 * @param {number} metres Distance in metres
 * @returns {string} Formatted string, e.g. "2.4 km" or "450 m"
 */
export function formatDistance(metres) {
  if (typeof metres !== 'number' || Number.isNaN(metres) || metres < 0) {
    return '0 m';
  }
  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(2)} km`;
  }
  return `${Math.round(metres)} m`;
}

/**
 * Finds the nearest graph node to given coordinates.
 *
 * @param {number} lat Target latitude
 * @param {number} lon Target longitude
 * @param {Array<Object>} nodes Array of node objects { id, lat, lon }
 * @returns {Object|null} Nearest node object or null
 */
export function findNearestNode(lat, lon, nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;

  let bestNode = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    if (typeof node.lat !== 'number' || typeof node.lon !== 'number') continue;
    const dist = haversineDistance(lat, lon, node.lat, node.lon);
    if (dist < minDistance) {
      minDistance = dist;
      bestNode = node;
    }
  }

  return bestNode;
}

/**
 * Computes initial compass bearing (0..360 deg, 0 = North) from coordinate A to B.
 */
export function computeBearingDeg(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  if (Math.abs(lat1 - lat2) < 1e-7 && Math.abs(lon1 - lon2) < 1e-7) return 0;
  const toRad = Math.PI / 180;
  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const dLambda = (lon2 - lon1) * toRad;
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Returns a bounded marker scale factor (0.28..1.0) so 3D vehicle and hospital icons
 * shrink smoothly when zooming out instead of covering the page at regional/national zoom.
 */
export function getMarkerScaleForZoom(zoom = 14) {
  const z = Number.isFinite(zoom) ? zoom : 14;
  if (z >= 15) return 1;
  return Math.max(0.28, Math.min(1, Math.pow(2, (z - 15) * 0.42)));
}
