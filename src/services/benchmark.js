/**
 * Algorithm Benchmark Service.
 *
 * Runs Dijkstra and A* pathfinding on identical graphs, edge weights, and source/hospital pairs.
 * Evaluates:
 *   1. Correctness: Checks if both algorithms yield identical optimal route travel times.
 *   2. Search Effort: Compares nodes expanded from the open priority queue.
 *   3. Latency: Measures elapsed execution time in milliseconds.
 *
 * Scientific note: A* is not claimed to be faster in every case. Its speedup depends
 * on graph structure, road network topology, and the tightness of the lower-bound heuristic.
 */

import { dijkstra } from '../algorithms/dijkstra.js';
import { astar } from '../algorithms/astar.js';

function countInvalidPathEdges(path, graphEdges) {
  if (!Array.isArray(path) || path.length < 2) return 0;

  let invalidCount = 0;
  for (let index = 0; index < path.length - 1; index++) {
    const from = path[index];
    const to = path[index + 1];
    const hasUsableDirectedEdge = graphEdges.some((edge) => {
      if (edge.from !== from || edge.to !== to || edge.closed) return false;
      const weight = edge.weight ?? edge.weightMinutes;
      return weight === undefined || (Number.isFinite(weight) && weight >= 0);
    });

    if (!hasUsableDirectedEdge) invalidCount++;
  }
  return invalidCount;
}

/**
 * Runs a comparative benchmark across N source-hospital pairs on a weighted graph.
 *
 * @param {Object} weightedGraph Graph with precomputed travel-time weights
 * @param {Array<Object>} hospitals Available hospital candidates
 * @param {number} [pairCount=10] Number of test pairs to sample
 * @returns {{
 *   pairResults: Array<Object>,
 *   summary: Object,
 *   allCostsMatched: boolean
 * }}
 */
export function runAlgorithmBenchmark(weightedGraph, hospitals, pairCount = 10) {
  if (!weightedGraph || !Array.isArray(weightedGraph.nodes) || !Array.isArray(hospitals)) {
    return {
      pairResults: [],
      summary: { totalPairs: 0, costAgreementRate: 0, avgDijkstraTimeMs: 0, avgAStarTimeMs: 0, invalidEdgesUsed: 0 },
      allCostsMatched: true,
    };
  }

  const nodes = weightedGraph.nodes;
  const hospitalNodeIds = hospitals.map((h) => h.nodeId);
  const pairResults = [];

  let totalDijkstraTime = 0;
  let totalAStarTime = 0;
  let totalDijkstraNodes = 0;
  let totalAStarNodes = 0;
  let matches = 0;
  let successfulPairs = 0;
  let invalidEdgesUsed = 0;

  // Deterministic seed / sampling to allow reproducible comparisons
  for (let i = 0; i < pairCount; i++) {
    const sourceNode = nodes[(i * 7 + 3) % nodes.length];
    const hospitalIndex = i % hospitals.length;
    const targetHospital = hospitals[hospitalIndex];

    const sourceId = sourceNode.id;
    const targetId = targetHospital.nodeId;

    // Run Dijkstra (correctness baseline)
    const dResult = dijkstra(weightedGraph, sourceId, targetId);

    // Run A* (goal-directed heuristic search)
    const aResult = astar(weightedGraph, sourceId, targetId);

    // Confirm returned paths follow real directed edges and never cross hard closures.
    invalidEdgesUsed += countInvalidPathEdges(dResult.path, weightedGraph.edges);
    invalidEdgesUsed += countInvalidPathEdges(aResult.path, weightedGraph.edges);

    // Both should either both succeed or both fail
    const bothSucceeded = dResult.success && aResult.success;
    const bothFailed = !dResult.success && !aResult.success;

    // Check cost agreement (within floating point epsilon 1e-4)
    const costDelta = Math.abs(dResult.totalCost - aResult.totalCost);
    const costsMatch = bothFailed || (bothSucceeded && costDelta < 0.001);

    if (costsMatch) matches++;
    if (bothSucceeded) {
      successfulPairs++;
      totalDijkstraTime += dResult.queryTimeMs;
      totalAStarTime += aResult.queryTimeMs;
      totalDijkstraNodes += dResult.nodesExpanded;
      totalAStarNodes += aResult.nodesExpanded;
    }

    pairResults.push({
      pairId: i + 1,
      sourceId,
      sourceName: sourceNode.name || sourceId,
      hospitalId: targetHospital.id,
      hospitalName: targetHospital.name,
      targetId,
      dijkstraCost: dResult.success ? Number(dResult.totalCost.toFixed(1)) : 'Unreachable',
      astarCost: aResult.success ? Number(aResult.totalCost.toFixed(1)) : 'Unreachable',
      costsMatch,
      costDelta: costsMatch ? 0 : Number(costDelta.toFixed(2)),
      dijkstraNodes: dResult.nodesExpanded,
      astarNodes: aResult.nodesExpanded,
      dijkstraTimeMs: dResult.queryTimeMs,
      astarTimeMs: aResult.queryTimeMs,
      nodesReducedPercent: dResult.nodesExpanded > 0
        ? Number((((dResult.nodesExpanded - aResult.nodesExpanded) / dResult.nodesExpanded) * 100).toFixed(1))
        : 0,
      bothSucceeded,
    });
  }

  const denominator = successfulPairs || 1;
  const summary = {
    totalPairs: pairCount,
    successfulPairs,
    costAgreementRate: Number(((matches / pairCount) * 100).toFixed(1)),
    avgDijkstraTimeMs: Number((totalDijkstraTime / denominator).toFixed(3)),
    avgAStarTimeMs: Number((totalAStarTime / denominator).toFixed(3)),
    avgDijkstraNodes: Math.round(totalDijkstraNodes / denominator),
    avgAStarNodes: Math.round(totalAStarNodes / denominator),
    avgSearchReductionPercent: totalDijkstraNodes > 0
      ? Number((((totalDijkstraNodes - totalAStarNodes) / totalDijkstraNodes) * 100).toFixed(1))
      : 0,
    invalidEdgesUsed,
  };

  return {
    pairResults,
    summary,
    allCostsMatched: matches === pairCount,
  };
}
