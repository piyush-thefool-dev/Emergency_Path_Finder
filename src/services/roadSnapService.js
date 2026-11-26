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

export const VALHALLA_BASES = [
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VALHALLA_URL) || '',
  'https://valhalla1.openstreetmap.de',
].filter(Boolean);

export const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car';

import { isOffline, markNetworkFailure } from '../utils/network.js';

const CLOSURE_RADIUS_M = 35;
const DETOUR_OFFSETS_M = [140, 280, 550, 950];
const cache = new Map();

/** Extracts evenly spaced intermediate waypoints from a fallback graph path for OSRM detour routing. */
export function extractWaypointsForRoadDetour(coords = [], maxVia = 4) {
  if (!Array.isArray(coords) || coords.length <= 2) return [];
  const interior = coords.slice(1, -1);
  if (interior.length <= maxVia) return interior;
  const out = [];
  for (let i = 0; i < maxVia; i++) {
    const idx = Math.min(interior.length - 1, Math.round((i * (interior.length - 1)) / Math.max(1, maxVia - 1)));
    out.push(interior[idx]);
  }
  return out;
}

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

/** Samples points every ~15 m along any polyline segment (2+ points, inclusive of ends). */
function sampleSegment(seg) {
  if (!Array.isArray(seg) || seg.length < 2) return [];
  const out = [];
  for (let p = 0; p < seg.length - 1; p++) {
    const a = seg[p];
    const b = seg[p + 1];
    const refLat = (a[0] + b[0]) / 2;
    const [ax, ay] = toXY(a, refLat);
    const [bx, by] = toXY(b, refLat);
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 15));
    const startIdx = p === 0 ? 0 : 1;
    for (let i = startIdx; i <= n; i++) {
      out.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
    }
  }
  return out;
}

/** True when any part of `segment` lies within `radiusM` of the route polyline. */
function routeNearSegment(coords, segment, radiusM) {
  const samples = sampleSegment(segment);
  if (samples.length === 0 || !Array.isArray(coords) || coords.length < 2) return false;
  const refLat = samples[0][0];
  const xy = coords.map((c) => toXY(c, refLat));
  for (const sample of samples) {
    const p = toXY(sample, refLat);
    for (let i = 0; i < xy.length - 1; i++) {
      if (pointToSegmentM(p, xy[i], xy[i + 1]) <= radiusM) return true;
    }
  }
  return false;
}

function segmentLengthM(seg) {
  if (!Array.isArray(seg) || seg.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < seg.length - 1; i++) {
    const a = seg[i];
    const b = seg[i + 1];
    const refLat = (a[0] + b[0]) / 2;
    const [ax, ay] = toXY(a, refLat);
    const [bx, by] = toXY(b, refLat);
    total += Math.hypot(bx - ax, by - ay);
  }
  return total;
}

/** Builds ORS avoid_polygons rectangles around closed street segments, omitting any box that swallows start/end. */
export function buildAvoidCorridorPolygons(closedSegments = [], start = null, end = null) {
  const polygons = [];
  const halfWidthM = 28;
  const pad = 12;

  for (const seg of closedSegments) {
    if (!Array.isArray(seg) || seg.length < 2) continue;
    const a = seg[0];
    const b = seg[seg.length - 1];
    const refLat = (a[0] + b[0]) / 2;
    const mLon = mPerDegLon(refLat);

    // Skip if polygon directly overlaps ambulance origin or hospital pin so ORS won't HTTP-400
    const endpointsNear = [start, end].some((pt) => {
      if (!pt) return false;
      const pxy = toXY(pt, refLat);
      for (const s of sampleSegment(seg)) {
        const sxy = toXY(s, refLat);
        if (Math.hypot(pxy[0] - sxy[0], pxy[1] - sxy[1]) <= halfWidthM + pad + 8) return true;
      }
      return false;
    });
    if (endpointsNear) continue;

    const ax = a[1] * mLon;
    const ay = a[0] * M_PER_DEG_LAT;
    const bx = b[1] * mLon;
    const by = b[0] * M_PER_DEG_LAT;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy * halfWidthM;
    const ny = ux * halfWidthM;
    const p1 = [(ax - ux * pad + nx) / mLon, (ay - uy * pad + ny) / M_PER_DEG_LAT];
    const p2 = [(bx + ux * pad + nx) / mLon, (by + uy * pad + ny) / M_PER_DEG_LAT];
    const p3 = [(bx + ux * pad - nx) / mLon, (by + uy * pad - ny) / M_PER_DEG_LAT];
    const p4 = [(ax - ux * pad - nx) / mLon, (ay - uy * pad - ny) / M_PER_DEG_LAT];
    polygons.push([p1, p2, p3, p4, p1]);
  }
  return polygons;
}

