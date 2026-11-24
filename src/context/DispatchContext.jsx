/**
 * Dispatch Context.
 *
 * Holds the routing / graph / live-location state that used to live inside the
 * Dashboard page. Because the app is now split into several full-screen pages
 * (Map, Hospitals, Beds, Controls, More) switched from a bottom tab bar, this
 * state has to survive page changes — so it lives here, above the router.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useGraph } from '../hooks/useGraph.js';
import { useRouting } from '../hooks/useRouting.js';
import { useLiveLocation } from '../hooks/useLiveLocation.js';
import { useApiHealth } from '../hooks/useApiHealth.js';

const DispatchContext = createContext(null);

export function DispatchProvider({ children }) {
  const graph = useGraph();
  const routing = useRouting(graph.weightedGraph, false);
  const apiHealth = useApiHealth({ tomtomKey: graph.trafficConfig?.tomtomApiKey || '' });

  // Ambulance pin drag lock: true by default so dispatcher can immediately drag/relocate pin
  const [canDragAmbulance, setCanDragAmbulance] = useState(true);

  // Real-time road geometry and odometer telemetry resolved from OSRM
  const [roadTelemetry, setRoadTelemetry] = useState(null); // { distanceM, durationSec, status }

  const { setAmbulanceCoordinates, activeHospital, ambulancePos } = routing;

  const handleLiveLocationUpdate = useCallback(
    (lat, lon) => {
      setAmbulanceCoordinates(lat, lon);
    },
    [setAmbulanceCoordinates]
  );

  const live = useLiveLocation({
    onLocationUpdate: handleLiveLocationUpdate,
    activeRouteNodeIds: activeHospital?.pathNodeIds || [],
    graphNodes: graph.weightedGraph.nodes,
    initialPos: ambulancePos,
  });

  const value = useMemo(
    () => ({
      graph,
      routing,
      live,
      apiHealth,
      canDragAmbulance,
      setCanDragAmbulance,
      roadTelemetry,
      setRoadTelemetry,
    }),
    [graph, routing, live, apiHealth, canDragAmbulance, roadTelemetry]
  );

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
}

export function useDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useDispatch must be used within DispatchProvider');
  return ctx;
}
