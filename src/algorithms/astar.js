/**
 * A* Goal-Directed Shortest Path Algorithm.
 *
 * Implements A* with the lower-bound travel-time heuristic:
 *   f(n) = g(n) + h(n)
 *
 * where:
 *   g(n) is the exact cumulative travel time from source to n
 *   h(n) is straight-line distance to target / max speed upper bound
 *
 * If heuristic cannot be computed, falls back safely to h(n) = 0.
 *
 * Returns:
 *   - path: Array of node IDs
 *   - totalCost: Cumulative optimal cost
 *   - nodesExpanded: Count of popped nodes
 *   - queryTimeMs: Elapsed execution time in ms
 *   - success: Boolean
 */

import { MinHeap } from './minHeap.js';
import { computeMaxSpeedMps, createTravelTimeHeuristic } from './heuristics.js';
import { buildAdjacencyList, reconstructPath } from './pathUtils.js';

/**
 * Executes A* search from source to target.
 *
 * @param {Object} graph Object containing { nodes, edges, unit? }
 * @param {string|number} sourceId Starting node identifier
 * @param {string|number} targetId Target node identifier
 * @param {Map<string|number, Array<Object>>} [customAdjacency] Optional precomputed adjacency
 * @param {function(Object): number} [customHeuristic] Optional custom heuristic function
 * @returns {{
 *   path: Array<string|number>,
 *   totalCost: number,
 *   nodesExpanded: number,
 *   queryTimeMs: number,
 *   success: boolean
 * }}
 */
export function astar(graph, sourceId, targetId, customAdjacency = null, customHeuristic = null) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return {
      path: [],
      totalCost: Infinity,
      nodesExpanded: 0,
      queryTimeMs: 0,
      success: false,
    };
  }

  // Trivial source = target
  if (sourceId === targetId) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      path: [sourceId],
      totalCost: 0,
      nodesExpanded: 1,
      queryTimeMs: Number(elapsed.toFixed(3)),
      success: true,
    };
  }

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const targetNode = nodeMap.get(targetId);

  // Setup heuristic
  let heuristicFn = customHeuristic;
  if (!heuristicFn) {
    const unit = graph.unit || 'seconds';
    const maxSpeedMps = computeMaxSpeedMps(graph.edges);
    heuristicFn = createTravelTimeHeuristic(targetNode, maxSpeedMps, unit);
  }

  const adj = customAdjacency || buildAdjacencyList(graph.edges);
  const openSet = new MinHeap();
  const gScore = new Map();
  const fScore = new Map();
  const predecessors = new Map();
  const closedSet = new Set();
  let nodesExpanded = 0;

  const startNode = nodeMap.get(sourceId);
  const initialH = heuristicFn(startNode);

  gScore.set(sourceId, 0);
  fScore.set(sourceId, initialH);
  openSet.push(sourceId, initialH);

  while (!openSet.isEmpty()) {
    const current = openSet.pop();
    if (!current) break;

    const u = current.id;

    if (closedSet.has(u)) continue;
    closedSet.add(u);
    nodesExpanded++;

    // Reached destination
    if (u === targetId) {
      break;
    }

    const outgoing = adj.get(u) || [];
    const currentG = gScore.get(u) ?? Infinity;

    for (const edge of outgoing) {
      const v = edge.to;
      if (closedSet.has(v)) continue;

      const weight = edge.weight !== undefined ? edge.weight : (edge.weightMinutes || 0);
      if (weight < 0) continue;

      const tentativeG = currentG + weight;
      const knownG = gScore.get(v);

      if (knownG === undefined || tentativeG < knownG) {
        predecessors.set(v, u);
        gScore.set(v, tentativeG);

        const vNode = nodeMap.get(v);
        const hVal = heuristicFn(vNode);
        const fVal = tentativeG + hVal;
        fScore.set(v, fVal);

        openSet.push(v, fVal);
      }
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const queryTimeMs = Number((endTime - startTime).toFixed(3));

  const targetReached = gScore.has(targetId) && closedSet.has(targetId);
  const path = targetReached ? reconstructPath(predecessors, targetId, sourceId) : [];
  const totalCost = targetReached ? gScore.get(targetId) : Infinity;

  return {
    path,
    totalCost,
    nodesExpanded,
    queryTimeMs,
    success: path.length > 0,
  };
}