/* ---------- Polyline Decoder (Precision 5 and 6) ---------- */
export function decodePolyline(str, precision = 6) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

export const STADIA_VALHALLA_BASE = 'https://api.stadiamaps.com/route/v1';

/* ---------- Valhalla Emergency Priority Route Query ---------- */
async function valhallaRoutes(points, signal) {
  if (isOffline()) return [];
  const stadiaKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STADIA_API_KEY) || '';
  const bases = [
    stadiaKey ? `${STADIA_VALHALLA_BASE}?api_key=${encodeURIComponent(stadiaKey)}` : null,
    ...VALHALLA_BASES,
  ].filter(Boolean);

  for (const base of bases) {
    if (isOffline()) break;
    try {
      const payload = {
        locations: points.map(([lat, lon]) => ({ lat, lon })),
        costing: 'auto',
        costing_options: {
          auto: {
            ignore_oneways: true,        // Emergency ambulance priority exemption
            ignore_restrictions: true,   // Emergency ambulance priority exemption
            use_highways: 1.0,           // Prioritize fast arterial corridors
          },
        },
        directions_options: { units: 'kilometers' },
      };
      const endpoint = base.includes('?') ? base : `${base}/route`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });
      if (!res.ok) continue;
      const data = await res.json();
      const trip = data.trip;
      if (!trip || !trip.legs) continue;
      const leg = trip.legs[0];
      const coords = decodePolyline(leg.shape, 6);
      if (coords.length >= 2) {
        return [{
          coords,
          duration: trip.summary.time || 0,
          distance: (trip.summary.length || 0) * 1000,
          engine: stadiaKey ? 'Stadia Maps Valhalla (Ambulance Priority)' : 'Valhalla (Ambulance Priority Costing)',
        }];
      }
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      markNetworkFailure(err);
    }
  }
  return [];
}

/* ---------- OpenRouteService (ORS) Route Query (with avoid_polygons) ---------- */
async function orsRoutes(points, closedSegments = [], signal) {
  if (isOffline()) return [];
  const orsKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ORS_API_KEY) || '';
  if (!orsKey) return [];
  try {
    const coords = points.map(([lat, lon]) => [lon, lat]);
    const body = {
      coordinates: coords,
      radiuses: [-1, -1],
    };

    // If manual incident closures exist, build safe narrow corridor polygons (~28m half-width)
    if (closedSegments.length > 0) {
      const polygons = buildAvoidCorridorPolygons(closedSegments, coordinates[0], coordinates[coordinates.length - 1]);
      if (polygons.length > 0) {
        body.options = {
          avoid_polygons: {
            type: 'MultiPolygon',
            coordinates: polygons.map((poly) => [poly]),
          },
        };
      }
    }

    const res = await fetch(ORS_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: orsKey,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route?.geometry) return [];
    const decoded = decodePolyline(route.geometry, 5);
    return [{
      coords: decoded,
      duration: route.summary?.duration || 0,
      distance: route.summary?.distance || 0,
      engine: 'OpenRouteService (avoid_polygons)',
    }];
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    markNetworkFailure(err);
    return [];
  }
}

/* ---------- OSRM calls ---------- */
const lonLat = ([lat, lon]) => `${lon.toFixed(6)},${lat.toFixed(6)}`;

async function osrmJson(path, signal) {
  if (isOffline()) throw new Error('Offline (Network disconnected)');
  let lastError;
  for (const base of OSRM_BASES) {
    if (isOffline()) break;
    try {
      const res = await fetch(`${base}${path}`, { signal });
      if (!res.ok) throw new Error(`Routing HTTP ${res.status}`);
      const data = await res.json();
      if (data.code !== 'Ok') throw new Error(data.code || 'Routing error');
      return data;
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      markNetworkFailure(err);
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
      engine: 'OSRM',
    }));
}

