/**
 * Calibration & Placeholder Replacement Context.
 *
 * Allows users and evaluators to inspect all 7 placeholder categories defined
 * in the Delhi Technical Campus B.Tech report, understand what real-world datasets
 * or experiments are required to remove each one, and interactively replace them
 * with local algorithm benchmarks and clearly labelled simulation previews.
 * Unmeasured field, traffic, hospital, and ML metrics remain placeholders.
 */

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { getDefaultGraph } from '../services/graphLoader.js';
import { computeGraphWeights } from '../services/edgeWeights.js';
import { runAlgorithmBenchmark } from '../services/benchmark.js';
import { SAMPLE_HOSPITALS } from '../data/sampleHospitals.js';

const CalibrationContext = createContext(null);

export const INITIAL_CALIBRATION_STATE = {
  // 1. Study Area & OSM Extract Metadata (Dashboard & syntheticCityGraph.js)
  osmResolved: false,
  studyAreaPolygon: 'Greater Noida Knowledge Park I–III, Pari Chowk & Alpha–Delta Corridor (28.448°N–28.522°N, 77.475°E–77.555°E)',
  osmExtractDate: 'OSM Overpass / OSMnx Road Graph v1.4 (Extracted 2026-11-03 UTC)',

  // 2. Traffic & Weather Feed Provenance (Dashboard & speedModel.js)
  trafficResolved: false,
  trafficProvider: 'Deterministic time-of-day and road-class model; no live traffic feed connected',
  weatherProvider: 'Open-Meteo Greater Noida weather observations when the service responds (28.4795°N, 77.5090°E)',

  // 3. Hospital Directory & Bed Availability (directory metadata is not bed telemetry)
  hospitalResolved: false,

  // 4. Machine Learning Speed Model MAE (Evaluation.jsx Section 6.1 & 7.2)
  mlResolved: false,
  linearRegressionMae: 'NOT MEASURED',
  randomForestMae: 'NOT MEASURED',
  xgboostMae: 'NOT MEASURED',

  // 5. Paired Route Trial Measurements (Evaluation.jsx Section 7.1 & 7.2)
  routeTestsResolved: false,
  shortestDistanceActualTime: 'NOT MEASURED',
  freeFlowActualTime: 'NOT MEASURED',
  mlWeightedActualTime: 'NOT MEASURED',
  computedTimeSavedVsShortest: 'NOT MEASURED',
  computedTimeSavedVsFreeFlow: 'NOT MEASURED',

  // 6. Algorithmic Benchmark Audit (Evaluation.jsx Section 7.2)
  algoBenchmarkResolved: false,
  dijkstraStats: null,
  astarStats: null,
  invalidEdgesUsed: 'NOT AUDITED — RUN LOCAL BENCHMARK',
};

export function CalibrationProvider({ children }) {
  const [calibration, setCalibration] = useState(INITIAL_CALIBRATION_STATE);

  // Run a local in-browser benchmark on the bundled Greater Noida graph
  const runLiveBenchmarkCalibration = useCallback(() => {
    const raw = getDefaultGraph();
    const weighted = computeGraphWeights(raw, {
      timeOfDay: 'morning_peak',
      weather: 'clear',
    });
    const bench = runAlgorithmBenchmark(weighted, SAMPLE_HOSPITALS, 25);
    const { summary } = bench;

    setCalibration((prev) => ({
      ...prev,
      algoBenchmarkResolved: true,
      dijkstraStats: `${summary.avgDijkstraTimeMs} ms avg · ${summary.avgDijkstraNodes} nodes expanded`,
      astarStats: `${summary.avgAStarTimeMs} ms avg · ${summary.avgAStarNodes} nodes expanded (-${summary.avgSearchReductionPercent}%)`,
      invalidEdgesUsed: `${summary.invalidEdgesUsed} invalid path edges across ${summary.totalPairs} pairs`,
    }));
  }, []);

  // Reset back to strict report placeholders
  const resetToStrictReportPlaceholders = useCallback(() => {
    setCalibration({
      ...INITIAL_CALIBRATION_STATE,
      hospitalResolved: false,
    });
  }, []);

  const updateCalibrationField = useCallback((key, value) => {
    setCalibration((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const activePlaceholderCount = useMemo(() => {
    let count = 0;
    if (!calibration.osmResolved) count += 2; // Study area + OSM date
    if (!calibration.trafficResolved) count += 2; // Traffic + Weather feed
    if (!calibration.hospitalResolved) count += 1; // Hospital registry
    if (!calibration.mlResolved) count += 3; // LR, RF, XGBoost MAE
    if (!calibration.routeTestsResolved) count += 4; // 3 route times + % saved formula
    if (!calibration.algoBenchmarkResolved) count += 2; // Dijkstra and A* local timing/search effort
    count += 1; // Separate one-way and closed-edge compliance audit
    return count;
  }, [calibration]);

  const value = useMemo(
    () => ({
      calibration,
      updateCalibrationField,
      runLiveBenchmarkCalibration,
      resetToStrictReportPlaceholders,
      activePlaceholderCount,
    }),
    [
      calibration,
      updateCalibrationField,
      runLiveBenchmarkCalibration,
      resetToStrictReportPlaceholders,
      activePlaceholderCount,
    ]
  );

  return (
    <CalibrationContext.Provider value={value}>
      {children}
    </CalibrationContext.Provider>
  );
}

export function useCalibration() {
  const ctx = useContext(CalibrationContext);
  if (!ctx) {
    throw new Error('useCalibration must be used within a CalibrationProvider');
  }
  return ctx;
}
