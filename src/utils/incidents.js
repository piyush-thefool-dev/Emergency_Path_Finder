/**
 * Helpers for road incident reports.
 */

import { levelOfIncident } from '../config/trafficLevels.js';

const M_PER_DEG_LAT = 111320;

/**
 * Finds the road segment closest to a point.
 * Returns { edge, distanceM, midpoint } or null if nothing is within maxDistanceM.
 */
export function findNearestEdge(edges, nodes, point, maxDistanceM = 400) {
  if (!point || point.lat == null || point.lon == null) return null;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const mPerDegLon = M_PER_DEG_LAT * Math.cos((point.lat * Math.PI) / 180);

  let best = null;
  for (const edge of edges) {
    const a = nodeMap.get(edge.from);
    const b = nodeMap.get(edge.to);
    if (!a || !b) continue;

    // Flat-earth maths is accurate enough over a few hundred metres.
    const ax = (a.lon - point.lon) * mPerDegLon;
    const ay = (a.lat - point.lat) * M_PER_DEG_LAT;
    const bx = (b.lon - point.lon) * mPerDegLon;
    const by = (b.lat - point.lat) * M_PER_DEG_LAT;
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq));
    const px = ax + t * dx;
    const py = ay + t * dy;
    const dist = Math.sqrt(px * px + py * py);

    if (!best || dist < best.distanceM) {
      best = {
        edge,
        distanceM: dist,
        midpoint: { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 },
      };
    }
  }
  return best && best.distanceM <= maxDistanceM ? best : null;
}

