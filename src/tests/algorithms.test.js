import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function expect(actual) {
  return {
    toBe(expected) { assert.equal(actual, expected); },
    toEqual(expected) { assert.deepEqual(actual, expected); },
    toBeNull() { assert.equal(actual, null); },
    toBeGreaterThan(expected) { assert.ok(actual > expected); },
    toBeLessThan(expected) { assert.ok(actual < expected); },
  };
}
import { dijkstra } from '../algorithms/dijkstra.js';
import { astar } from '../algorithms/astar.js';
import { getFigure2Graph, loadDefaultGraph } from '../services/graphLoader.js';
import { computeGraphWeights } from '../services/edgeWeights.js';
import { rankHospitalsForEmergency, calculateSeatIntakeFactor } from '../services/hospitalRanking.js';

const preloadedDefaultGraph = await loadDefaultGraph();
const getDefaultGraph = () => preloadedDefaultGraph;

describe('Routing Algorithms Verification', () => {
  const figure2 = getFigure2Graph();

  describe('Figure 2 Report Demo Graph Verification', () => {
    it('Dijkstra returns optimal cost = 9 and path Ambulance -> B -> D -> Hospital', () => {
      const result = dijkstra(figure2, 'Ambulance', 'Hospital');

      expect(result.success).toBe(true);
      expect(result.totalCost).toBe(9);
      expect(result.path).toEqual(['Ambulance', 'B', 'D', 'Hospital']);
      expect(result.nodesExpanded).toBeGreaterThan(0);
      expect(typeof result.queryTimeMs).toBe('number');
    });

    it('A* returns optimal cost = 9 and path Ambulance -> B -> D -> Hospital', () => {
      const result = astar(figure2, 'Ambulance', 'Hospital');

      expect(result.success).toBe(true);
      expect(result.totalCost).toBe(9);
      expect(result.path).toEqual(['Ambulance', 'B', 'D', 'Hospital']);
      expect(result.nodesExpanded).toBeGreaterThan(0);
      expect(typeof result.queryTimeMs).toBe('number');
    });

    it('Dijkstra and A* cost agreement on Figure 2 is strictly verified (Cost = 9)', () => {
      const dResult = dijkstra(figure2, 'Ambulance', 'Hospital');
      const aResult = astar(figure2, 'Ambulance', 'Hospital');

      expect(dResult.totalCost).toBe(9);
      expect(aResult.totalCost).toBe(9);
      expect(dResult.totalCost).toBe(aResult.totalCost);
      expect(dResult.path).toEqual(aResult.path);
    });
  });

  describe('Algorithmic Invariants on Directed Graphs', () => {
    const rawGraph = getDefaultGraph();
    const cityGraph = computeGraphWeights(rawGraph, {
      timeOfDay: 'morning_peak',
      weather: 'clear',
    });

    it('respects one-way edges and does not traverse backwards', () => {
      // Find an explicit one-way edge: e_rot_w_s is from n_pari_west to n_pari_south
      // There is no direct backward edge from n_pari_south to n_pari_west
      const oneWayGraph = {
        nodes: [
          { id: 'Node1', lat: 28.47, lon: 77.49 },
          { id: 'Node2', lat: 28.48, lon: 77.50 },
        ],
        edges: [
          { id: 'e1', from: 'Node1', to: 'Node2', weight: 10, closed: false },
        ],
        unit: 'seconds',
      };

      const forward = dijkstra(oneWayGraph, 'Node1', 'Node2');
      expect(forward.success).toBe(true);
      expect(forward.path).toEqual(['Node1', 'Node2']);

      const backward = dijkstra(oneWayGraph, 'Node2', 'Node1');
      expect(backward.success).toBe(false);
      expect(backward.path).toEqual([]);
      expect(backward.totalCost).toBe(Infinity);
    });

    it('strictly excludes closed road segments from path calculation', () => {
      const closedGraph = {
        nodes: [
          { id: 'S', lat: 28.47, lon: 77.49 },
          { id: 'A', lat: 28.48, lon: 77.50 },
          { id: 'B', lat: 28.46, lon: 77.50 },
          { id: 'T', lat: 28.47, lon: 77.52 },
        ],
        edges: [
          // Path S -> A -> T has weight 2 + 2 = 4, but A -> T is CLOSED
          { id: 'e_sa', from: 'S', to: 'A', weight: 2, closed: false },
          { id: 'e_at', from: 'A', to: 'T', weight: 2, closed: true },
          // Alternative path S -> B -> T has weight 3 + 3 = 6
          { id: 'e_sb', from: 'S', to: 'B', weight: 3, closed: false },
          { id: 'e_bt', from: 'B', to: 'T', weight: 3, closed: false },
        ],
        unit: 'seconds',
      };

      const result = dijkstra(closedGraph, 'S', 'T');
      expect(result.success).toBe(true);
      expect(result.path).toEqual(['S', 'B', 'T']);
      expect(result.totalCost).toBe(6);
    });

    it('returns cost = 0 and single-element path when source equals target', () => {
      const result = dijkstra(cityGraph, 'n_pari_hub', 'n_pari_hub');
      expect(result.success).toBe(true);
      expect(result.totalCost).toBe(0);
      expect(result.path).toEqual(['n_pari_hub']);

      const aResult = astar(cityGraph, 'n_pari_hub', 'n_pari_hub');
      expect(aResult.success).toBe(true);
      expect(aResult.totalCost).toBe(0);
      expect(aResult.path).toEqual(['n_pari_hub']);
    });

    it('Dijkstra and A* cost agreement on multiple random pairs in the synthetic city graph', () => {
      const testPairs = [
        { from: 'n_kp3_dtc', to: 'n_pari_east' },
        { from: 'n_exp_3', to: 'n_alpha1_center' },
        { from: 'n_surajpur_south', to: 'n_delta1_east' },
        { from: 'n_gamma1_hub', to: 'n_kasna_1' },
      ];

      for (const pair of testPairs) {
        const dRes = dijkstra(cityGraph, pair.from, pair.to);
        const aRes = astar(cityGraph, pair.from, pair.to);

        if (dRes.success && aRes.success) {
          const delta = Math.abs(dRes.totalCost - aRes.totalCost);
          expect(delta).toBeLessThan(0.001);
        } else {
          expect(dRes.success).toBe(aRes.success);
        }
      }
    });
  });

  describe('Combined Road ETA and Seat Availability Optimization', () => {
    it('calculates seat penalties and readiness levels correctly', () => {
      // Full hospital: high penalty
      const full = calculateSeatIntakeFactor({ status: 'FULL', icuBedsFree: 0, emergencyWardFree: 0 }, 'trauma_center');
      expect(full.seatPenaltySec).toBe(900);
      expect(full.seatReadinessLevel).toBe('CRITICAL');

      // ICU full for trauma: 420s diversion penalty
      const icuZero = calculateSeatIntakeFactor({ status: 'AVAILABLE', icuBedsFree: 0, emergencyWardFree: 10 }, 'trauma_center');
      expect(icuZero.seatPenaltySec).toBe(420);
      expect(icuZero.seatReadinessLevel).toBe('CRITICAL');

      // High capacity: bonus readiness (-60s)
      const optimal = calculateSeatIntakeFactor({ status: 'AVAILABLE', icuBedsFree: 6, emergencyWardFree: 20 }, 'trauma_center');
      expect(optimal.seatPenaltySec).toBe(-60);
      expect(optimal.seatReadinessLevel).toBe('OPTIMAL');
    });

    it('combines road traversal time and seat readiness in multi-criteria ranking', () => {
      const cityGraph = computeGraphWeights(getDefaultGraph(), 'morning_peak', 'clear', false, new Map());
      
      const hospitals = [
        {
          id: 'hosp_close_full',
          name: 'Close Hospital with Zero Beds',
          nodeId: 'n_kp3_dtc', // 0 travel time
          specialties: ['trauma_center'],
          bedAvailability: { status: 'FULL', icuBedsFree: 0, emergencyWardFree: 0 },
        },
        {
          id: 'hosp_far_available',
          name: 'Hospital with Available Seats',
          nodeId: 'n_pari_east', // ~300 sec away
          specialties: ['trauma_center'],
          bedAvailability: { status: 'AVAILABLE', icuBedsFree: 5, emergencyWardFree: 15 },
        },
      ];

      const ranking = rankHospitalsForEmergency(hospitals, 'n_kp3_dtc', cityGraph, 'TRAUMA', 'astar');
      
      // Because hosp_close_full has a 900s diversion penalty, hosp_far_available wins!
      expect(ranking.bestRecommendation.id).toBe('hosp_far_available');
      expect(ranking.bestRecommendation.seatReadinessLevel).toBe('OPTIMAL');
    });
  });
});
