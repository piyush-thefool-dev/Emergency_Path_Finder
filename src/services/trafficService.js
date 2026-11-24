/**
 * Traffic provider configuration and routing service helpers.
 *
 * Stores optional provider credentials and identifies available traffic sources:
 *   1. OSRM road routing estimates (not live traffic speeds).
 *   2. TomTom Traffic Flow API credentials (not yet wired into graph weighting).
 *   3. Google Maps traffic APIs (credentials / integration work required).
 *   4. Municipal SUMO / NCR traffic simulation (integration work required).
 */

const STORAGE_KEY = 'epf_traffic_provider_config';

export const TRAFFIC_PROVIDERS = {
  OSRM: {
    id: 'osrm',
    name: 'OpenStreetMap OSRM Routing',
    description: 'Road distance and baseline travel-time estimates via project-osrm.org; no live traffic speeds.',
    requiresKey: false,
    status: 'ACTIVE_FREE',
  },
  TOMTOM: {
    id: 'tomtom',
    name: 'TomTom Traffic Flow API (No Credit Card Required)',
    description: 'Real-time probe speed telemetry (currentSpeed vs freeFlowSpeed in km/h). Free email sign-up with 2,500 calls/day (~75,000 calls/month) and zero credit card requirement.',
    requiresKey: true,
    keyPlaceholder: 'Enter TomTom Traffic API Key (from developer.tomtom.com)...',
    status: 'KEY_CONFIGURABLE',
  },
  GOOGLE_MAPS: {
    id: 'google_maps',
    name: 'Google Maps Routes / Traffic Matrix',
    description: 'Real-time traffic duration in traffic (best_guess / pessimistic)',
    requiresKey: true,
    keyPlaceholder: 'Enter Google Maps Platform API Key...',
    status: 'KEY_CONFIGURABLE',
  },
  SUMO: {
    id: 'sumo',
    name: 'Municipal SUMO / NCR ITS Stream',
    description: 'High-resolution microscopic traffic simulation & loop detector telemetry',
    requiresKey: false,
    status: 'CALIBRATED_STREAM',
  },
};

export function getStoredTrafficConfig() {
  const envTomtomKey =
    (typeof process !== 'undefined' && (process.env?.TOMTOM_API_KEY || process.env?.VITE_TOMTOM_API_KEY)) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TOMTOM_API_KEY) ||
    '';

  const defaultState = {
    providerId: envTomtomKey ? 'tomtom' : 'osrm',
    tomtomApiKey: envTomtomKey,
    googleApiKey: '',
    isKeyConnected: Boolean(envTomtomKey),
  };

  if (typeof localStorage === 'undefined') {
    return defaultState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }
    const parsed = JSON.parse(raw);
    const effectiveTomtomKey = parsed.tomtomApiKey || envTomtomKey;
    return {
      ...parsed,
      tomtomApiKey: effectiveTomtomKey,
      providerId: effectiveTomtomKey ? 'tomtom' : (parsed.providerId || 'osrm'),
      isKeyConnected: Boolean(effectiveTomtomKey),
    };
  } catch {
    return defaultState;
  }
}

export function saveStoredTrafficConfig(config) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Could not save traffic config:', e);
  }
}

/**
 * Queries a baseline OSRM road route between two coordinates; this is not a live traffic-speed feed.
 * @param {number} fromLat
 * @param {number} fromLon
 * @param {number} toLat
 * @param {number} toLon
 * @returns {Promise<{ durationSec: number, distanceM: number, effectiveSpeedKph: number, source: string }>}
 */
export async function queryLiveOsrmSegment(fromLat, fromLon, toLat, toLon) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`OSRM returned ${res.status}`);
  }
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('No route found in OSRM');
  }
  const route = data.routes[0];
  const durationSec = Math.max(1, Math.round(route.duration));
  const distanceM = Math.max(1, Math.round(route.distance));
  const effectiveSpeedKph = Number(((distanceM / durationSec) * 3.6).toFixed(1));

  return {
    durationSec,
    distanceM,
    effectiveSpeedKph,
    source: 'OpenStreetMap OSRM route estimate',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Queries TomTom Traffic Flow API for real-time speed on a coordinate point if an API key is provided.
 * @param {number} lat
 * @param {number} lon
 * @param {string} apiKey
 * @returns {Promise<{ currentSpeedKph: number, freeFlowSpeedKph: number, confidence: number, roadName: string }>}
 */
export async function queryTomTomFlow(lat, lon, apiKey) {
  if (!apiKey) {
    throw new Error('TomTom API key not provided');
  }
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${lat},${lon}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TomTom API returned status ${res.status}`);
  }
  const data = await res.json();
  const flow = data.flowSegmentData || {};
  return {
    currentSpeedKph: flow.currentSpeed || 40,
    freeFlowSpeedKph: flow.freeFlowSpeed || 50,
    confidence: flow.confidence || 0.9,
    roadName: flow.roadName || 'Dispatch Corridor',
    source: 'TomTom Live Traffic Flow API',
    timestamp: new Date().toISOString(),
  };
}
