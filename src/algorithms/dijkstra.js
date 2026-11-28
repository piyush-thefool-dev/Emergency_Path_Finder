/**
 * Dijkstra's Shortest Path Algorithm (Correctness Baseline).
 *
 * Implements the single-source shortest path algorithm using:
 *   - Binary Min-Heap Priority Queue
 *   - Cumulative cost map g(n)
 *   - Predecessor map for path reconstruction
 *   - Closed set (settled nodes)
 *
 * Time Complexity: O((|V| + |E|) log |V|)
 * Space Complexity: O(|V| + |E|)
 *
 * Returns:
 *   - path: Array of node IDs from source to target
 *   - totalCost: Cumulative travel-time cost along the optimal path
 *   - nodesExpanded: Count of nodes removed from search frontier
 *   - queryTimeMs: Execution duration measured with performance.now()
 *   - success: Boolean indicating if target was reached
 */

import { MinHeap } from './minHeap.js';
import { buildAdjacencyList, reconstructPath } from './pathUtils.js';

/**
 * Executes Dijkstra's algorithm from source to optional target.
 *
 * @param {Object} graph Object containing { nodes, edges }
 * @param {string|number} sourceId Starting node ID
 * @param {string|number} [targetId] Destination node ID (if omitted, computes tree to all reachable nodes)
 * @param {Map<string|number, Array<Object>>} [customAdjacency] Optional precomputed adjacency list
 * @returns {{
 *   path: Array<string|number>,
 *   totalCost: number,
 *   nodesExpanded: number,
 *   queryTimeMs: number,
 *   success: boolean,
 *   costMap: Map<string|number, number>,
 *   predecessors: Map<string|number, string|number>
 * }}
 */
export function dijkstra(graph, sourceId, targetId = null, customAdjacency = null) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return {
      path: [],
      totalCost: Infinity,
      nodesExpanded: 0,
      queryTimeMs: 0,
      success: false,
      costMap: new Map(),
      predecessors: new Map(),
    };
  }

  if (targetId !== null && sourceId === targetId) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      path: [sourceId],
      totalCost: 0,
      nodesExpanded: 1,
      queryTimeMs: Number(elapsed.toFixed(3)),
      success: true,
      costMap: new Map([[sourceId, 0]]),
      predecessors: new Map(),
    };
  }

  const adj = customAdjacency || buildAdjacencyList(graph.edges);
  const minHeap = new MinHeap();
  const gScore = new Map();
  const predecessors = new Map();
  const closedSet = new Set();
  let nodesExpanded = 0;

  gScore.set(sourceId, 0);
  minHeap.push(sourceId, 0);

  while (!minHeap.isEmpty()) {
    const current = minHeap.pop();
    if (!current) break;

    const u = current.id;
    const currentCost = current.priority;

    // Skip if already settled with lower cost
    if (closedSet.has(u)) continue;

    closedSet.add(u);
    nodesExpanded++;

    // Early termination if target is reached
    if (targetId !== null && u === targetId) {
      break;
    }

    const outgoing = adj.get(u) || [];
    for (const edge of outgoing) {
      const v = edge.to;
      if (closedSet.has(v)) continue;

      // Extract edge weight (seconds or minutes as configured)
      const weight = edge.weight !== undefined ? edge.weight : (edge.weightMinutes || 0);

      // Invariant: Non-negative edge weight
      if (weight < 0) {
        console.warn(`Encountered negative edge weight on ${edge.id}: ${weight}`);
        continue;
      }

      const tentativeG = currentCost + weight;
      const knownG = gScore.get(v);

      if (knownG === undefined || tentativeG < knownG) {
        gScore.set(v, tentativeG);
        predecessors.set(v, u);
        minHeap.push(v, tentativeG);
      }
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const queryTimeMs = Number((endTime - startTime).toFixed(3));

  if (targetId !== null) {
    const targetReached = gScore.has(targetId) && closedSet.has(targetId);
    const path = targetReached ? reconstructPath(predecessors, targetId, sourceId) : [];
    const totalCost = targetReached ? gScore.get(targetId) : Infinity;

    return {
      path,
      totalCost,
      nodesExpanded,
      queryTimeMs,
      success: path.length > 0,
      costMap: gScore,
      predecessors,
    };
  }

  return {
    path: [],
    totalCost: 0,
    nodesExpanded,
    queryTimeMs,
    success: true,
    costMap: gScore,
    predecessors,
  };
}
