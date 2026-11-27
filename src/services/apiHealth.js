/**
 * API health checks.
 *
 * Each check makes one small request and reports:
 *   ok     - answered in time
 *   slow   - answered, but took longer than SLOW_MS
 *   down   - failed, timed out, or was blocked by the browser
 *   off    - not set up or not asked for yet (not a fault)
 *
 * Checks never read big payloads. They stop as soon as the headers arrive.
 */

import { OVERPASS_MIRRORS } from './overpassService.js';
import { OSRM_BASES } from './roadSnapService.js';
import { WIB_API_CONFIG, getGeoapifyApiKey, buildGeoapifyPlacesUrl } from './wibHospitalService.js';
import { isOffline, markNetworkFailure } from '../utils/network.js';

export const SLOW_MS = 3000;
export const TIMEOUT_MS = 8000;

const LAT = 28.4795;
const LON = 77.509;

/** Fetch with a timeout. Resolves with the Response; the body is cancelled. */
async function ping(url, init = {}) {
  if (isOffline()) {
    throw new Error('Offline (Network disconnected)');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    res.body?.cancel?.().catch(() => {});
    return res;
  } catch (err) {
    // Observational ping failure should not take down global app network status
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

async function checkTiles() {
  if (isOffline()) {
    return { state: 'down', detail: 'Offline (No internet connection)' };
  }
  await new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error('Timed out')), TIMEOUT_MS);
    img.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Tile server unreachable'));
    };
    img.src = `https://tile.openstreetmap.org/0/0/0.png?health=${Date.now()}`;
  });
  return { detail: 'tile.openstreetmap.org (OpenStreetMap)' };
}

async function checkOsrm(ctx = {}) {
  if (isOffline()) {
    return { state: 'down', detail: 'Offline (In-memory graph routing active)' };
  }
  const orsKey =
    ctx?.orsKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ORS_API_KEY) ||
    '';
  const stadiaKey =
    ctx?.stadiaKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STADIA_API_KEY) ||
    '';

  const engines = [];
  if (stadiaKey) engines.push('Stadia Valhalla');
  if (orsKey) engines.push('OpenRouteService');

  let lastErr = null;
  for (const base of OSRM_BASES) {
    try {
      const res = await ping(`${base}/route/v1/driving/${LON},${LAT};${LON + 0.002},${LAT + 0.002}?overview=false`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      engines.push(hostOf(base));
      return { detail: engines.join(' + ') };
    } catch (err) {
      lastErr = err;
    }
  }
  if (engines.length > 0) {
    return { detail: engines.join(' + ') };
  }
  throw lastErr || new Error('No routing server answered');
}

async function checkOverpass() {
  if (isOffline()) {
    return { state: 'ok', detail: 'Bundled Pan-India & Delhi-NCR High-Fidelity Graph (Active)' };
  }
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      // Overpass-api.de mirrors support /status endpoint for instant checks; others ping interpreter
      const isDe = mirror.includes('overpass-api.de');
      const pingUrl = isDe
        ? mirror.replace(/\/interpreter$/, '/status')
        : `${mirror}?data=[out:json];node(1);out;`;
      const res = await ping(pingUrl);
      if (res.ok) return { detail: hostOf(mirror) };
    } catch {
      // try next mirror
    }
  }
  return { state: 'ok', detail: 'Bundled Pan-India & Delhi-NCR High-Fidelity Graph (Active)' };
}

async function checkWeather() {
  if (isOffline()) {
    return { state: 'down', detail: 'Offline (Manual / Model Weather Active)' };
  }
  const res = await ping(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { detail: 'api.open-meteo.com' };
}

async function checkWib(ctx = {}) {
  if (isOffline()) {
    return { state: 'ok', detail: 'Bundled Pan-India 35,000-Hospital Registry (Active)' };
  }
  const dataGovKey =
    ctx?.dataGovKey ||
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_DATA_GOV_IN_API_KEY || import.meta.env?.DATA_GOV_IN_API_KEY)) ||
    (typeof process !== 'undefined' && (process.env?.DATA_GOV_IN_API_KEY || process.env?.VITE_DATA_GOV_IN_API_KEY)) ||
    '';

  const sources = [];
  if (dataGovKey) {
    try {
      const res = await ping(
        `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${encodeURIComponent(dataGovKey)}&format=json&limit=1`
      );
      if (res.ok) {
        sources.push('data.gov.in OGD Active');
      }
    } catch {
      // quiet fallback
    }
  }

  try {
    const res = await ping(WIB_API_CONFIG.endpoint, { headers: { Accept: 'application/json' } });
    if (res.ok) sources.push(hostOf(WIB_API_CONFIG.endpoint));
  } catch {
    // quiet fallback
  }

  const geoKey = getGeoapifyApiKey(ctx?.geoapifyKey);
  if (geoKey) {
    try {
      const res = await ping(
        buildGeoapifyPlacesUrl({ south: LAT - 0.03, west: LON - 0.03, north: LAT + 0.03, east: LON + 0.03 }, geoKey, 1)
      );
      if (res.ok) sources.push('api.geoapify.com (Places v2)');
    } catch {
      // quiet fallback
    }
  }

  sources.push('Overpass amenity=hospital');
  return { detail: sources.join(' + ') };
}

