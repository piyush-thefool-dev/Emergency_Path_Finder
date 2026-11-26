/**
 * 2D Route and Road Network Layer for Leaflet Map.
 * Uses the shared `useRouteCorridor` hook and renders active route polylines,
 * incident overlays/badges, click-to-report traffic popup, and optional graph nodes.
 */

import { Fragment, useEffect, useState } from 'react';
import L from 'leaflet';
import { Polyline, CircleMarker, Tooltip, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useRouteCorridor } from '../../hooks/useRouteCorridor.js';
import { TRAFFIC_LEVEL_LIST, levelOfIncident } from '../../config/trafficLevels.js';
import {
  edgeDisplayName,
  extractLocalStreetSegment,
  findNearestEdge,
  resolveIncidentForEdge,
  timeAgo,
} from '../../utils/incidents.js';

function RoadMapClickListener({ enabled, edges, nodes, onHit }) {
  useMapEvents({
    click(e) {
      if (!enabled || !e?.latlng) return;
      const hit = findNearestEdge(edges, nodes, { lat: e.latlng.lat, lon: e.latlng.lng }, 600);
      if (hit) {
        onHit(hit.edge, e.latlng);
      }
    },
  });
  return null;
}

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
  routeStart = null,
  routeEnd = null,
  onRoadResolved = null,
  onDisplayCoordsChange = null,
  showAllNodes = false,
  showGraphEdges = false,
  canDragPin = false,
  roadReportMode = false,
}) {
  const {
    nodeMap,
    networkSegments,
    activeRouteCoords,
    incidentOverlays,
    roadRoute,
    displayCoords,
    isBlocked,
  } = useRouteCorridor({
    nodes,
    edges,
    activePathNodeIds,
    incidents,
    routeStart,
    routeEnd,
    onRoadResolved,
  });

  useEffect(() => {
    onDisplayCoordsChange?.(displayCoords);
  }, [displayCoords, onDisplayCoordsChange]);

  const [picker, setPicker] = useState(null);
  const canReport = typeof onAddIncident === 'function';

  const openReportPicker = (edge, latlng, event) => {
    if (event?.originalEvent) {
      L.DomEvent.stopPropagation(event.originalEvent);
    }
    if (!canReport) {
      if (onSelectEdge && edge) onSelectEdge(edge.id);
      return;
    }
    const clickPt = { lat: latlng.lat, lon: latlng.lng ?? latlng.lon };
    const fromNode = edge ? nodeMap.get(edge.from) : null;
    const toNode = edge ? nodeMap.get(edge.to) : null;
    const edgePositions = fromNode && toNode ? [[fromNode.lat, fromNode.lon], [toNode.lat, toNode.lon]] : [];

    const pavedClip =
      roadRoute?.coords?.length > 1
        ? extractLocalStreetSegment(roadRoute.coords, clickPt, 42)
        : null;
    const usePavedClip = Boolean(pavedClip && pavedClip.distanceM <= 90);
    const local = usePavedClip
      ? pavedClip
      : (edgePositions.length >= 2 ? extractLocalStreetSegment(edgePositions, clickPt, 42) : null);

    setPicker({
      edgeId: edge.id,
      latlng: local?.point || [clickPt.lat, clickPt.lon],
      streetSegment: local?.streetSegment || (edgePositions.length >= 2 ? edgePositions : null),
      roadName: edgeDisplayName(edge),
    });
  };

  const handleRouteCorridorClick = (e) => {
    if (!canReport || !e?.latlng) return;
    if (e?.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
    }
    const hit = findNearestEdge(edges, nodes, { lat: e.latlng.lat, lon: e.latlng.lng }, 1500);
    if (hit) {
      openReportPicker(hit.edge, e.latlng, e);
    }
  };

  return (
    <>
      <RoadMapClickListener
        enabled={canReport && (roadReportMode || !canDragPin)}
        edges={edges}
        nodes={nodes}
        onHit={(edge, latlng) => openReportPicker(edge, latlng)}
      />

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

      {incidentOverlays.map((item) => (
        <Fragment key={`inc-${item.edgeId}`}>
          <Polyline
            positions={item.positions}
            interactive={false}
            pathOptions={{ color: '#FFFFFF', weight: 11, opacity: 0.9, lineCap: 'round' }}
          />
          <Polyline
            positions={item.positions}
            interactive={false}
            pathOptions={{
              color: item.level.color,
              weight: 7,
              opacity: 0.95,
              lineCap: 'round',
              dashArray: item.level.closed ? '4, 10' : null,
            }}
          />
        </Fragment>
      ))}

      {displayCoords.length > 1 && (
        <>
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
            {!picker && isBlocked && (
              <Tooltip sticky>No road route avoiding the closure was found - verify manually.</Tooltip>
            )}
          </Polyline>
          {canReport && (
            <Polyline
              positions={displayCoords}
              pathOptions={{ color: '#D62828', weight: 22, opacity: 0, lineCap: 'round' }}
              eventHandlers={{ click: handleRouteCorridorClick }}
            >
              {!picker && <Tooltip sticky>Click road corridor to set congestion or closure</Tooltip>}
            </Polyline>
          )}
        </>
      )}

      {networkSegments.map(({ edge, positions, isClosed, hasSlowdown }) => (
        <Polyline
          key={`hit-${edge.id}`}
          positions={positions}
          pathOptions={{ color: '#000000', weight: 24, opacity: 0, lineCap: 'round' }}
          eventHandlers={{ click: (e) => openReportPicker(edge, e.latlng, e) }}
        >
          {!picker && (
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
                    {levelOfIncident(resolveIncidentForEdge(edge.id, incidents))?.label || 'Congested'}
                  </span>
                )}
                {canReport && <span className="block text-slate-400">Tap to report</span>}
              </div>
            </Tooltip>
          )}
        </Polyline>
      ))}

      {incidentOverlays.map((item) => {
        if (item.staticClosed || !item.badgePoint) return null;
        return (
          <Marker
            key={`badge-${item.edgeId}`}
            position={item.badgePoint}
            icon={badgeIcon(item.level)}
            zIndexOffset={800}
            eventHandlers={{
              click: () =>
                canReport &&
                setPicker({
                  edgeId: item.edgeId,
                  latlng: item.badgePoint,
                  streetSegment: item.positions,
                  roadName: item.name,
                }),
            }}
          />
        );
      })}

      {picker && canReport && (() => {
        const edge = edges.find((e) => e.id === picker.edgeId);
        const info = resolveIncidentForEdge(picker.edgeId, incidents);
        const current = levelOfIncident(info);
        if (!edge) return null;
        return (
          <Popup
            position={picker.latlng}
            closeButton
            autoPan={true}
            autoPanPaddingTopLeft={[20, 190]}
            autoPanPaddingBottomRight={[20, 120]}
            maxWidth={260}
            eventHandlers={{ remove: () => setPicker(null) }}
          >
            <div className="font-sans w-[235px] text-slate-900 dark:text-slate-100">
              <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{picker.roadName || edgeDisplayName(edge)}</span>
              <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                {String(edge.roadType || 'road').replace(/_/g, ' ')} · {edge.lengthM}m · {edge.speedLimitKph} km/h
              </span>
              {current ? (
                <span className="block text-3xs mt-1 font-semibold" style={{ color: current.color }}>
                  <strong>{current.label}</strong> · {info.reportedBy} · {timeAgo(info.timestamp)}
                </span>
              ) : (
                <span className="block text-3xs text-slate-500 dark:text-slate-400 mt-1">Select road congestion or closure:</span>
              )}
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {TRAFFIC_LEVEL_LIST.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    title={lvl.hint}
                    onClick={() => {
                      onAddIncident(edge.id, lvl.id, {
                        point: picker.latlng,
                        streetSegment: picker.streetSegment,
                        roadName: picker.roadName || edgeDisplayName(edge),
                      });
                      setPicker(null);
                    }}
                    className="min-h-[42px] rounded-lg text-white text-3xs font-bold leading-tight px-1.5 py-1 cursor-pointer active:scale-95 transition-transform flex flex-col items-center justify-center"
                    style={{
                      backgroundColor: lvl.color,
                      outline: current?.id === lvl.id ? '2px solid #FFFFFF' : 'none',
                    }}
                  >
                    <span>{lvl.label}</span>
                    <span className="text-[9px] font-normal opacity-90">
                      {lvl.closed ? 'Detour route' : `${lvl.factor}x slower`}
                    </span>
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
                  className="w-full mt-1.5 min-h-[34px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-3xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  Normal flow · Clear report
                </button>
              )}
            </div>
          </Popup>
        );
      })()}

      {showAllNodes &&
        nodes.map((node) => {
          const isRouteNode = activePathNodeIds.includes(node.id);
          const isSnappedOrigin = activePathNodeIds.length > 0 && activePathNodeIds[0] === node.id;
          let color = '#3B82F6';
          let radius = 4;

          if (isSnappedOrigin) {
            color = '#10B981';
            radius = 7;
          } else if (isRouteNode) {
            color = '#D62828';
            radius = 6;
          } else if (node.type === 'expressway' || node.type === 'expressway_ramp' || node.type === 'highway') {
            color = '#F59E0B';
            radius = 5;
          } else if (node.type === 'rotary') {
            color = '#8B5CF6';
            radius = 5.5;
          } else if (node.type === 'healthcare_hub' || node.type === 'hospital') {
            color = '#10B981';
            radius = 5;
          } else if (node.type === 'commercial' || node.type === 'commercial_hub') {
            color = '#EC4899';
            radius = 4.5;
          } else if (node.type === 'arterial' || node.type === 'primary' || node.type === 'primary_intersection') {
            color = '#06B6D4';
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
                      NEAREST SNAPPED INTERSECTION
                    </span>
                  ) : isRouteNode && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 font-bold text-[9px] border border-red-300 dark:border-red-800">
                      ACTIVE DISPATCH CORRIDOR
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