function prettifyToken(tok) {
  if (!tok) return '';
  const cleaned = tok
    .replace(/\s*\(Reverse\)\s*$/i, '')
    .replace(/^(?:osm|n)_/i, '')
    .replace(/_/g, ' ')
    .replace(/\bkp(\d+)\b/gi, (_, d) => `Knowledge Park ${d}`)
    .replace(/\bdtc\b/gi, 'DTC')
    .replace(/\bpari\b/gi, 'Pari Chowk')
    .replace(/\bgbu\b/gi, 'GBU')
    .replace(/\bglbajaj\b/gi, 'GL Bajaj')
    .replace(/\biimt\b/gi, 'IIMT')
    .trim();
  return cleaned.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export function edgeDisplayName(edge) {
  if (!edge) return 'Road segment';
  const raw = edge.name;
  if (!raw) return `${String(edge.roadType || 'Road').replace(/_/g, ' ')} (${edge.lengthM} m)`;
  // Format internal machine-generated node-pair names (e.g. "n_kp3_north to osm_kp3_center (Reverse)")
  if (/^(?:osm|n)_/i.test(raw) || /\b(?:osm|n)_[a-z0-9_]+/i.test(raw)) {
    const parts = raw.replace(/\s*\(Reverse\)\s*$/i, '').split(/\s+to\s+/i);
    if (parts.length === 2) {
      return `${prettifyToken(parts[0])} – ${prettifyToken(parts[1])}`;
    }
    return prettifyToken(raw);
  }
  return raw;
}

export function timeAgo(isoString) {
  if (!isoString) return '';
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} h ago`;
}

/**
 * Resolves edge IDs representing the same physical street corridor (forward + reverse pair).
 */
export function findPairedEdgeIds(edgeId, edges = []) {
  if (!edgeId) return [];
  const primary = edges.find((e) => e.id === edgeId);
  if (!primary) return [edgeId];
  const ids = new Set([edgeId]);
  for (const e of edges) {
    if (
      (e.from === primary.from && e.to === primary.to) ||
      (e.from === primary.to && e.to === primary.from)
    ) {
      ids.add(e.id);
    }
  }
  return Array.from(ids);
}

/**
 * Finds the active incident affecting `edgeId` (directly or via a paired reverse edge).
 */
export function resolveIncidentForEdge(edgeId, incidents) {
  if (!incidents || !edgeId) return null;
  const direct = incidents.get(edgeId);
  if (direct) return direct;
  for (const info of incidents.values()) {
    if (Array.isArray(info?.linkedEdgeIds) && info.linkedEdgeIds.includes(edgeId)) {
      return info;
    }
  }
  return null;
}

function distM(a, b) {
  const mLon = M_PER_DEG_LAT * Math.cos(((a[0] + b[0]) / 2 * Math.PI) / 180);
  return Math.hypot((b[1] - a[1]) * mLon, (b[0] - a[0]) * M_PER_DEG_LAT);
}

/**
 * Extracts a short paved-street sub-segment (<= ~2*halfLenM) centered around the projected click point.
 * Prevents sparse graph edges (600-900m chords) from cutting diagonally across buildings on the map.
 */
export function extractLocalStreetSegment(polylineCoords, point, halfLenM = 42) {
  if (!Array.isArray(polylineCoords) || polylineCoords.length < 2 || !point) return null;
  const pLat = Array.isArray(point) ? point[0] : point.lat;
  const pLon = Array.isArray(point) ? point[1] : (point.lon ?? point.lng);
  if (pLat == null || pLon == null) return null;

  const mLon = M_PER_DEG_LAT * Math.cos((pLat * Math.PI) / 180);
  let bestIdx = 0;
  let bestT = 0;
  let bestDist = Infinity;
  let snapped = polylineCoords[0];

  for (let i = 0; i < polylineCoords.length - 1; i++) {
    const a = polylineCoords[i];
    const b = polylineCoords[i + 1];
    const ax = (a[1] - pLon) * mLon;
    const ay = (a[0] - pLat) * M_PER_DEG_LAT;
    const bx = (b[1] - pLon) * mLon;
    const by = (b[0] - pLat) * M_PER_DEG_LAT;
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq));
    const px = ax + t * dx;
    const py = ay + t * dy;
    const d = Math.hypot(px, py);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
      bestT = t;
      snapped = [
        a[0] + t * (b[0] - a[0]),
        a[1] + t * (b[1] - a[1]),
      ];
    }
  }

  // Walk backward up to halfLenM from snapped point
  const backPts = [];
  let remBack = halfLenM;
  let prev = snapped;
  for (let i = bestIdx; i >= 0 && remBack > 0; i--) {
    const target = polylineCoords[i];
    const segLen = distM(prev, target);
    if (segLen >= remBack && segLen > 0) {
      const r = remBack / segLen;
      backPts.unshift([prev[0] + r * (target[0] - prev[0]), prev[1] + r * (target[1] - prev[1])]);
      remBack = 0;
    } else if (segLen > 0.2) {
      backPts.unshift(target);
      remBack -= segLen;
      prev = target;
    }
    if (bestT === 0 && i === bestIdx) continue;
  }

  // Walk forward up to halfLenM from snapped point
  const fwdPts = [];
  let remFwd = halfLenM;
  prev = snapped;
  for (let i = bestIdx + 1; i < polylineCoords.length && remFwd > 0; i++) {
    const target = polylineCoords[i];
    const segLen = distM(prev, target);
    if (segLen >= remFwd && segLen > 0) {
      const r = remFwd / segLen;
      fwdPts.push([prev[0] + r * (target[0] - prev[0]), prev[1] + r * (target[1] - prev[1])]);
      remFwd = 0;
    } else if (segLen > 0.2) {
      fwdPts.push(target);
      remFwd -= segLen;
      prev = target;
    }
  }

  const streetSegment = [...backPts, snapped, ...fwdPts];
  if (streetSegment.length < 2) {
    streetSegment.push(polylineCoords[Math.min(bestIdx + 1, polylineCoords.length - 1)]);
  }
  let lengthM = 0;
  for (let i = 0; i < streetSegment.length - 1; i++) {
    lengthM += distM(streetSegment[i], streetSegment[i + 1]);
  }
  return {
    point: snapped,
    distanceM: bestDist,
    streetSegment,
    lengthM: Math.round(lengthM),
  };
}

/** Turns the incidents Map into a sorted list with road names and levels attached. */
export function buildIncidentList(incidents, edges, nodes) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const list = [];
  for (const [edgeId, info] of incidents.entries()) {
    const edge = edges.find((e) => e.id === edgeId);
    const level = levelOfIncident(info);
    if (!level) continue;
    const a = edge ? nodeMap.get(edge.from) : null;
    const b = edge ? nodeMap.get(edge.to) : null;
    let point = null;
    if (Array.isArray(info.point) && info.point.length >= 2) {
      point = { lat: info.point[0], lon: info.point[1] };
    } else if (info.point && typeof info.point.lat === 'number') {
      point = { lat: info.point.lat, lon: info.point.lon ?? info.point.lng };
    } else if (a && b) {
      point = { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 };
    }
    list.push({
      edgeId,
      edge,
      level,
      name: info.roadName || edgeDisplayName(edge),
      reportedBy: info.reportedBy || 'Dispatcher',
      timestamp: info.timestamp,
      point,
      streetSegment: info.streetSegment || null,
    });
  }
  return list.sort((x, y) => new Date(y.timestamp || 0) - new Date(x.timestamp || 0));
}

/** Count of active reports per level id, e.g. { heavy: 2, closure: 1 }. */
export function countByLevel(list) {
  const out = {};
  for (const item of list) out[item.level.id] = (out[item.level.id] || 0) + 1;
  return out;
}
