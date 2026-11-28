import { describe, it } from 'node:test';
import assert from 'node:assert';
import { loadPanIndiaHospitals } from '../services/hospitalDataService.js';
import { loadRealOsmGraph } from '../services/graphLoader.js';
import { computeGraphWeights } from '../services/edgeWeights.js';
import {
  rankHospitalsForEmergency,
  buildMapHospitalMarkers,
} from '../services/hospitalRanking.js';
import { filterHospitalsByRadius } from '../services/hospitalFilterService.js';
import { findNearestNode } from '../utils/geo.js';
import { GPS_TRACKING_CONFIG } from '../hooks/useLiveLocation.js';
import { ROAD_ROUTE_TIMEOUT_MS_FOR_TEST, fetchRoadRoute } from '../services/roadSnapService.js';

const PAN_INDIA_HOSPITALS = await loadPanIndiaHospitals();
const baseGraph = await loadRealOsmGraph();

describe('Real-Time Vehicle Tracking & Sub-10s Startup Performance SLA', () => {
  const origin = { lat: 28.4625, lon: 77.4930 };
  const weightedGraph = computeGraphWeights(baseGraph, {
    timeOfDay: 'morning_peak',
    weather: 'clear',
  });
  const sourceNode = findNearestNode(origin.lat, origin.lon, weightedGraph.nodes);

  it('ranks all 35,000 hospitals in under 250 ms without freezing vehicle tracking', () => {
    const start = performance.now();
    const res = rankHospitalsForEmergency(
      PAN_INDIA_HOSPITALS,
      sourceNode.id,
      weightedGraph,
      'TRAUMA',
      'astar'
    );
    const elapsedMs = performance.now() - start;

    assert.ok(res.rankedHospitals.length > 15000, 'Expected all reachable trauma facilities ranked');
    assert.strictEqual(res.bestRecommendation?.id, 'hosp_sharda', 'Optimal recommendation must remain unchanged');
    assert.ok(
      elapsedMs < 250,
      `rankHospitalsForEmergency took ${elapsedMs.toFixed(1)} ms (exceeds 250 ms SLA)`
    );
  });

  it('filters 35,000 hospitals within active radius and builds map markers in under 25 ms each', () => {
    const t0 = performance.now();
    const rad = filterHospitalsByRadius(origin, PAN_INDIA_HOSPITALS, { radiusKm: 10 });
    const radMs = performance.now() - t0;

    const t1 = performance.now();
    const markers = buildMapHospitalMarkers({
      topHospitals: rad.candidates.slice(0, 15),
      availableHospitals: PAN_INDIA_HOSPITALS,
      activeHospital: rad.candidates[0],
      ambulancePos: origin,
      radiusKm: 10,
    });
    const markerMs = performance.now() - t1;

    assert.ok(rad.candidates.length >= 20, 'Expected Greater Noida facilities inside 10 km radius');
    assert.ok(markers.length > 0, 'Expected visible markers inside corridor radius');
    assert.ok(radMs < 25, `filterHospitalsByRadius took ${radMs.toFixed(1)} ms (exceeds 25 ms SLA)`);
    assert.ok(markerMs < 25, `buildMapHospitalMarkers took ${markerMs.toFixed(1)} ms (exceeds 25 ms SLA)`);
  });

  it('configures live GPS acquisition & fallback timeouts strictly under 10 seconds', () => {
    assert.ok(GPS_TRACKING_CONFIG, 'useLiveLocation must export GPS_TRACKING_CONFIG');
    assert.ok(
      GPS_TRACKING_CONFIG.fastLockTimeoutMs <= 4500,
      `Fast GPS pre-lock timeout (${GPS_TRACKING_CONFIG.fastLockTimeoutMs} ms) should complete quickly`
    );
    assert.ok(
      GPS_TRACKING_CONFIG.highAccuracyTimeoutMs < 10000,
      `High-accuracy GPS timeout (${GPS_TRACKING_CONFIG.highAccuracyTimeoutMs} ms) must stay under 10s`
    );
    assert.ok(
      GPS_TRACKING_CONFIG.fallbackTimeoutMs < 10000,
      `Fallback GPS timeout (${GPS_TRACKING_CONFIG.fallbackTimeoutMs} ms) must stay under 10s`
    );
    assert.ok(
      ROAD_ROUTE_TIMEOUT_MS_FOR_TEST <= 3000 && typeof fetchRoadRoute === 'function',
      `Remote routing request timeout (${ROAD_ROUTE_TIMEOUT_MS_FOR_TEST} ms) must stay <= 3s so live corridor tracking never stalls`
    );
  });
});
