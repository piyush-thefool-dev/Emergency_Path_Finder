/**
 * Shared Road Corridor, Incident Geometry, and OSRM Routing Hook.
 * Extracted cleanly so both Mobile & Desktop 3D Map views share exact routing and telemetry logic.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchRoadRoute } from '../services/roadSnapService.js';
import { isOffline } from '../utils/network.js';
import { TRAFFIC_LEVEL_LIST } from '../config/trafficLevels.js';
import {
  buildIncidentList,
  edgeDisplayName,
  extractLocalStreetSegment,
  resolveIncidentForEdge,
} from '../utils/incidents.js';

export function useRouteCorridor({
  nodes = [],
  edges = [],
  activePathNodeIds = [],
  incidents = new Map(),
  routeStart = null,
  routeEnd = null,
  onRoadResolved = null,
}) {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [roadRoute, setRoadRoute] = useState(null);

  // Road graph topology segments with closed/slowdown flags
  const networkSegments = useMemo(
    () =>
      edges
        .map((edge) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;

          const incident = resolveIncidentForEdge(edge.id, incidents);
          const isClosed = Boolean(edge.closed || incident?.closed);
          const hasSlowdown = Boolean(incident?.slowdownFactor > 1);

          return {
            edge,
            positions: [
              [fromNode.lat, fromNode.lon],
              [toNode.lat, toNode.lon],
            ],
            isClosed,
            hasSlowdown,
          };
        })
        .filter(Boolean),
    [edges, nodeMap, incidents]
  );

  // Active graph corridor coordinates
  const activeRouteCoords = useMemo(() => {
    const coords = [];
    if (Array.isArray(activePathNodeIds) && activePathNodeIds.length > 1) {
      for (const nodeId of activePathNodeIds) {
        const node = nodeMap.get(nodeId);
        if (node && typeof node.lat === 'number' && typeof node.lon === 'number') {
          coords.push([node.lat, node.lon]);
        }
      }
    }
    return coords;
  }, [activePathNodeIds, nodeMap]);

  // Localized street strips for reported traffic incidents
  const incidentOverlays = useMemo(() => {
    const items = buildIncidentList(incidents, edges, nodes);
    const overlays = [];
    for (const item of items) {
      const fromNode = item.edge ? nodeMap.get(item.edge.from) : null;
      const toNode = item.edge ? nodeMap.get(item.edge.to) : null;
      const rawPositions =
        fromNode && toNode
          ? [
              [fromNode.lat, fromNode.lon],
              [toNode.lat, toNode.lon],
            ]
          : null;
      let positions =
        Array.isArray(item.streetSegment) && item.streetSegment.length >= 2
          ? item.streetSegment
          : null;
      let point = item.point ? [item.point.lat, item.point.lon] : null;
      if (!positions && rawPositions) {
        const clipPt = item.point || {
          lat: (rawPositions[0][0] + rawPositions[1][0]) / 2,
          lon: (rawPositions[0][1] + rawPositions[1][1]) / 2,
        };
        const clipped = extractLocalStreetSegment(rawPositions, clipPt, 45);
        positions = clipped?.streetSegment || rawPositions;
        if (!point && clipped?.point) point = clipped.point;
      }
      if (!positions || positions.length < 2) continue;
      if (!point) {
        point = positions[Math.floor(positions.length / 2)];
      }
      overlays.push({ ...item, positions, badgePoint: point });
    }
    for (const { edge, positions } of networkSegments) {
      if (!edge.closed) continue;
      if (resolveIncidentForEdge(edge.id, incidents)) continue;
      const mid = [
        (positions[0][0] + positions[1][0]) / 2,
        (positions[0][1] + positions[1][1]) / 2,
      ];
      const clipped = extractLocalStreetSegment(positions, mid, 45);
      overlays.push({
        edgeId: edge.id,
        edge,
        level: TRAFFIC_LEVEL_LIST[3],
        name: edgeDisplayName(edge),
        positions: clipped?.streetSegment || positions,
        badgePoint: mid,
        staticClosed: true,
      });
    }
    return overlays;
  }, [incidents, edges, nodes, nodeMap, networkSegments]);

  const { closedSegs, slowSegs, incidentKey } = useMemo(() => {
    const closed = [];
    const slow = [];
    for (const item of incidentOverlays) {
      if (item.level?.closed || item.staticClosed) closed.push(item.positions);
      else if (item.level?.factor > 1) slow.push({ segment: item.positions, factor: item.level.factor });
    }
    return {
      closedSegs: closed,
      slowSegs: slow,
      incidentKey: JSON.stringify([closed, slow]),
    };
  }, [incidentOverlays]);

  const q = (v) => Math.round(v * 1e4) / 1e4;
  const startPt =
    routeStart?.lat != null ? [q(routeStart.lat), q(routeStart.lon)] : activeRouteCoords[0] || null;
  const endPt =
    routeEnd?.lat != null
      ? [routeEnd.lat, routeEnd.lon]
      : activeRouteCoords[activeRouteCoords.length - 1] || null;

  const hasRoute = Boolean(startPt && endPt);
  const detourSig = closedSegs.length > 0 || slowSegs.length > 0 ? activeRouteCoords.length : 0;
  const routeKey = hasRoute ? JSON.stringify([startPt, endPt, incidentKey, detourSig]) : '';

  const fallbackCoords = useMemo(() => {
    if (activeRouteCoords.length > 1) {
      const pts = [...activeRouteCoords];
      if (
        startPt &&
        (Math.abs(pts[0][0] - startPt[0]) > 0.0001 || Math.abs(pts[0][1] - startPt[1]) > 0.0001)
      ) {
        pts.unshift(startPt);
      }
      if (
        endPt &&
        (Math.abs(pts[pts.length - 1][0] - endPt[0]) > 0.0001 ||
          Math.abs(pts[pts.length - 1][1] - endPt[1]) > 0.0001)
      ) {
        pts.push(endPt);
      }
      return pts;
    }
    if (startPt && endPt) return [startPt, endPt];
    return [];
  }, [activeRouteCoords, startPt, endPt]);

  const displayCoords =
    roadRoute?.coords && roadRoute.coords.length > 1 ? roadRoute.coords : fallbackCoords;

  const latest = useRef(null);
  const timer = useRef(null);
  const controller = useRef(null);
  const lastFired = useRef(0);
  const prevIncidentKey = useRef(incidentKey);
  latest.current = {
    start: startPt,
    end: endPt,
    closed: closedSegs,
    slow: slowSegs,
    detourWaypoints: activeRouteCoords,
  };

  useEffect(() => {
    if (!routeKey || isOffline()) return;
    const incidentChanged = prevIncidentKey.current !== incidentKey;
    prevIncidentKey.current = incidentKey;
    if (incidentChanged && timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (timer.current) return;
    const wait = incidentChanged ? 60 : Math.max(300, 1500 - (Date.now() - lastFired.current));
    timer.current = setTimeout(() => {
      timer.current = null;
      lastFired.current = Date.now();
      controller.current?.abort();
      controller.current = new AbortController();
      fetchRoadRoute(latest.current, controller.current.signal)
        .then((res) => {
          setRoadRoute(res);
          if (typeof onRoadResolved === 'function') {
            onRoadResolved(
              res ? { ...res, hospitalId: routeEnd?.id, closedCount: closedSegs.length } : null
            );
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            setRoadRoute(null);
            if (typeof onRoadResolved === 'function') {
              onRoadResolved(
                closedSegs.length > 0 && activePathNodeIds.length <= 1
                  ? {
                      status: 'blocked',
                      hospitalId: routeEnd?.id,
                      closedCount: closedSegs.length,
                      coords: [],
                      distanceM: 0,
                      durationSec: 0,
                    }
                  : null
              );
            }
          }
        });
    }, wait);
  }, [routeKey, onRoadResolved]);

  useEffect(() => {
    if (!isOffline() || !routeEnd?.id || closedSegs.length === 0 || activePathNodeIds.length > 1) return;
    if (typeof onRoadResolved === 'function') {
      onRoadResolved({
        status: 'blocked',
        hospitalId: routeEnd.id,
        closedCount: closedSegs.length,
        coords: [],
        distanceM: 0,
        durationSec: 0,
      });
    }
  }, [routeEnd?.id, closedSegs.length, activePathNodeIds.length, onRoadResolved]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      timer.current = null;
      controller.current?.abort();
    },
    []
  );

  return {
    nodeMap,
    networkSegments,
    activeRouteCoords,
    incidentOverlays,
    roadRoute,
    displayCoords,
    isBlocked: roadRoute?.status === 'blocked',
  };
}

export default useRouteCorridor;
