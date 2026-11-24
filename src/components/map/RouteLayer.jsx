/**
 * Route and Road Network Layer for Leaflet Map.
 *
 * Renders:
 *   - Base road network geometry
 *   - The optimal ambulance route polyline
 *   - Real-time incident blockages (red dashed overlay)
 *   - Intersection junction dots
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Polyline, CircleMarker, Tooltip, Marker, Popup } from 'react-leaflet';
import { fetchRoadRoute } from '../../services/roadSnapService.js';
import { isOffline } from '../../utils/network.js';
import { TRAFFIC_LEVEL_LIST, levelOfIncident } from '../../config/trafficLevels.js';
import { edgeDisplayName, timeAgo } from '../../utils/incidents.js';

/** Round badge shown in the middle of every reported road segment. */
function badgeIcon(level) {
  return L.divIcon({
    className: 'traffic-badge-wrap',
    html: `<div class="traffic-badge" style="background:${level.color}">${level.symbol}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export function RouteLayer({
  nodes = [],
  edges = [],
  activePathNodeIds = [],
  incidents = new Map(),
  onSelectEdge,
  onAddIncident,
  onRemoveIncident,
  routeStart = null, // live ambulance position {lat, lon}
  routeEnd = null, // active hospital {lat, lon}
  onRoadResolved = null,
  showAllNodes = false,
  showGraphEdges = false,
}) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Road the user tapped: { edgeId, latlng } -> shows the report popup.
  const [picker, setPicker] = useState(null);
  const canReport = typeof onAddIncident === 'function';

  const handleRoadClick = (edge, latlng) => {
    if (canReport) setPicker({ edgeId: edge.id, latlng: [latlng.lat, latlng.lng] });
    else if (onSelectEdge) onSelectEdge(edge.id);
  };

  // Build coordinate lines for all edges
  const networkSegments = edges.map((edge) => {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) return null;

    const incident = incidents.get(edge.id);
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
  }).filter(Boolean);

  // Build polyline coordinates for the active route
  const activeRouteCoords = [];
  if (Array.isArray(activePathNodeIds) && activePathNodeIds.length > 1) {
    for (const nodeId of activePathNodeIds) {
      const node = nodeMap.get(nodeId);
      if (node && typeof node.lat === 'number' && typeof node.lon === 'number') {
        activeRouteCoords.push([node.lat, node.lon]);
      }
    }
  }

  // Incident geometry (closures to avoid, congestion to penalise) for the road router.
  const { closedSegs, slowSegs, incidentKey } = useMemo(() => {
    const closed = [];
    const slow = [];
    for (const { edge, positions, isClosed, hasSlowdown } of networkSegments) {
      if (isClosed) closed.push(positions);
      else if (hasSlowdown) slow.push({ segment: positions, factor: incidents.get(edge.id)?.slowdownFactor || 4 });
    }
    return { closedSegs: closed, slowSegs: slow, incidentKey: JSON.stringify([closed, slow]) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, nodes, incidents]);

  // Start = the ambulance's live position (not its snapped graph node); end = the hospital.
  // Quantised to ~11 m so GPS jitter does not trigger a request for every tiny movement.
  const q = (v) => Math.round(v * 1e4) / 1e4;
  const startPt = routeStart?.lat != null ? [q(routeStart.lat), q(routeStart.lon)] : activeRouteCoords[0] || null;
  const endPt = routeEnd?.lat != null ? [routeEnd.lat, routeEnd.lon] : activeRouteCoords[activeRouteCoords.length - 1] || null;

  // Active route exists as long as startPt and endPt (or at least 2 path points) are defined
  const hasRoute = Boolean(startPt && endPt);
  const routeKey = hasRoute ? JSON.stringify([startPt, endPt, incidentKey]) : '';

  // Last good road route is kept while a new one loads, so the line never flickers while moving.
  const [roadRoute, setRoadRoute] = useState(null); // { coords, status, distanceM, durationSec } | null

  // High-fidelity fallback coordinates connecting ambulance to destination
  const fallbackCoords = useMemo(() => {
    if (activeRouteCoords.length > 1) {
      const pts = [...activeRouteCoords];
      if (startPt && (Math.abs(pts[0][0] - startPt[0]) > 0.0001 || Math.abs(pts[0][1] - startPt[1]) > 0.0001)) {
        pts.unshift(startPt);
      }
      if (endPt && (Math.abs(pts[pts.length - 1][0] - endPt[0]) > 0.0001 || Math.abs(pts[pts.length - 1][1] - endPt[1]) > 0.0001)) {
        pts.push(endPt);
      }
      return pts;
    }
    if (startPt && endPt) {
      return [startPt, endPt];
    }
    return [];
  }, [activeRouteCoords, startPt, endPt]);

  // Use OSRM road-following geometry when resolved, falling back seamlessly to graph road coordinates
  const displayCoords = (roadRoute?.coords && roadRoute.coords.length > 1) ? roadRoute.coords : fallbackCoords;

  // Throttled (not debounced): while the ambulance is moving the route is refreshed at most
  // every ~1.5 s using the latest position, instead of waiting for movement to stop.
  const latest = useRef(null);
  const timer = useRef(null);
  const controller = useRef(null);
  const lastFired = useRef(0);
  latest.current = { start: startPt, end: endPt, closed: closedSegs, slow: slowSegs };

  useEffect(() => {
    if (!routeKey || timer.current || isOffline()) return;
    const wait = Math.max(300, 1500 - (Date.now() - lastFired.current));
    timer.current = setTimeout(() => {
      timer.current = null;
      lastFired.current = Date.now();
      controller.current?.abort();
      controller.current = new AbortController();
      fetchRoadRoute(latest.current, controller.current.signal)
        .then((res) => {
          setRoadRoute(res);
          if (typeof onRoadResolved === 'function') {
            onRoadResolved(res ? { ...res, hospitalId: routeEnd?.id } : null);
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            setRoadRoute(null);
            if (typeof onRoadResolved === 'function') {
              onRoadResolved(null);
            }
          }
        });
    }, wait);
  }, [routeKey, onRoadResolved]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      timer.current = null;
      controller.current?.abort();
    },
    []
  );

  const routeCoords = roadRoute?.coords || null;
  const isBlocked = roadRoute?.status === 'blocked';

  return (
    <>
      {/* 0. Complete Road Network Topological Graph Edges (when toggled ON) */}
      {showGraphEdges &&
        networkSegments.map(({ edge, positions, isClosed }) => {
          const isPathEdge =
            activePathNodeIds.length > 1 &&
            activePathNodeIds.some(
              (id, idx) =>
                idx < activePathNodeIds.length - 1 &&
                activePathNodeIds[idx] === edge.from &&
                activePathNodeIds[idx + 1] === edge.to
            );

          return (
            <Polyline
              key={`graph-edge-${edge.id}`}
              positions={positions}
              interactive={false}
              pathOptions={{
                color: isPathEdge ? '#D62828' : '#3B82F6',
                weight: isPathEdge ? 4 : 2,
                opacity: isPathEdge ? 0.9 : 0.45,
                dashArray: isClosed ? '4, 6' : isPathEdge ? null : '2, 4',
                lineCap: 'round',
              }}
            />
          );
        })}

      {/* 1. Reported roads: thick coloured line with a white outline so they stand out */}
      {networkSegments.map(({ edge, positions }) => {
        const level = levelOfIncident(incidents.get(edge.id)) || (edge.closed ? TRAFFIC_LEVEL_LIST[3] : null);
        if (!level) return null;
        return (
          <Fragment key={`inc-${edge.id}`}>
            <Polyline
              positions={positions}
              interactive={false}
              pathOptions={{ color: '#FFFFFF', weight: 11, opacity: 0.9, lineCap: 'round' }}
            />
            <Polyline
              positions={positions}
              interactive={false}
              pathOptions={{
                color: level.color,
                weight: 7,
                opacity: 0.95,
                lineCap: 'round',
                dashArray: level.closed ? '4, 10' : null,
              }}
            />
          </Fragment>
        );
      })}

      {/* 2. Primary Optimal Route Polyline (road-following & incident-aware; strictly following paved road geometry) */}
      {displayCoords.length > 1 && (
        <>
          {/* Contrast shadow casing for razor-sharp visibility on both light and dark tiles */}
          <Polyline
            positions={displayCoords}
            pathOptions={{
              color: '#0F172A',
              weight: 10,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            interactive={false}
          />
          {/* Crisp white outer border outline */}
          <Polyline
            positions={displayCoords}
            pathOptions={{
              color: '#FFFFFF',
              weight: 7,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            interactive={false}
          />
          {/* High-visibility Emergency Red (#D62828) or Amber (#F59E0B) core line */}
          <Polyline
            positions={displayCoords}
            pathOptions={{
              color: isBlocked ? '#F59E0B' : '#D62828',
              weight: 4.5,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: isBlocked ? '10, 8' : (!roadRoute?.coords && activeRouteCoords.length <= 1) ? '6, 6' : null,
            }}
            interactive={false}
          >
            {isBlocked && (
              <Tooltip sticky>No road route avoiding the closure was found - verify manually.</Tooltip>
            )}
          </Polyline>
        </>
      )}

      {/* 1c. Wide invisible lines: easy to tap with a finger. Hover shows the road details. */}
      {networkSegments.map(({ edge, positions, isClosed, hasSlowdown }) => (
        <Polyline
          key={`hit-${edge.id}`}
          positions={positions}
          pathOptions={{ color: '#000000', weight: 22, opacity: 0, lineCap: 'round' }}
          eventHandlers={{ click: (e) => handleRoadClick(edge, e.latlng) }}
        >
          <Tooltip sticky>
            <div className="text-3xs font-sans">
              <span className="font-bold block">{edgeDisplayName(edge)}</span>
              <span className="block text-slate-500">
                {edge.roadType} · {edge.lengthM}m · {edge.speedLimitKph} km/h
                {edge.isNarrow ? ' · Narrow' : ''}
                {edge.hasSignal ? ' · Signal' : ''}
                {edge.hasSpeedBreaker ? ' · Speed Breaker' : ''}
              </span>
              {isClosed && <span className="text-red-600 font-bold block">CLOSED</span>}
              {hasSlowdown && !isClosed && (
                <span className="text-amber-600 font-bold block">
                  {levelOfIncident(incidents.get(edge.id))?.label || 'Congested'}
                </span>
              )}
              {canReport && <span className="block text-slate-400">Tap to report</span>}
            </div>
          </Tooltip>
        </Polyline>
      ))}

      {/* 1d. Badges so a reported road is spotted even when zoomed out */}
      {networkSegments.map(({ edge, positions }) => {
        const level = levelOfIncident(incidents.get(edge.id));
        if (!level) return null;
        const mid = [(positions[0][0] + positions[1][0]) / 2, (positions[0][1] + positions[1][1]) / 2];
        return (
          <Marker
            key={`badge-${edge.id}`}
            position={mid}
            icon={badgeIcon(level)}
            zIndexOffset={800}
            eventHandlers={{ click: () => canReport && setPicker({ edgeId: edge.id, latlng: mid }) }}
          />
        );
      })}

      {/* Report popup */}
      {picker && canReport && (() => {
        const edge = edges.find((e) => e.id === picker.edgeId);
        const info = incidents.get(picker.edgeId);
        const current = levelOfIncident(info);
        if (!edge) return null;
        return (
          <Popup
            position={picker.latlng}
            closeButton
            eventHandlers={{ remove: () => setPicker(null) }}
          >
            <div className="font-sans w-[210px]">
              <span className="block text-xs font-extrabold text-slate-900 leading-tight">{edgeDisplayName(edge)}</span>
              {current ? (
                <span className="block text-3xs mt-0.5" style={{ color: current.color }}>
                  <strong>{current.label}</strong> · {info.reportedBy} · {timeAgo(info.timestamp)}
                </span>
              ) : (
                <span className="block text-3xs text-slate-500 mt-0.5">What is happening on this road?</span>
              )}
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {TRAFFIC_LEVEL_LIST.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    title={lvl.hint}
                    onClick={() => {
                      onAddIncident(edge.id, lvl.id);
                      setPicker(null);
                    }}
                    className="min-h-[40px] rounded-lg text-white text-3xs font-bold leading-tight px-1 cursor-pointer active:scale-95"
                    style={{ backgroundColor: lvl.color, outline: current?.id === lvl.id ? '3px solid #0f172a' : 'none' }}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
              {current && onRemoveIncident && (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveIncident(edge.id);
                    setPicker(null);
                  }}
                  className="w-full mt-1.5 min-h-[36px] rounded-lg border border-slate-300 text-3xs font-bold text-slate-700 cursor-pointer"
                >
                  Road is clear now
                </button>
              )}
            </div>
          </Popup>
        );
      })()}

      {/* 3. Graph Intersections & Junction Nodes (Strictly rendered ONLY when Nodes toggle is ON) */}
      {showAllNodes &&
        nodes.map((node) => {
          const isRouteNode = activePathNodeIds.includes(node.id);
          const isSnappedOrigin = activePathNodeIds.length > 0 && activePathNodeIds[0] === node.id;
          let color = '#3B82F6'; // Default Cobalt Blue
          let radius = 4;

          if (isSnappedOrigin) {
            color = '#10B981'; // Emerald Snapped Origin Junction
            radius = 7;
          } else if (isRouteNode) {
            color = '#D62828'; // Active route: Crimson
            radius = 6;
          } else if (node.type === 'expressway' || node.type === 'expressway_ramp' || node.type === 'highway') {
            color = '#F59E0B'; // Amber Expressway
            radius = 5;
          } else if (node.type === 'rotary') {
            color = '#8B5CF6'; // Purple Roundabout / Rotary
            radius = 5.5;
          } else if (node.type === 'healthcare_hub' || node.type === 'hospital') {
            color = '#10B981'; // Emerald Healthcare Hub
            radius = 5;
          } else if (node.type === 'commercial' || node.type === 'commercial_hub') {
            color = '#EC4899'; // Rose Pink Commercial Hub
            radius = 4.5;
          } else if (node.type === 'arterial' || node.type === 'primary' || node.type === 'primary_intersection') {
            color = '#06B6D4'; // Cyan Primary Arterial
            radius = 4.5;
          }

          return (
            <CircleMarker
              key={`graph-node-${node.id}`}
              center={[node.lat, node.lon]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: isRouteNode ? 1 : 0.85,
                color: '#FFFFFF',
                weight: isRouteNode ? 2.5 : 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -5]}>
                <div className="font-mono text-3xs p-1 space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">{node.id}</span>
                  <span className="text-slate-700 dark:text-slate-300 block font-semibold">{node.name || node.label || 'Road Junction'}</span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[9px]">
                    {node.lat.toFixed(4)}°N, {node.lon.toFixed(4)}°E · Type: {node.type || 'junction'}
                  </span>
                  {isSnappedOrigin ? (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[9px] border border-emerald-300 dark:border-emerald-800">
                      📍 NEAREST SNAPPED INTERSECTION (GPS ENTRY)
                    </span>
                  ) : isRouteNode && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 font-bold text-[9px] border border-red-300 dark:border-red-800">
                      ★ ACTIVE DISPATCH CORRIDOR
                    </span>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
    </>
  );
}

export default RouteLayer;
