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
import { WIB_API_CONFIG } from './wibHospitalService.js';

export const SLOW_MS = 3000;
export const TIMEOUT_MS = 8000;

const LAT = 28.4795;
const LON = 77.509;

/** Fetch with a timeout. Resolves with the Response; the body is cancelled. */
async function ping(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    res.body?.cancel?.().catch(() => {});
    return res;
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
  return { detail: 'tile.openstreetmap.org' };
}

async function checkOsrm() {
  let lastErr = null;
  for (const base of OSRM_BASES) {
    try {
      const res = await ping(`${base}/route/v1/driving/${LON},${LAT};${LON + 0.002},${LAT + 0.002}?overview=false`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { detail: hostOf(base) };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('No routing server answered');
}

async function checkOverpass() {
  let lastErr = null;
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await ping(mirror.replace(/interpreter$/, 'status'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { detail: hostOf(mirror) };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('No Overpass mirror answered');
}

async function checkWeather() {
  const res = await ping(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { detail: 'api.open-meteo.com' };
}

async function checkWib() {
  const res = await ping(WIB_API_CONFIG.endpoint, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { detail: hostOf(WIB_API_CONFIG.endpoint) };
}

async function checkTomTom({ tomtomKey }) {
  if (!tomtomKey) return { state: 'off', detail: 'No key saved. Optional.' };
  const res = await ping(
    `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${LAT},${LON}&key=${encodeURIComponent(tomtomKey)}`
  );
  if (res.status === 401 || res.status === 403) throw new Error('Key rejected');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { detail: 'api.tomtom.com' };
}

async function checkGps() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) throw new Error('Not supported by this browser');
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error('Needs HTTPS or localhost');
  }
  try {
    const perm = await navigator.permissions?.query({ name: 'geolocation' });
    if (perm?.state === 'denied') throw new Error('Blocked in browser settings');
    if (perm?.state === 'granted') return { detail: 'Permission allowed' };
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
    provider: 'OpenStreetMap',
    purpose: 'Draws the map you see.',
    ifDown: 'The map background will be blank.',
    run: checkTiles,
  },
  {
    id: 'osrm',
    name: 'Road routing',
    provider: 'OSRM',
    purpose: 'Draws the route along real roads.',
    ifDown: 'The route is drawn as straight links between junctions.',
    run: checkOsrm,
  },
  {
    id: 'weather',
    name: 'Live weather',
    provider: 'Open-Meteo',
    purpose: 'Adjusts speeds for rain, fog and wind.',
    ifDown: 'The manual weather setting is used.',
    run: checkWeather,
  },
  {
    id: 'overpass',
    name: 'Road network download',
    provider: 'Overpass API',
    purpose: 'Fetches a fresh street grid on request.',
    ifDown: 'The bundled OpenStreetMap roads are used.',
    run: checkOverpass,
  },
  {
    id: 'wib',
    name: 'Hospital directory',
    provider: 'WIB India',
    purpose: 'Hospital records and capacity.',
    ifDown: 'Bundled hospital reference data is used.',
    run: checkWib,
  },
  {
    id: 'tomtom',
    name: 'Live traffic',
    provider: 'TomTom (optional)',
    purpose: 'Real traffic speeds, when a key is saved.',
    ifDown: 'Modelled congestion and user reports are used.',
    run: checkTomTom,
  },
  {
    id: 'gps',
    name: 'Device GPS',
    provider: 'Browser',
    purpose: 'Your live position on the map.',
    ifDown: 'Use Start for a simulated drive, or drag the pin.',
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
