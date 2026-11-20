/**
 * Road-following, incident-aware route geometry.
 *
 * Asks the routing engine (OSRM, built on OpenStreetMap) for the real driveable
 * direct route from the ambulance to the hospital, strictly adhering to paved street
 * centerlines and respecting dispatcher incidents:
 *
 *   - Direct shortest street geometry: Takes the fastest, direct road corridor
 *     without unwanted detours into internal alleys or parking lots.
 *   - Road closures: candidate routes passing within CLOSURE_RADIUS_M of a closed
 *     segment are rejected. Detours around closures are dynamically generated.
 *   - Congestion: alternatives are ranked by duration plus penalty.
 */

export const OSRM_BASES = [
  'https://router.project-osrm.org',
  'https://routing.openstreetmap.de/routed-car',
];

const CLOSURE_RADIUS_M = 45;
const DETOUR_OFFSETS_M = [350, 700];
const cache = new Map();

/* ---------- small geometry helpers (local metric plane, fine at city scale) ---------- */
const M_PER_DEG_LAT = 111320;
const mPerDegLon = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

function toXY([lat, lon], refLat) {
  return [lon * mPerDegLon(refLat), lat * M_PER_DEG_LAT];
}

function pointToSegmentM(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Samples points every ~15 m along a [lat,lon] segment (inclusive of both ends). */
function sampleSegment(seg) {
  const [a, b] = seg;
  const refLat = a[0];
  const [ax, ay] = toXY(a, refLat);
  const [bx, by] = toXY(b, refLat);
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 15));
  const out = [];
  for (let i = 0; i <= n; i++) {
    out.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  }
  return out;
}

/** True when any part of `segment` lies within `radiusM` of the route polyline. */
function routeNearSegment(coords, segment, radiusM) {
  const refLat = segment[0][0];
  const xy = coords.map((c) => toXY(c, refLat));
  for (const sample of sampleSegment(segment)) {
    const p = toXY(sample, refLat);
    for (let i = 0; i < xy.length - 1; i++) {
      if (pointToSegmentM(p, xy[i], xy[i + 1]) <= radiusM) return true;
    }
  }
  return false;
}

function segmentLengthM(seg) {
  const refLat = seg[0][0];
  const [ax, ay] = toXY(seg[0], refLat);
  const [bx, by] = toXY(seg[1], refLat);
  return Math.hypot(bx - ax, by - ay);
}

/* ---------- OSRM calls ---------- */
const lonLat = ([lat, lon]) => `${lon.toFixed(6)},${lat.toFixed(6)}`;

async function osrmJson(path, signal) {
  let lastError;
  for (const base of OSRM_BASES) {
    try {
      const res = await fetch(`${base}${path}`, { signal });
      if (!res.ok) throw new Error(`Routing HTTP ${res.status}`);
      const data = await res.json();
      if (data.code !== 'Ok') throw new Error(data.code || 'Routing error');
      return data;
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      lastError = err;
    }
  }
  throw lastError || new Error('Routing unavailable');
}

async function osrmRoutes(points, signal, alternatives = false) {
  const path = `/route/v1/driving/${points.map(lonLat).join(';')}?overview=full&geometries=geojson&steps=false&alternatives=${alternatives ? 3 : 'false'}`;
  const data = await osrmJson(path, signal);
  return (data.routes || [])
    .filter((r) => r?.geometry?.coordinates?.length >= 2)
    .map((r) => ({
      coords: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      duration: r.duration,
      distance: r.distance,
    }));
}

/** Snap an arbitrary point to the nearest driveable road so detour via-points never create spurs. */
async function snapToRoad(point, signal) {
  try {
    const data = await osrmJson(`/nearest/v1/driving/${lonLat(point)}?number=1`, signal);
    const loc = data?.waypoints?.[0]?.location;
    return loc ? [loc[1], loc[0]] : null;
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return null;
  }
}