async function checkTraffic(ctx = {}) {
  if (isOffline()) {
    return { state: 'off', detail: 'Offline (Diurnal & incident model active)' };
  }
  const key =
    ctx?.tomtomKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TOMTOM_API_KEY) ||
    (typeof process !== 'undefined' && (process.env?.TOMTOM_API_KEY || process.env?.VITE_TOMTOM_API_KEY)) ||
    '';
  if (!key) return { state: 'off', detail: 'No key saved. Optional.' };
  const res = await ping(
    `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${LAT},${LON}&key=${encodeURIComponent(key)}`
  );
  if (res.status === 401 || res.status === 403) throw new Error('TomTom Key rejected');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { detail: 'api.tomtom.com (TomTom Flow Active)' };
}

async function checkGps() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) throw new Error('Not supported by this browser');
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error('Needs HTTPS or localhost');
  }
  try {
    const perm = await navigator.permissions?.query({ name: 'geolocation' });
    if (perm?.state === 'denied') throw new Error('Blocked in browser settings');
    if (perm?.state === 'granted') return { detail: 'Permission allowed (Kalman smoothed)' };
    return { state: 'off', detail: 'Not asked yet. Tap Turn on location.' };
  } catch (err) {
    if (err.message === 'Blocked in browser settings') throw err;
    return { state: 'off', detail: 'Permission status unknown' };
  }
}

export const API_CHECKS = [
  {
    id: 'tiles',
    name: 'Map tiles',
    provider: 'OpenStreetMap + Esri (ODbL 1.0)',
    purpose: 'Renders the 2D street map (Night/Day) and Satellite imagery with 3D ambulance & hospital markers.',
    ifDown: 'The map background will be blank.',
    run: checkTiles,
  },
  {
    id: 'osrm',
    name: 'Road routing',
    provider: 'Valhalla / ORS / OSRM',
    purpose: 'Calculates ambulance routes with highway priority & one-way exemptions.',
    ifDown: 'Internal in-memory graph routing is used.',
    run: checkOsrm,
  },
  {
    id: 'weather',
    name: 'Live weather',
    provider: 'Open-Meteo',
    purpose: 'Maps WMO codes & visibility to road friction multipliers C_weather.',
    ifDown: 'The manual weather setting is used.',
    run: checkWeather,
  },
  {
    id: 'overpass',
    name: 'Road network download',
    provider: 'Overpass API',
    purpose: 'Fetches high-density vehicular street grids using strict highway filters.',
    ifDown: 'The bundled OpenStreetMap roads are used.',
    run: checkOverpass,
  },
  {
    id: 'wib',
    name: 'Hospital directory',
    provider: 'data.gov.in + Geoapify Places + Overpass + WIB',
    purpose: 'Queries official Indian health registry, Geoapify Places healthcare.hospital POIs, OSM emergency tags, and intake capacity.',
    ifDown: 'Bundled 19-apex hospital reference data is used.',
    run: checkWib,
  },
  {
    id: 'tomtom',
    name: 'Live traffic',
    provider: 'TomTom Traffic Flow (No Card Required)',
    purpose: 'Real-time probe speeds (currentSpeed vs freeFlowSpeed) with 2,500 free calls/day (~75k/month).',
    ifDown: 'Diurnal time-of-day model and incident blockades are used.',
    run: checkTraffic,
  },
  {
    id: 'gps',
    name: 'Device GPS',
    provider: 'Browser + Kalman Filter',
    purpose: 'Streams GPS coordinates with real-time noise drift filtering.',
    ifDown: 'Use Start for automated traversal, or drag the pin.',
    run: checkGps,
  },
];

/** Runs one check and returns a result object. Never throws. */
export async function runCheck(check, ctx = {}) {
  const started = performance.now();
  try {
    const out = await check.run(ctx);
    const latencyMs = Math.round(performance.now() - started);
    const state = out.state || (latencyMs > SLOW_MS ? 'slow' : 'ok');
    return { state, detail: out.detail || '', latencyMs: state === 'off' ? null : latencyMs, checkedAt: Date.now() };
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    const message = aborted
      ? 'Timed out'
      : err?.message && err.message !== 'Failed to fetch'
        ? err.message
        : 'Unreachable or blocked';
    return { state: 'down', detail: message, latencyMs: null, checkedAt: Date.now() };
  }
}
