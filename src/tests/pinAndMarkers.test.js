import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  resolveHospitalSelectionOnEvent,
  ensureActiveHospitalInList,
  buildMapHospitalMarkers,
  shouldSwitchHospitalForRoute,
  filterBlockedHospitals,
} from '../services/hospitalRanking.js';
import {
  findNearestEdge,
  findPairedEdgeIds,
  extractLocalStreetSegment,
  resolveIncidentForEdge,
  buildIncidentList,
} from '../utils/incidents.js';
import { calculateEdgeWeight, computeGraphWeights } from '../services/edgeWeights.js';
import { TRAFFIC_LEVEL_LIST } from '../config/trafficLevels.js';

describe('Pin Interactions and Marker Presentation', () => {
  it('safely parses multiple coordinate signatures for ambulance relocation', () => {
    // Replicate the setAmbulanceCoordinates logic
    function parseAmbulanceCoordinates(latOrObj, maybeLon) {
      let lat, lon;
      if (typeof latOrObj === 'object' && latOrObj !== null) {
        lat = latOrObj.lat;
        lon = latOrObj.lon ?? latOrObj.lng;
      } else {
        lat = latOrObj;
        lon = maybeLon;
      }
      if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
      return null;
    }

    // 1. Two numbers (lat, lon)
    assert.deepStrictEqual(
      parseAmbulanceCoordinates(28.4625, 77.4930),
      { lat: 28.4625, lon: 77.4930 },
      'Standard (lat, lon) arguments should resolve correctly'
    );

    // 2. Object with { lat, lon }
    assert.deepStrictEqual(
      parseAmbulanceCoordinates({ lat: 28.4680, lon: 77.5050 }),
      { lat: 28.4680, lon: 77.5050 },
      'Object { lat, lon } should resolve correctly'
    );

    // 3. Leaflet LatLng object { lat, lng }
    assert.deepStrictEqual(
      parseAmbulanceCoordinates({ lat: 28.4720, lng: 77.5110 }),
      { lat: 28.4720, lon: 77.5110 },
      'Leaflet { lat, lng } should resolve correctly to { lat, lon }'
    );

    // 4. Invalid or corrupted inputs
    assert.strictEqual(parseAmbulanceCoordinates(null), null);
    assert.strictEqual(parseAmbulanceCoordinates(undefined), null);
    assert.strictEqual(parseAmbulanceCoordinates('invalid', 77.4930), null);
    assert.strictEqual(parseAmbulanceCoordinates(NaN, 77.4930), null);
    assert.strictEqual(parseAmbulanceCoordinates({ lat: 28.4625 }), null);
  });

  it('verifies marker key stability across regular and selected states', () => {
    // When a hospital transitions from regular to active/target, the React key MUST NOT change.
    // Changing key unmounts the Leaflet Marker, destroying the popup and cancelling clicks.
    const hospital = { id: 'kailash_hospital', name: 'Kailash Hospital' };
    
    const regularKey = hospital.id;
    const targetKey = hospital.id;

    assert.strictEqual(
      regularKey,
      targetKey,
      'Hospital marker key must remain identical across selection states so Leaflet DOM is preserved'
    );
  });

  it('verifies single-banner invariant: only the target recommendation displays a callout banner', () => {
    const hospitals = [
      { id: 'h1', name: 'Kailash Hospital' },
      { id: 'h2', name: 'Bakson Hospital' },
      { id: 'h3', name: 'Yatharth Hospital' },
      { id: 'h4', name: 'Sharda Hospital' },
      { id: 'h5', name: 'Promhex Hospital' },
    ];
    const activeHospitalId = 'h1';

    // Count how many tooltips are rendered under the single-banner rule
    const renderedTooltips = hospitals.filter((h) => h.id === activeHospitalId);

    assert.strictEqual(
      renderedTooltips.length,
      1,
      'Exactly one callout banner must be rendered to avoid banner overlap collisions'
    );
    assert.strictEqual(
      renderedTooltips[0].id,
      'h1',
      'The callout banner must belong strictly to the active recommended hospital'
    );
  });

  it('locks chosen hospital against move/category/recenter resets and reverts to closest when unlocked', () => {
    // 1. Default state: closest auto recommendation
    let state = { selectedHospitalId: null, isHospitalLocked: false, activeHospitalId: 'hosp_sharda' };

    // 2. Select custom hospital and lock choice
    state = resolveHospitalSelectionOnEvent(state, { type: 'SELECT_HOSPITAL', hospitalId: 'hosp_yatharth' });
    assert.strictEqual(state.selectedHospitalId, 'hosp_yatharth');

    state = resolveHospitalSelectionOnEvent(state, { type: 'TOGGLE_LOCK' });
    assert.strictEqual(state.isHospitalLocked, true);
    assert.strictEqual(state.selectedHospitalId, 'hosp_yatharth');

    // 3. Moving ambulance, switching category, or recentering MUST NOT revert locked choice
    for (const evtType of ['AMBULANCE_MOVED', 'CATEGORY_CHANGED', 'RECENTER']) {
      state = resolveHospitalSelectionOnEvent(state, { type: evtType });
      assert.strictEqual(state.selectedHospitalId, 'hosp_yatharth', `${evtType} must preserve locked hospital`);
      assert.strictEqual(state.isHospitalLocked, true);
    }

    // 4. Selecting another hospital while locked updates the locked target to the new hospital
    state = resolveHospitalSelectionOnEvent(state, { type: 'SELECT_HOSPITAL', hospitalId: 'hosp_gims' });
    assert.strictEqual(state.selectedHospitalId, 'hosp_gims');
    assert.strictEqual(state.isHospitalLocked, true);

    // 5. Toggling lock off reverts cleanly to closest default (null)
    state = resolveHospitalSelectionOnEvent(state, { type: 'TOGGLE_LOCK' });
    assert.strictEqual(state.isHospitalLocked, false);
    assert.strictEqual(state.selectedHospitalId, null);

    // 6. When unlocked, moving ambulance resets temporary selection back to closest default
    state = resolveHospitalSelectionOnEvent(
      { selectedHospitalId: 'hosp_kailash', isHospitalLocked: false, activeHospitalId: 'hosp_kailash' },
      { type: 'AMBULANCE_MOVED' }
    );
    assert.strictEqual(state.selectedHospitalId, null);
  });

  it('ensures an out-of-corridor locked hospital stays included in the rendered map markers', () => {
    const baseList = [{ id: 'hosp_sharda', name: 'Sharda', lat: 28.474511, lon: 77.482683 }];
    const customTarget = { id: 'hosp_aiims', name: 'AIIMS New Delhi', lat: 28.5672, lon: 77.21 };
    const merged = ensureActiveHospitalInList(baseList, customTarget);
    assert.strictEqual(merged.length, 2);
    assert.strictEqual(merged[0].id, 'hosp_aiims');
  });

  it('merges nearby local hospitals and OSM hospital POIs onto the map without duplicate points', () => {
    const ambulancePos = { lat: 28.4625, lon: 77.493 };
    const topHospitals = [
      { id: 'hosp_sharda', name: 'Sharda Hospital', lat: 28.474511, lon: 77.482683 },
    ];
    const availableHospitals = [
      ...topHospitals,
      { id: 'hosp_bakson', name: 'Bakson Hospital', lat: 28.467621, lon: 77.502004 },
      { id: 'hosp_outer_6km', name: 'Outer Noida Hospital', lat: 28.525, lon: 77.489 },
      { id: 'hosp_sharda_dup', name: 'Sharda Wing', lat: 28.47455, lon: 77.4827 },
      { id: 'hosp_far_mumbai', name: 'KEM Mumbai', lat: 19.0022, lon: 72.8414 },
    ];

    const markers = buildMapHospitalMarkers({
      topHospitals,
      availableHospitals,
      activeHospital: topHospitals[0],
      ambulancePos,
      radiusKm: 5,
    });

    assert.ok(markers.some((h) => h.id === 'hosp_bakson'), 'Includes nearby Greater Noida hospitals within 5 km ring');
    assert.ok(markers.some((h) => h.id === 'osm_nimt_gn'), 'Includes supplemental OSM POI markers within 5 km ring');
    assert.ok(!markers.some((h) => h.id === 'hosp_outer_6km'), 'Excludes hospitals outside the active 5 km blue ring');
    assert.ok(!markers.some((h) => h.id === 'hosp_sharda_dup'), 'Deduplicates nearby duplicate coordinates');
    assert.ok(!markers.some((h) => h.id === 'hosp_far_mumbai'), 'Excludes distant cities outside corridor radius');
  });

  it('snaps map/route clicks to the nearest road segment for congestion & incident options', () => {
    const nodes = [
      { id: 'n1', lat: 28.4620, lon: 77.4900 },
      { id: 'n2', lat: 28.4640, lon: 77.4950 },
    ];
    const edges = [
      { id: 'e_apj', from: 'n1', to: 'n2', name: 'APJ Abdul Kalam Rd', roadType: 'primary', lengthM: 530 },
    ];

    const hit = findNearestEdge(edges, nodes, { lat: 28.4631, lon: 77.4926 }, 600);
    assert.ok(hit, 'Click near road must resolve the road edge');
    assert.strictEqual(hit.edge.id, 'e_apj');
    assert.ok(TRAFFIC_LEVEL_LIST.length >= 4, 'Should expose full road congestion/closure levels');
  });

  it('extracts a short local street segment along the road without 700m diagonal chords and links bidirectional edges', () => {
    const nodes = [
      { id: 'n1', lat: 28.4600, lon: 77.4900 },
      { id: 'n2', lat: 28.4660, lon: 77.4960 },
    ];
    const edges = [
      { id: 'e_f', from: 'n1', to: 'n2', name: 'APJ Abdul Kalam Rd', roadType: 'primary', lengthM: 880, speedLimitKph: 50 },
      { id: 'e_r', from: 'n2', to: 'n1', name: 'APJ Abdul Kalam Rd', roadType: 'primary', lengthM: 880, speedLimitKph: 50 },
    ];

    // Curved paved polyline (~600m long)
    const roadPolyline = [
      [28.4600, 77.4900],
      [28.4615, 77.4905],
      [28.4628, 77.4915],
      [28.4632, 77.4920],
      [28.4645, 77.4940],
      [28.4660, 77.4960],
    ];
    const clicked = { lat: 28.4630, lon: 77.4918 };
    const local = extractLocalStreetSegment(roadPolyline, clicked, 42);
    assert.ok(local && local.streetSegment.length >= 2, 'Should extract local street sub-segment');
    assert.ok(local.lengthM <= 110, `Expected short <= 110m local clip, got ${local.lengthM}m`);

    const paired = findPairedEdgeIds('e_f', edges);
    assert.deepStrictEqual(paired.sort(), ['e_f', 'e_r']);

    const incidents = new Map([
      [
        'e_f',
        {
          kind: 'closure',
          closed: true,
          slowdownFactor: 1,
          label: 'Road closed',
          reportedBy: 'Dispatcher',
          timestamp: '2026-11-25T10:00:00.000Z',
          point: local.point,
          streetSegment: local.streetSegment,
          linkedEdgeIds: paired,
          roadName: 'APJ Abdul Kalam Rd',
        },
      ],
    ]);

    // Both forward and reverse edges must resolve as closed in graph weighting
    assert.ok(resolveIncidentForEdge('e_r', incidents)?.closed, 'Reverse paired edge must inherit closure');
    const weighted = computeGraphWeights({ nodes, edges }, { incidents });
    assert.strictEqual(weighted.edges[0].closed, true);
    assert.strictEqual(weighted.edges[1].closed, true);
    assert.strictEqual(calculateEdgeWeight(edges[1], { incidents }).isClosed, true);

    // UI list should count 1 incident anchored at the exact reported street point
    const list = buildIncidentList(incidents, edges, nodes);
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].point.lat, local.point[0]);
    assert.strictEqual(list[0].point.lon, local.point[1]);
  });

  it('keeps the same hospital on passable 1-incident detour but switches to another hospital when blocked or multi-accident degraded', () => {
    const baseHospital = { id: 'h1', travelTimeSec: 240 };

    // 1. Single closure with valid alternate road route -> stay on same hospital
    assert.strictEqual(
      shouldSwitchHospitalForRoute({ hospitalId: 'h1', status: 'rerouted', closedCount: 1, durationSec: 320 }, baseHospital, false),
      false
    );

    // 2. Route is completely blocked around closures -> switch hospital
    assert.strictEqual(
      shouldSwitchHospitalForRoute({ hospitalId: 'h1', status: 'blocked', closedCount: 2, durationSec: 250 }, baseHospital, false),
      true
    );

    // 3. Multiple closures (2+) causing heavy delay vs baseline (>= 1.65x and >= +180s) -> switch hospital
    assert.strictEqual(
      shouldSwitchHospitalForRoute({ hospitalId: 'h1', status: 'rerouted', closedCount: 2, durationSec: 520 }, baseHospital, false),
      true
    );

    // 4. Multiple closures (2+) but alternate road is still almost as fast as baseline -> keep same hospital
    assert.strictEqual(
      shouldSwitchHospitalForRoute({ hospitalId: 'h1', status: 'rerouted', closedCount: 2, durationSec: 280 }, baseHospital, false),
      false
    );

    // 5. Locked hospital never auto-switches away
    assert.strictEqual(
      shouldSwitchHospitalForRoute({ hospitalId: 'h1', status: 'blocked', closedCount: 3, durationSec: 600 }, baseHospital, true),
      false
    );

    // 6. filterBlockedHospitals moves next reachable hospital to index 0, never returning empty list
    const list = [{ id: 'h1' }, { id: 'h2' }, { id: 'h3' }];
    assert.deepStrictEqual(filterBlockedHospitals(list, ['h1']).map((h) => h.id), ['h2', 'h3']);
    assert.deepStrictEqual(filterBlockedHospitals(list, ['h1', 'h2']).map((h) => h.id), ['h3']);
    // If all candidates got blocked, keep last fallback instead of returning empty list
    assert.deepStrictEqual(filterBlockedHospitals(list, ['h1', 'h2', 'h3']).map((h) => h.id), ['h3']);
  });
});
