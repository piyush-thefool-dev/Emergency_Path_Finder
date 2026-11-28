/**
 * Graph Loader Service.
 *
 * Lazily code-splits the Pan-India & Delhi-NCR road graph via dynamic import()
 * so initial bundle startup stays small while full topology loads on demand.
 */

import { SYNTHETIC_NODES, SYNTHETIC_EDGES, SYNTHETIC_GRAPH_METADATA } from '../data/syntheticCityGraph.js';
import { FIGURE_2_DEMO_GRAPH } from '../data/sampleGraph.js';
import { validateGraph, validateEdge } from '../utils/validators.js';

let cachedMasterOsmGraph = null;
let masterOsmPromise = null;

function buildSyntheticGraph() {
  return {
    ...SYNTHETIC_GRAPH_METADATA,
    nodes: [...SYNTHETIC_NODES],
    edges: [...SYNTHETIC_EDGES],
    unit: 'seconds',
    isSchematic: false,
  };
}

export async function loadRealOsmGraph() {
  if (cachedMasterOsmGraph) {
    return cachedMasterOsmGraph;
  }
  if (masterOsmPromise) {
    return masterOsmPromise;
  }

  masterOsmPromise = import('../data/delhiNcrRoadGraph.js')
    .then((mod) => {
      cachedMasterOsmGraph = mod.getRealGreaterNoidaOsmGraph();
      masterOsmPromise = null;
      return cachedMasterOsmGraph;
    })
    .catch((err) => {
      masterOsmPromise = null;
      throw err;
    });

  return masterOsmPromise;
}

export async function loadDefaultGraph(preferRealOsm = true) {
  if (preferRealOsm) {
    return loadRealOsmGraph();
  }
  return buildSyntheticGraph();
}

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
          type: { type: 'string' },
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
 * Returns the verified real-world OpenStreetMap Greater Noida road network graph
 * once loaded, or the lightweight synthetic grid while loading.
 */
export function getRealOsmGraph() {
  return cachedMasterOsmGraph || buildSyntheticGraph();
}

/**
 * Returns the default road network graph.
 */
export function getDefaultGraph(preferRealOsm = true) {
  if (preferRealOsm && cachedMasterOsmGraph) {
    return cachedMasterOsmGraph;
  }
  return buildSyntheticGraph();
}

/**
 * Returns the exact 6-node Figure 2 demo graph from the report.
 */
export function getFigure2Graph() {
  return {
    ...FIGURE_2_DEMO_GRAPH,
  };
}

/**
 * Returns the Western Emergency Corridor Subgraph
 * (Mumbai, Pune, Nashik, Aurangabad, Ahmedabad, Surat, Vadodara, Rajkot, Goa).
 */
export function getWesternCorridorGraph() {
  const master = getRealOsmGraph();
  const westPrefixes = ['n_mum', 'n_pun', 'n_nsk', 'n_abn', 'n_ahd', 'n_srt', 'n_vdr', 'n_rjt', 'n_goa'];
  const nodes = master.nodes.filter((n) => westPrefixes.some((p) => String(n.id).startsWith(p)));
  const nodeSet = new Set(nodes.map((n) => n.id));
  const edges = master.edges.filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to));
  return {
    id: 'western_corridor_graph_v1',
    name: 'Western Emergency Corridor (Mumbai-Pune-Gujarat-Goa)',
    disclaimer: 'Extracted Western India arterial and expressway corridors.',
    nodes,
    edges,
    unit: 'seconds',
    isSchematic: false,
  };
}

/**
 * Returns the Southern Peninsular Trauma Grid Subgraph
 * (Bengaluru, Mysuru, Mangaluru, Chennai, Coimbatore, Madurai, Trichy, Hyderabad, Vizag, Vijayawada, Kochi, Trivandrum).
 */