/** Snaps GPS coordinate traces to road centerlines using OSRM /match or /nearest. */
export async function matchGpsCoordinates(points, signal) {
  if (!points || points.length === 0 || isOffline()) return null;
  if (points.length === 1) {
    return snapToRoad(points[0], signal);
  }
  try {
    const path = `/match/v1/driving/${points.map(lonLat).join(';')}?overview=full&geometries=geojson`;
    const data = await osrmJson(path, signal);
    const matchedCoords = data?.matchings?.[0]?.geometry?.coordinates;
    if (matchedCoords && matchedCoords.length > 0) {
      return matchedCoords.map(([lon, lat]) => [lat, lon]);
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
  }
  return null;
}

/** Snap an arbitrary point to the nearest driveable road so detour via-points never create spurs. */
async function snapToRoad(point, signal) {
  if (isOffline()) return null;
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
export async function fetchRoadRoute({ start, end, closed = [], slow = [], detourWaypoints = [] }, signal) {
  if (isOffline()) {
    throw new Error('Offline (Using local graph route)');
  }
  const key = JSON.stringify([start, end, closed, slow.map((s) => [s.segment, s.factor])]);
  if (cache.has(key)) return cache.get(key);

  const hasIncidents = closed.length > 0 || slow.length > 0;
  let rawRoutes = [];

  const orsKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ORS_API_KEY) || '';

  // Tier 1: Try Valhalla emergency priority routing (handles one-way exemptions & expressway preference)
  try {
    const vRoutes = await valhallaRoutes([start, end], signal);
    rawRoutes.push(...vRoutes);
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
  }

  // Tier 2: Try OpenRouteService if API key configured (native avoid_polygons around closed roads)
  if (orsKey && (rawRoutes.length === 0 || closed.length > 0)) {
    try {
      const oRoutes = await orsRoutes([start, end], closed, signal);
      rawRoutes.push(...oRoutes);
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
    }
  }

  // Tier 3: OSRM primary & mirrors (ALWAYS include alternatives when incidents exist so blocked routes can detour)
  if (rawRoutes.length === 0 || hasIncidents) {
    try {
      const oAltRoutes = await osrmRoutes([start, end], signal, hasIncidents);
      rawRoutes.push(...oAltRoutes);
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      if (rawRoutes.length === 0) throw e;
    }
  }

  const base = rawRoutes.map((r) => scoreRoute(r, closed, slow));

  if (base.length === 0) throw new Error('No route found');

  let result;
  const best = pickBest(base);
  if (best) {
    // Direct fastest route along the road (or alternate if primary corridor was blocked/penalized)
    result = {
      coords: best.coords,
      status: hasIncidents && best !== base[0] ? 'rerouted' : 'ok',
      distanceM: Math.round(best.distance || 0),
      durationSec: Math.round(best.duration || 0),
    };
  } else {
    // Every direct route crosses a closure: try graph detour waypoints + perpendicular bypasses around blocked segment
    const hit = base[0].blockedBy[0];
    const hitStart = hit[0];
    const hitEnd = hit[hit.length - 1];
    const midPt = hit[Math.floor(hit.length / 2)];
    const refLat = midPt[0];
    const [ax, ay] = toXY(hitStart, refLat);
    const [bx, by] = toXY(hitEnd, refLat);
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.max(1, Math.hypot(dx, dy));
    // Perpendicular unit vector (-dy/len, dx/len)
    const nx = -dy / len;
    const ny = dx / len;
    const cands = [];
    for (const off of DETOUR_OFFSETS_M) {
      for (const sign of [1, -1]) {
        cands.push([
          midPt[0] + (sign * off * ny) / M_PER_DEG_LAT,
          midPt[1] + (sign * off * nx) / mPerDegLon(refLat),
        ]);
      }
    }
    const graphVia = extractWaypointsForRoadDetour(detourWaypoints, 4);
    const snapped = (await Promise.all(cands.map((c) => snapToRoad(c, signal))))
      .filter(Boolean)
      .filter((via) => !closed.some((seg) => routeNearSegment([via, via], seg, CLOSURE_RADIUS_M)));
    const waypointBatches = [
      ...snapped.map((via) => [start, via, end]),
      ...(graphVia.length > 0 ? [[start, ...graphVia, end]] : []),
    ];
    const detours = (
      await Promise.all(
        waypointBatches.map((pts) => osrmRoutes(pts, signal).catch((e) => {
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
