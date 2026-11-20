/**
 * Graph Loader Service.
 *
 * Provides a decoupled ingestion interface for road network graphs.
 * Structured so that real OpenStreetMap graphs exported via OSMnx, NetworkX,
 * or Overpass JSON can be dropped in without changing any UI or algorithm code.
 *
 * Expected Graph JSON Schema:
 * {
 *   "id": "string",
 *   "name": "string",
 *   "disclaimer": "string",
 *   "bounds": { "minLat": number, "maxLat": number, "minLon": number, "maxLon": number },
 *   "nodes": [
 *     { "id": "string|number", "name": "string", "lat": number, "lon": number, "type"?: "string" }
 *   ],
 *   "edges": [
 *     {
 *       "id": "string",
 *       "from": "string|number",
 *       "to": "string|number",
 *       "lengthM": number,
 *       "roadType": "motorway"|"primary"|"secondary"|"tertiary"|"residential"|"unclassified",
 *       "speedLimitKph"?: number,
 *       "lanes"?: number,
 *       "hasSignal"?: boolean,
 *       "isNarrow"?: boolean,
 *       "hasSpeedBreaker"?: boolean,
 *       "inSchoolZone"?: boolean,
 *       "closed"?: boolean,
 *       "isOneWay"?: boolean
 *     }
 *   ]
 * }
 */

import { SYNTHETIC_NODES, SYNTHETIC_EDGES, SYNTHETIC_GRAPH_METADATA } from '../data/syntheticCityGraph.js';
import { getRealGreaterNoidaOsmGraph } from '../data/delhiNcrRoadGraph.js';
import { FIGURE_2_DEMO_GRAPH } from '../data/demoGraphFigure2.js';
import { validateGraph, validateEdge } from '../utils/validators.js';

export const GRAPH_JSON_SCHEMA_DEFINITION = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'EmergencyPathFinderRoadGraph',
  type: 'object',
  required: ['id', 'nodes', 'edges'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    disclaimer: { type: 'string' },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'lat', 'lon'],
        properties: {
          id: { type: ['string', 'number'] },
          name: { type: 'string' },
          lat: { type: 'number' },
          lon: { type: 'number' },
        },
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'from', 'to', 'lengthM'],
        properties: {
          id: { type: 'string' },
          from: { type: ['string', 'number'] },
          to: { type: ['string', 'number'] },
          lengthM: { type: 'number' },
          roadType: { type: 'string' },
          speedLimitKph: { type: 'number' },
          lanes: { type: 'integer' },
          hasSignal: { type: 'boolean' },
          isNarrow: { type: 'boolean' },
          hasSpeedBreaker: { type: 'boolean' },
          inSchoolZone: { type: 'boolean' },
          closed: { type: 'boolean' },
        },
      },
    },
  },
};

/**
 * Loads and validates a graph data structure.
 *
 * @param {Object} rawData Graph JSON or object
 * @returns {{ graph: Object, isValid: boolean, errors: Array<string> }}
 */
export function loadGraph(rawData) {
  const validation = validateGraph(rawData);

  if (!validation.isValid) {
    return {
      graph: null,
      isValid: false,
      errors: validation.warnings,
    };
  }

  // Filter out any individually invalid edges
  const validEdges = rawData.edges.filter((e) => validateEdge(e).isValid);

  return {
    graph: {
      ...rawData,
      edges: validEdges,
    },
    isValid: true,
    errors: [],
  };
}

/**
 * Returns the verified real-world OpenStreetMap Greater Noida road network graph.
 *
 * @returns {Object}
 */
export function getRealOsmGraph() {
  return getRealGreaterNoidaOsmGraph();
}

/**
 * Returns the default road network graph.
 * Defaults to the real-world OpenStreetMap Greater Noida network.
 *
 * @param {boolean} [preferRealOsm=true]
 * @returns {Object}
 */
export function getDefaultGraph(preferRealOsm = true) {
  if (preferRealOsm) {
    return getRealGreaterNoidaOsmGraph();
  }
  return {
    ...SYNTHETIC_GRAPH_METADATA,
    nodes: [...SYNTHETIC_NODES],
    edges: [...SYNTHETIC_EDGES],
    unit: 'seconds',
    isSchematic: false,
  };
}

/**
 * Returns the exact 6-node Figure 2 demo graph from the report.
 *
 * @returns {Object}
 */
export function getFigure2Graph() {
  return {
    ...FIGURE_2_DEMO_GRAPH,
  };
}
