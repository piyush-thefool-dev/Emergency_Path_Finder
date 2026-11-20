/**
 * Custom hook to manage the road graph, Open-Meteo weather, modelled traffic
 * factors, and incident states.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { getDefaultGraph, getFigure2Graph, getRealOsmGraph } from '../services/graphLoader.js';
import { computeGraphWeights } from '../services/edgeWeights.js';
import { fetchLiveWeather } from '../services/weatherService.js';
import { getStoredTrafficConfig, saveStoredTrafficConfig, TRAFFIC_PROVIDERS } from '../services/trafficService.js';
import { downloadOverpassGrid } from '../services/overpassService.js';
import { resolveLevel, REPORTERS } from '../config/trafficLevels.js';

export function useGraph() {
  // Graph Mode: 'real_osm' (Full Real OSM Grid) | 'synthetic' (46 nodes) | 'figure_2' (Report Demo)
  const [graphMode, setGraphMode] = useState('real_osm');
  const [customOverpassGraph, setCustomOverpassGraph] = useState(null);
  const [isDownloadingOverpass, setIsDownloadingOverpass] = useState(false);
  const [overpassDownloadError, setOverpassDownloadError] = useState(null);

  const [timeOfDay, setTimeOfDay] = useState('morning_peak');
  const [weather, setWeather] = useState('clear');
  const [useLiveWeather, setUseLiveWeather] = useState(true);
  const [liveWeather, setLiveWeather] = useState(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  const [signalPriority, setSignalPriority] = useState(false);
  const [trafficConfig, setTrafficConfig] = useState(getStoredTrafficConfig);

  // Map of edgeId -> { closed: boolean, slowdownFactor: number, label: string }
  const [incidents, setIncidents] = useState(new Map());
  // Who is filing reports right now: a member of the public or an ambulance driver.
  const [reporter, setReporter] = useState(REPORTERS[0]);

  // Fetch live Open-Meteo weather for Greater Noida
  const refreshLiveWeather = useCallback(async () => {
    setIsFetchingWeather(true);
    try {
      const data = await fetchLiveWeather();
      setLiveWeather(data);
      if (useLiveWeather && data.weatherId) {
        setWeather(data.weatherId);
      }
    } catch (err) {
      console.warn('Open-Meteo fetch failed:', err);
    } finally {
      setIsFetchingWeather(false);
    }
  }, [useLiveWeather]);

  useEffect(() => {
    refreshLiveWeather();
  }, [refreshLiveWeather]);

  // Update weather when live weather toggle changes
  const toggleLiveWeather = useCallback((enabled) => {
    setUseLiveWeather(enabled);
    if (enabled && liveWeather?.weatherId) {
      setWeather(liveWeather.weatherId);
    }
  }, [liveWeather]);

  // Trigger Overpass live road network download
  const fetchFreshOverpassGrid = useCallback(async () => {
    setIsDownloadingOverpass(true);
    setOverpassDownloadError(null);
    try {
      const result = await downloadOverpassGrid();
      setCustomOverpassGraph(result.graph);
      setGraphMode('real_osm');
      return result;
    } catch (err) {
      setOverpassDownloadError(err.message);
      throw err;
    } finally {
      setIsDownloadingOverpass(false);
    }
  }, []);

  // Base raw graph according to active mode
  const baseGraph = useMemo(() => {
    if (customOverpassGraph) {
      return customOverpassGraph;
    }
    if (graphMode === 'synthetic') {
      return getDefaultGraph(false);
    }
    return getRealOsmGraph();
  }, [graphMode, customOverpassGraph]);

  // Dynamically weighted graph based on time, weather, signal priority, and incidents
  const weightedGraph = useMemo(() => {
    return computeGraphWeights(baseGraph, {
      timeOfDay,
      weather,
      signalPriorityEnabled: signalPriority,
      incidents,
    });
  }, [baseGraph, timeOfDay, weather, signalPriority, incidents]);

  const addIncident = useCallback(
    (edgeId, type = 'closure', meta = {}) => {
      const level = resolveLevel(type);
      setIncidents((prev) => {
        const next = new Map(prev);
        next.set(edgeId, {
          kind: level.id,
          closed: level.closed,
          slowdownFactor: level.closed ? 1 : level.factor,
          label: level.label,
          reportedBy: meta.reportedBy || reporter,
          timestamp: new Date().toISOString(),
        });
        return next;
      });
    },
    [reporter]
  );

  const removeIncident = useCallback((edgeId) => {
    setIncidents((prev) => {
      const next = new Map(prev);
      next.delete(edgeId);
      return next;
    });
  }, []);

  const clearIncidents = useCallback(() => {
    setIncidents(new Map());
  }, []);

  const updateTrafficProvider = useCallback((newConfig) => {
    setTrafficConfig(newConfig);
    saveStoredTrafficConfig(newConfig);
  }, []);

  return {
    baseGraph,
    weightedGraph,
    graphMode,
    setGraphMode,
    timeOfDay,
    setTimeOfDay,
    weather,
    setWeather,
    useLiveWeather,
    toggleLiveWeather,
    liveWeather,
    isFetchingWeather,
    refreshLiveWeather,
    signalPriority,
    setSignalPriority,
    trafficConfig,
    updateTrafficProvider,
    trafficProviders: TRAFFIC_PROVIDERS,
    fetchFreshOverpassGrid,
    isDownloadingOverpass,
    overpassDownloadError,
    incidents,
    reporter,
    setReporter,
    addIncident,
    removeIncident,
    clearIncidents,
  };
}
