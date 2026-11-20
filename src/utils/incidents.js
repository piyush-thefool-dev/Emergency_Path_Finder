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

export function edgeDisplayName(edge) {
  if (!edge) return 'Road segment';
  return edge.name || `${String(edge.roadType || 'Road').replace(/_/g, ' ')} (${edge.lengthM} m)`;
}

export function timeAgo(isoString) {
  if (!isoString) return '';
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} h ago`;
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
    list.push({
      edgeId,
      edge,
      level,
      name: edgeDisplayName(edge),
      reportedBy: info.reportedBy || 'Dispatcher',
      timestamp: info.timestamp,
      point: a && b ? { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 } : null,
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