/* ---------- incident evaluation ---------- */
function scoreRoute(route, closed, slow) {
  const blockedBy = closed.filter((seg) => routeNearSegment(route.coords, seg, CLOSURE_RADIUS_M));
  let penalty = 0;
  const avgSpeed = route.duration > 0 ? route.distance / route.duration : 8; // m/s
  for (const s of slow) {
    if (routeNearSegment(route.coords, s.segment, CLOSURE_RADIUS_M)) {
      const exposedM = Math.min(segmentLengthM(s.segment), 600);
      penalty += (exposedM / avgSpeed) * Math.max(0, s.factor - 1);
    }
  }
  return { ...route, blockedBy, cost: route.duration + penalty };
}

function pickBest(routes) {
  const clear = routes.filter((r) => r.blockedBy.length === 0).sort((a, b) => a.cost - b.cost);
  return clear[0] || null;
}

/**
 * Resolves the direct, shortest road-following route from start to destination on paved roads.
 *
 * @param {{start:[number,number], end:[number,number],
 *          closed?: Array<[[number,number],[number,number]]>,
 *          slow?: Array<{segment:[[number,number],[number,number]], factor:number}>}} req
 * @returns {Promise<{coords:Array<[number,number]>, status:'ok'|'rerouted'|'blocked', distanceM:number, durationSec:number}>}
 */
export async function fetchRoadRoute({ start, end, closed = [], slow = [] }, signal) {
  const key = JSON.stringify([start, end, closed, slow.map((s) => [s.segment, s.factor])]);
  if (cache.has(key)) return cache.get(key);

  const hasIncidents = closed.length > 0 || slow.length > 0;
  const base = (await osrmRoutes([start, end], signal, hasIncidents)).map((r) => scoreRoute(r, closed, slow));

  if (base.length === 0) throw new Error('No route found');

  let result;
  const best = pickBest(base);
  if (best) {
    // Direct fastest route along the road (or alternate if first was penalized by incident)
    result = {
      coords: best.coords,
      status: best === base[0] ? 'ok' : 'rerouted',
      distanceM: Math.round(best.distance || 0),
      durationSec: Math.round(best.duration || 0),
    };
  } else {
    // Every alternative crosses a closure: generate detours on either side of the blocked road
    const hit = base[0].blockedBy[0];
    const refLat = hit[0][0];
    const [ax, ay] = toXY(hit[0], refLat);
    const [bx, by] = toXY(hit[1], refLat);
    const len = Math.max(1, Math.hypot(bx - ax, by - ay));
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const mid = [(hit[0][0] + hit[1][0]) / 2, (hit[0][1] + hit[1][1]) / 2];
    const cands = [];
    for (const off of DETOUR_OFFSETS_M) {
      for (const sign of [1, -1]) {
        cands.push([
          mid[0] + (sign * off * ny) / M_PER_DEG_LAT,
          mid[1] + (sign * off * nx) / mPerDegLon(refLat),
        ]);
      }
    }
    const snapped = (await Promise.all(cands.map((c) => snapToRoad(c, signal)))).filter(Boolean);
    const detours = (
      await Promise.all(
        snapped.map((via) => osrmRoutes([start, via, end], signal).catch((e) => {
          if (e?.name === 'AbortError') throw e;
          return [];
        }))
      )
    )
      .flat()
      .map((r) => scoreRoute(r, closed, slow));
    const detour = pickBest(detours);
    const chosen = detour || base.sort((a, b) => a.cost - b.cost)[0];
    result = {
      coords: chosen.coords,
      status: detour ? 'rerouted' : 'blocked',
      distanceM: Math.round(chosen.distance || 0),
      durationSec: Math.round(chosen.duration || 0),
    };
  }

  // Make the line start/end exactly at the ambulance and hospital markers.
  result = { ...result, coords: [start, ...result.coords, end] };
  cache.set(key, result);
  return result;
}
