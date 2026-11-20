/**
 * Graph traversal and path reconstruction utilities.
 */

/**
 * Reconstructs a sequential node ID path from a predecessor map.
 *
 * @param {Map<string|number, string|number>} predecessors Map of nodeId -> parentNodeId
 * @param {string|number} targetId Target node identifier
 * @param {string|number} sourceId Source node identifier
 * @returns {Array<string|number>} Ordered array of node IDs from source to target
 */
export function reconstructPath(predecessors, targetId, sourceId) {
  if (!predecessors || targetId === undefined) return [];
  if (targetId === sourceId) return [sourceId];

  const path = [];
  let curr = targetId;

  while (curr !== undefined && curr !== null) {
    path.push(curr);
    if (curr === sourceId) break;
    curr = predecessors.get(curr);
  }

  // If we never reached the source, target was unreachable
  if (path[path.length - 1] !== sourceId) {
    return [];
  }

  return path.reverse();
}

/**
 * Builds an adjacency list representation from an edge list.
 * Storage complexity: O(|V| + |E|).
 *
 * @param {Array<Object>} edges Array of edge objects { id, from, to, weight, closed, ... }
 * @returns {Map<string|number, Array<Object>>} Map of nodeId -> outgoing edges
 */
export function buildAdjacencyList(edges) {
  const adj = new Map();

  for (const edge of edges) {
    if (edge.closed) continue; // Respect hard closure constraint

    if (!adj.has(edge.from)) {
      adj.set(edge.from, []);
    }
    adj.get(edge.from).push(edge);
  }

  return adj;
}

/**
 * Maps a sequence of node IDs to the corresponding edge objects and cumulative distance.
 *
 * @param {Array<string|number>} pathNodeIds Ordered list of node IDs
 * @param {Array<Object>} edges Edge list
 * @returns {{ pathEdges: Array<Object>, totalDistanceM: number }}
 */
export function extractPathDetails(pathNodeIds, edges) {
  if (!Array.isArray(pathNodeIds) || pathNodeIds.length <= 1) {
    return { pathEdges: [], totalDistanceM: 0 };
  }

  // Index directed edges by 'from->to'
  const edgeMap = new Map();
  for (const e of edges) {
    const key = `${e.from}->${e.to}`;
    // If multiple parallel edges exist, pick smallest weight
    if (!edgeMap.has(key) || (e.weight !== undefined && e.weight < edgeMap.get(key).weight)) {
      edgeMap.set(key, e);
    }
  }

  const pathEdges = [];
  let totalDistanceM = 0;

  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const from = pathNodeIds[i];
    const to = pathNodeIds[i + 1];
    const key = `${from}->${to}`;
    const edge = edgeMap.get(key);

    if (edge) {
      pathEdges.push(edge);
      totalDistanceM += edge.lengthM || 0;
    }
  }

  return { pathEdges, totalDistanceM };
}
