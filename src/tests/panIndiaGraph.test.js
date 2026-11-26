/**
 * Pan-India Road Graph Topology and Hospital Registry Integrity Verification.
 * Enforces topological invariants, coordinate bounding, and A* / Dijkstra routing agreement across India.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PAN_INDIA_HOSPITALS } from '../data/panIndiaHospitals.js';
import { INDIAN_STATES_AND_UTS, groupHospitalsByState } from '../utils/hospitalState.js';
import { getRealGreaterNoidaOsmGraph } from '../data/delhiNcrRoadGraph.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { astar } from '../algorithms/astar.js';
import { computeGraphWeights } from '../services/edgeWeights.js';

describe('Pan-India Healthcare Registry & Road Graph Invariants', () => {
  const fullGraph = getRealGreaterNoidaOsmGraph();
  const nodeMap = new Map(fullGraph.nodes.map((n) => [n.id, n]));

  it('contains 360 verified apex hospitals covering all 36 Indian States and Union Territories', () => {
    assert.strictEqual(PAN_INDIA_HOSPITALS.length, 360);
    const uniqueIds = new Set(PAN_INDIA_HOSPITALS.map((h) => h.id));
    assert.strictEqual(uniqueIds.size, 360, 'Every hospital must have a unique ID');
    const stateGroups = groupHospitalsByState(PAN_INDIA_HOSPITALS);
    assert.strictEqual(
      stateGroups.length,
      INDIAN_STATES_AND_UTS.length,
      'Must cover all 28 States and 8 Union Territories (36 jurisdictions)'
    );
  });

  it('every hospital maps to an existing node in the road graph with valid GPS coordinates', () => {
    for (const hosp of PAN_INDIA_HOSPITALS) {
      assert.ok(
        nodeMap.has(hosp.nodeId),
        `Hospital ${hosp.id} (${hosp.name}) references non-existent node: ${hosp.nodeId}`
      );
      assert.ok(
        hosp.lat >= 8.0 && hosp.lat <= 36.0,
        `Hospital ${hosp.id} latitude ${hosp.lat} outside Indian territory`
      );
      assert.ok(
        hosp.lon >= 68.0 && hosp.lon <= 96.0,
        `Hospital ${hosp.id} longitude ${hosp.lon} outside Indian territory`
      );
      assert.ok(hosp.phone && hosp.phone.startsWith('+91'), `Hospital ${hosp.id} missing valid phone`);
      assert.ok(hosp.bedAvailability && hosp.bedAvailability.totalCapacity > 0, `Hospital ${hosp.id} missing capacity`);
    }
  });

  it('the complete Pan-India road graph has zero dangling edges', () => {
    for (const edge of fullGraph.edges) {
      assert.ok(nodeMap.has(edge.from), `Edge ${edge.id} has invalid from node: ${edge.from}`);
      assert.ok(nodeMap.has(edge.to), `Edge ${edge.id} has invalid to node: ${edge.to}`);
      assert.ok(edge.lengthM > 0, `Edge ${edge.id} must have positive length`);
      assert.ok(edge.speedLimitKph > 0, `Edge ${edge.id} must have positive speed limit`);
    }
  });

  it('verifies deterministic A* and Dijkstra routing from Delhi-NCR to multi-zone Pan-India apex hospitals', () => {
    const weightedGraph = computeGraphWeights(fullGraph, {
      timeOfDay: 'morning_peak',
      weather: 'clear',
      signalPriorityEnabled: true,
      incidents: new Map(),
    });

    const sourceNodeId = 'n_chi4_expressway';
    const testTargets = [
      { name: 'KEM Mumbai', nodeId: 'n_mum_parel_kem' },
      { name: 'NIMHANS Bengaluru', nodeId: 'n_blr_nimhans_hosur' },
      { name: 'RGGGH Chennai', nodeId: 'n_chn_rgggh_park' },
      { name: 'SSKM Kolkata', nodeId: 'n_kol_sskm_exide' },
      { name: 'PGIMER Chandigarh', nodeId: 'n_chd_pgimer' },
      { name: 'AIIMS Rishikesh', nodeId: 'n_rsh_aiims_virbhadra' },
      { name: 'Amrita Kochi', nodeId: 'n_cok_amrita_ponekkara' },
      { name: 'SMS Jaipur', nodeId: 'n_jpr_sms_jlnmarg' },
      { name: 'AIIMS Bhopal', nodeId: 'n_bpl_saketnagar_aiims' },
      { name: 'GMCH Guwahati', nodeId: 'n_gwh_gmch_bhangagarh' },
      { name: 'STNM Gangtok (Sikkim)', nodeId: 'n_gtg_stnm_gangtok' },
      { name: 'TRIHMS Naharlagun (Arunachal)', nodeId: 'n_ita_trhims_naharlagun' },
      { name: 'SNM Leh (Ladakh)', nodeId: 'n_leh_snm_skara' },
      { name: 'GB Pant Port Blair (A&N)', nodeId: 'n_pbl_gbpant_portblair' },
    ];

    for (const target of testTargets) {
      const dResult = dijkstra(weightedGraph, sourceNodeId, target.nodeId);
      const aResult = astar(weightedGraph, sourceNodeId, target.nodeId);

      assert.strictEqual(dResult.success, true, `Dijkstra should find path to ${target.name}`);
      assert.strictEqual(aResult.success, true, `A* should find path to ${target.name}`);
      const delta = Math.abs(dResult.totalCost - aResult.totalCost);
      assert.ok(
        delta < 0.01,
        `Cost divergence between Dijkstra (${dResult.totalCost}) and A* (${aResult.totalCost}) for ${target.name}`
      );
      assert.ok(
        aResult.nodesExpanded <= dResult.nodesExpanded,
        `A* nodes expanded (${aResult.nodesExpanded}) should be <= Dijkstra (${dResult.nodesExpanded}) for ${target.name}`
      );
    }
  });
});