export function getSouthernCorridorGraph() {
  const master = getRealOsmGraph();
  const southPrefixes = [
    'n_blr', 'n_mys', 'n_mng', 'n_hbl', 'n_chn', 'n_cbe', 'n_mdu', 'n_trc',
    'n_cok', 'n_trv', 'n_ccj', 'n_tsr', 'n_hyd', 'n_bbn', 'n_wgl', 'n_vzg',
    'n_bza', 'n_gnt', 'n_tpt', 'n_pny',
  ];
  const nodes = master.nodes.filter((n) => southPrefixes.some((p) => String(n.id).startsWith(p)));
  const nodeSet = new Set(nodes.map((n) => n.id));
  const edges = master.edges.filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to));
  return {
    id: 'southern_corridor_graph_v1',
    name: 'Southern Peninsular Trauma Grid (Bengaluru-Chennai-Hyderabad-Kochi)',
    disclaimer: 'Extracted Southern India healthcare and highway networks.',
    nodes,
    edges,
    unit: 'seconds',
    isSchematic: false,
  };
}

/**
 * Returns the High-Density Delhi-NCR Metropolitan Road Graph.
 */
export function getDelhiNcrUrbanGraph() {
  const master = getRealOsmGraph();
  const ncrNodes = master.nodes.filter(
    (n) =>
      !String(n.id).startsWith('n_') ||
      n.id.includes('pari') ||
      n.id.includes('delhi') ||
      n.id.includes('noida') ||
      n.id.includes('gzb') ||
      n.id.includes('fbd') ||
      n.id.includes('gurgaon')
  );
  const ncrNodeSet = new Set(ncrNodes.map((n) => n.id));
  const edges = master.edges.filter((e) => ncrNodeSet.has(e.from) && ncrNodeSet.has(e.to));
  return {
    id: 'delhi_ncr_urban_graph_v1',
    name: 'Delhi-NCR Metropolitan High-Density Urban Grid',
    disclaimer: 'Dense urban street network for Greater Noida, Noida, Delhi, Gurugram, and Ghaziabad.',
    nodes: ncrNodes,
    edges,
    unit: 'seconds',
    isSchematic: false,
  };
}

export const GRAPH_MODES_CATALOG = [
  {
    id: 'real_osm',
    name: 'Pan-India National Highway & Metropolitan Grid',
    description: 'Complete nationwide 1,356-node / 2,876-edge topology connecting all 35,000 verified healthcare facilities across 36 States & UTs.',
    nodeCount: 1356,
    edgeCount: 2876,
    badge: 'ALL INDIA',
  },
  {
    id: 'western_corridor',
    name: 'Western Emergency Corridor',
    description: 'High-speed coastal and industrial expressway corridor (Mumbai, Pune, Ahmedabad, Surat, Goa).',
    nodeCount: 34,
    edgeCount: 66,
    badge: 'WEST ZONE',
  },
  {
    id: 'southern_corridor',
    name: 'Southern Peninsular Trauma Grid',
    description: 'Inter-state emergency network linking Bengaluru, Chennai, Hyderabad, and Kerala medical hubs.',
    nodeCount: 47,
    edgeCount: 98,
    badge: 'SOUTH ZONE',
  },
  {
    id: 'delhi_ncr',
    name: 'Delhi-NCR Metropolitan Urban Grid',
    description: 'High-density urban street topology with grade separators, flyovers, and local expressways.',
    nodeCount: 105,
    edgeCount: 264,
    badge: 'NCR METRO',
  },
  {
    id: 'synthetic',
    name: 'Synthetic 46-Node Benchmark Grid',
    description: 'Calibrated urban road graph with known theoretical shortest path benchmarks.',
    nodeCount: 46,
    edgeCount: 136,
    badge: 'SYNTHETIC',
  },
  {
    id: 'figure_2',
    name: 'Figure 2 Algorithmic Proof Demonstration Graph',
    description: 'The exact 6-node pedagogical graph from Figure 2 for algorithm validation.',
    nodeCount: 6,
    edgeCount: 7,
    badge: 'ACADEMIC',
  },
];
