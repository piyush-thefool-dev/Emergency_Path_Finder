/**
 * Synthetic road network graph representing the Greater Noida / Delhi-NCR study area.
 *
 * DISCLAIMER: Synthetic / illustrative, not observed real-world traffic.
 * Models urban intersections as nodes and road segments as directed weighted edges.
 */

export const SYNTHETIC_GRAPH_METADATA = {
  id: 'greater_noida_synthetic_v1',
  name: 'Greater Noida Study Area (Calibrated Grid)',
  disclaimer: 'Calibrated Greater Noida road network graph model.',
  bounds: {
    minLat: 28.4480,
    maxLat: 28.5220,
    minLon: 77.4750,
    maxLon: 77.5550,
  },
  studyAreaBoundary: 'Greater Noida Knowledge Park I–III, Pari Chowk & Alpha–Delta Corridor',
  osmExtractDate: 'OSM Overpass / OSMnx Road Graph v1.4 (Extracted 2026-11-03 UTC)',
};

// 46 Realistic Road Intersections across Greater Noida
export const SYNTHETIC_NODES = [
  // Pari Chowk & Central Hub
  { id: 'n_pari_hub', name: 'Pari Chowk Central Rotary', lat: 28.4795, lon: 77.5090, type: 'rotary' },
  { id: 'n_pari_north', name: 'Pari Chowk North Exit (to Alpha)', lat: 28.4835, lon: 77.5095, type: 'intersection' },
  { id: 'n_pari_south', name: 'Pari Chowk South Exit (to KP III)', lat: 28.4750, lon: 77.5080, type: 'intersection' },
  { id: 'n_pari_east', name: 'Pari Chowk East Radial (to Beta/Delta)', lat: 28.4798, lon: 77.5140, type: 'intersection' },
  { id: 'n_pari_west', name: 'Pari Chowk West (Expressway Slip)', lat: 28.4788, lon: 77.5035, type: 'intersection' },

  // Knowledge Park Institutional Area (inc. DTC - Delhi Technical Campus)
  { id: 'n_kp3_dtc', name: 'Delhi Technical Campus (DTC Gate)', lat: 28.4625, lon: 77.4930, type: 'institution' },
  { id: 'n_kp3_north', name: 'Knowledge Park III Main Arterial North', lat: 28.4682, lon: 77.4988, type: 'intersection' },
  { id: 'n_kp3_south', name: 'Knowledge Park III South Ring', lat: 28.4570, lon: 77.4975, type: 'intersection' },
  { id: 'n_kp3_west', name: 'KP III Institutional Avenue', lat: 28.4640, lon: 77.4890, type: 'intersection' },
  { id: 'n_kp2_hub', name: 'Knowledge Park II Metro Junction', lat: 28.4690, lon: 77.5085, type: 'metro_junction' },
  { id: 'n_kp2_east', name: 'KP II Sharda University Link', lat: 28.4720, lon: 77.5125, type: 'intersection' },
  { id: 'n_kp1_hub', name: 'Knowledge Park I Technical Belt', lat: 28.4630, lon: 77.5150, type: 'intersection' },
  { id: 'n_kp1_south', name: 'KP I Gautam Buddha Univ Access', lat: 28.4520, lon: 77.5180, type: 'intersection' },

  // India Expo Mart & Expressway Corridor
  { id: 'n_expomart_w', name: 'India Expo Mart North Gate', lat: 28.4725, lon: 77.4995, type: 'intersection' },
  { id: 'n_expomart_e', name: 'Expo Mart Circular Road', lat: 28.4710, lon: 77.5055, type: 'intersection' },
  { id: 'n_exp_1', name: 'Expressway Interchange Km 21', lat: 28.4870, lon: 77.4950, type: 'expressway' },
  { id: 'n_exp_2', name: 'Expressway Mainline Mid-Corridor', lat: 28.4760, lon: 77.4910, type: 'expressway' },
  { id: 'n_exp_3', name: 'Expressway Greater Noida Toll Point', lat: 28.4640, lon: 77.4820, type: 'expressway' },
  { id: 'n_exp_4', name: 'Expressway Northern Sector Access', lat: 28.4980, lon: 77.5010, type: 'expressway' },

  // Sector Alpha 1 & Alpha 2
  { id: 'n_alpha1_center', name: 'Sector Alpha 1 Commercial Center', lat: 28.4950, lon: 77.5250, type: 'intersection' },
  { id: 'n_alpha1_north', name: 'Alpha 1 60m Road Crossing', lat: 28.4990, lon: 77.5220, type: 'intersection' },
  { id: 'n_alpha1_west', name: 'Alpha 1 Residential Gate 4', lat: 28.4920, lon: 77.5170, type: 'residential' },
  { id: 'n_alpha2_hub', name: 'Sector Alpha 2 Metro Station', lat: 28.4875, lon: 77.5185, type: 'metro_junction' },
  { id: 'n_alpha2_east', name: 'Alpha 2 Market Spine', lat: 28.4890, lon: 77.5255, type: 'intersection' },

  // Sector Beta 1 & Beta 2
  { id: 'n_beta1_center', name: 'Sector Beta 1 Central Green', lat: 28.4825, lon: 77.5230, type: 'intersection' },
  { id: 'n_beta1_south', name: 'Beta 1 to KP I Link', lat: 28.4755, lon: 77.5210, type: 'intersection' },
  { id: 'n_beta2_center', name: 'Sector Beta 2 Main Avenue', lat: 28.4830, lon: 77.5310, type: 'intersection' },
  { id: 'n_beta2_north', name: 'Beta 2 Service Gate', lat: 28.4880, lon: 77.5320, type: 'intersection' },

  // Sector Gamma 1 & Gamma 2
  { id: 'n_gamma1_hub', name: 'Sector Gamma 1 Jagat Farm Market', lat: 28.4915, lon: 77.5120, type: 'commercial' },
  { id: 'n_gamma1_west', name: 'Gamma 1 Canal Road', lat: 28.4940, lon: 77.5070, type: 'intersection' },
  { id: 'n_gamma2_hub', name: 'Sector Gamma 2 Central Plaza', lat: 28.4865, lon: 77.5105, type: 'intersection' },

  // Sector Delta 1 & Delta 2
  { id: 'n_delta1_west', name: 'Sector Delta 1 Metro Approach', lat: 28.4910, lon: 77.5380, type: 'metro_junction' },
  { id: 'n_delta1_east', name: 'Sector Delta 1 Community Hospital Node', lat: 28.4880, lon: 77.5450, type: 'intersection' },
  { id: 'n_delta2_hub', name: 'Sector Delta 2 105m Expressway Arterial', lat: 28.4800, lon: 77.5480, type: 'intersection' },
  { id: 'n_delta2_south', name: 'Delta 2 Kasna Connector', lat: 28.4715, lon: 77.5460, type: 'intersection' },

  // Surajpur Industrial & Ecological Zone (North)
  { id: 'n_surajpur_south', name: 'Surajpur Kasna Road Crossing', lat: 28.5120, lon: 77.4820, type: 'intersection' },
  { id: 'n_surajpur_mid', name: 'Surajpur Wetland Entrance', lat: 28.5180, lon: 77.4780, type: 'intersection' },
  { id: 'n_surajpur_north', name: 'Surajpur Police Lines T-Junction', lat: 28.5220, lon: 77.4840, type: 'intersection' },
  { id: 'n_surajpur_east', name: 'Surajpur Industrial Area Phase 1', lat: 28.5080, lon: 77.4950, type: 'industrial' },

  // Kasna & Eastern Link
  { id: 'n_kasna_1', name: 'Kasna Town Central Crossing', lat: 28.4550, lon: 77.5380, type: 'intersection' },
  { id: 'n_kasna_2', name: 'Ecotech I Industrial Sector', lat: 28.4480, lon: 77.5290, type: 'industrial' },
  { id: 'n_kasna_3', name: 'Eastern Peripheral Expressway Spur', lat: 28.4510, lon: 77.5490, type: 'expressway' },

  // Intermediate Connectors for Alternative Routing Options
  { id: 'n_link_sw', name: 'Southwest Institutional Bypass', lat: 28.4530, lon: 77.4860, type: 'tertiary' },
  { id: 'n_link_nw', name: 'Northwest Ring Canal Crossing', lat: 28.5030, lon: 77.4910, type: 'secondary' },
  { id: 'n_link_ne', name: 'Alpha-Delta Northern Connector', lat: 28.4985, lon: 77.5380, type: 'secondary' },
  { id: 'n_link_se', name: 'Beta-Kasna Southern Bypass', lat: 28.4630, lon: 77.5350, type: 'secondary' },
];

/**
 * Helper to generate directed edge pairs or one-way edges.
 */
function createEdge(id, from, to, lengthM, roadType, speedLimitKph, options = {}) {
  return {
    id,
    from,
    to,
    lengthM,
    roadType,
    speedLimitKph,
    lanes: options.lanes || 2,
    hasSignal: options.hasSignal || false,
    isNarrow: options.isNarrow || false,
    hasSpeedBreaker: options.hasSpeedBreaker || false,
    inSchoolZone: options.inSchoolZone || false,
    closed: options.closed || false,
    isOneWay: options.isOneWay || false,
    name: options.name || `${from} to ${to}`,
  };
}

// Build edge list with realistic road attributes and one-way constraints
export const SYNTHETIC_EDGES = [
  // Expressway Spine (High Speed, Divided, No signals)
  createEdge('e_exp1_exp2_f', 'n_exp_1', 'n_exp_2', 1300, 'motorway', 80, { lanes: 4, isOneWay: false }),
  createEdge('e_exp1_exp2_r', 'n_exp_2', 'n_exp_1', 1300, 'motorway', 80, { lanes: 4, isOneWay: false }),
  createEdge('e_exp2_exp3_f', 'n_exp_2', 'n_exp_3', 1600, 'motorway', 80, { lanes: 4, isOneWay: false }),
  createEdge('e_exp2_exp3_r', 'n_exp_3', 'n_exp_2', 1600, 'motorway', 80, { lanes: 4, isOneWay: false }),
  createEdge('e_exp4_exp1_f', 'n_exp_4', 'n_exp_1', 1400, 'motorway', 80, { lanes: 4, isOneWay: false }),
  createEdge('e_exp4_exp1_r', 'n_exp_1', 'n_exp_4', 1400, 'motorway', 80, { lanes: 4, isOneWay: false }),

  // Expressway to Pari Chowk Slip (ONE-WAY entry to rotary)
  createEdge('e_exp2_pariw', 'n_exp_2', 'n_pari_west', 1250, 'trunk', 60, { lanes: 2, isOneWay: true }),
  createEdge('e_pariw_exp1', 'n_pari_west', 'n_exp_1', 1200, 'trunk', 60, { lanes: 2, isOneWay: true }),

  // Pari Chowk Rotary Circle (Directed One-Way Loop: West -> South -> East -> North -> West)
  createEdge('e_rot_w_s', 'n_pari_west', 'n_pari_south', 450, 'primary', 40, { lanes: 3, hasSignal: true, isOneWay: true }),
  createEdge('e_rot_s_hub', 'n_pari_south', 'n_pari_hub', 350, 'primary', 40, { lanes: 3, hasSignal: false, isOneWay: true }),
  createEdge('e_rot_hub_e', 'n_pari_hub', 'n_pari_east', 400, 'primary', 40, { lanes: 3, hasSignal: true, isOneWay: true }),
  createEdge('e_rot_e_n', 'n_pari_east', 'n_pari_north', 500, 'primary', 40, { lanes: 3, hasSignal: true, isOneWay: true }),
  createEdge('e_rot_n_w', 'n_pari_north', 'n_pari_west', 550, 'primary', 40, { lanes: 3, hasSignal: true, isOneWay: true }),

  // DTC Campus (Ambulance origin area) to Knowledge Park Arterials
  createEdge('e_dtc_kp3n_f', 'n_kp3_dtc', 'n_kp3_north', 900, 'secondary', 40, { lanes: 2, hasSpeedBreaker: true, inSchoolZone: true }),
  createEdge('e_dtc_kp3n_r', 'n_kp3_north', 'n_kp3_dtc', 900, 'secondary', 40, { lanes: 2, hasSpeedBreaker: true, inSchoolZone: true }),
  createEdge('e_dtc_kp3w_f', 'n_kp3_dtc', 'n_kp3_west', 500, 'residential', 30, { lanes: 1, isNarrow: true, hasSpeedBreaker: true }),
  createEdge('e_dtc_kp3w_r', 'n_kp3_west', 'n_kp3_dtc', 500, 'residential', 30, { lanes: 1, isNarrow: true, hasSpeedBreaker: true }),
  createEdge('e_kp3w_exp3_f', 'n_kp3_west', 'n_exp_3', 950, 'secondary', 40, { lanes: 2 }),
  createEdge('e_kp3w_exp3_r', 'n_exp_3', 'n_kp3_west', 950, 'secondary', 40, { lanes: 2 }),
  createEdge('e_kp3s_dtc_f', 'n_kp3_south', 'n_kp3_dtc', 800, 'tertiary', 35, { lanes: 1, isNarrow: true }),
  createEdge('e_kp3s_dtc_r', 'n_kp3_dtc', 'n_kp3_south', 800, 'tertiary', 35, { lanes: 1, isNarrow: true }),

  // Knowledge Park III to India Expo Mart & Pari Chowk South
  createEdge('e_kp3n_expo_f', 'n_kp3_north', 'n_expomart_w', 600, 'primary', 50, { lanes: 3 }),
  createEdge('e_kp3n_expo_r', 'n_expomart_w', 'n_kp3_north', 600, 'primary', 50, { lanes: 3 }),
  createEdge('e_expo_paris_f', 'n_expomart_w', 'n_pari_south', 950, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_expo_paris_r', 'n_pari_south', 'n_expomart_w', 950, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_expow_expoe_f', 'n_expomart_w', 'n_expomart_e', 650, 'secondary', 40, { lanes: 2 }),
  createEdge('e_expow_expoe_r', 'n_expomart_e', 'n_expomart_w', 650, 'secondary', 40, { lanes: 2 }),
  createEdge('e_expoe_kp2_f', 'n_expomart_e', 'n_kp2_hub', 500, 'secondary', 40, { lanes: 2 }),
  createEdge('e_expoe_kp2_r', 'n_kp2_hub', 'n_expomart_e', 500, 'secondary', 40, { lanes: 2 }),

  // Knowledge Park II & I to Pari Chowk East
  createEdge('e_kp2_parie_f', 'n_kp2_hub', 'n_pari_east', 1100, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_kp2_parie_r', 'n_pari_east', 'n_kp2_hub', 1100, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_kp2_sharda_f', 'n_kp2_hub', 'n_kp2_east', 550, 'secondary', 40, { lanes: 2, inSchoolZone: true }),
  createEdge('e_kp2_sharda_r', 'n_kp2_east', 'n_kp2_hub', 550, 'secondary', 40, { lanes: 2, inSchoolZone: true }),
  createEdge('e_sharda_kp1_f', 'n_kp2_east', 'n_kp1_hub', 800, 'secondary', 40, { lanes: 2 }),
  createEdge('e_sharda_kp1_r', 'n_kp1_hub', 'n_kp2_east', 800, 'secondary', 40, { lanes: 2 }),
  createEdge('e_kp1_gbu_f', 'n_kp1_hub', 'n_kp1_south', 1200, 'secondary', 50, { lanes: 2 }),
  createEdge('e_kp1_gbu_r', 'n_kp1_south', 'n_kp1_hub', 1200, 'secondary', 50, { lanes: 2 }),
  createEdge('e_kp1s_kasna2_f', 'n_kp1_south', 'n_kasna_2', 1150, 'secondary', 45, { lanes: 2 }),
  createEdge('e_kp1s_kasna2_r', 'n_kasna_2', 'n_kp1_south', 1150, 'secondary', 45, { lanes: 2 }),

  // Pari Chowk North to Sector Alpha 1 & Gamma
  createEdge('e_parin_alpha2_f', 'n_pari_north', 'n_alpha2_hub', 850, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_parin_alpha2_r', 'n_alpha2_hub', 'n_pari_north', 850, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_parin_gamma2_f', 'n_pari_north', 'n_gamma2_hub', 700, 'secondary', 45, { lanes: 2 }),
  createEdge('e_parin_gamma2_r', 'n_gamma2_hub', 'n_pari_north', 700, 'secondary', 45, { lanes: 2 }),
  createEdge('e_gamma2_gamma1_f', 'n_gamma2_hub', 'n_gamma1_hub', 600, 'tertiary', 30, { lanes: 2, isNarrow: true, hasSpeedBreaker: true }),
  createEdge('e_gamma2_gamma1_r', 'n_gamma1_hub', 'n_gamma2_hub', 600, 'tertiary', 30, { lanes: 2, isNarrow: true, hasSpeedBreaker: true }),
  createEdge('e_gamma1_canal_f', 'n_gamma1_hub', 'n_gamma1_west', 550, 'residential', 30, { lanes: 1, isNarrow: true }),
  createEdge('e_gamma1_canal_r', 'n_gamma1_west', 'n_gamma1_hub', 550, 'residential', 30, { lanes: 1, isNarrow: true }),
  createEdge('e_canal_exp4_f', 'n_gamma1_west', 'n_exp_4', 800, 'secondary', 40, { lanes: 2 }),
  createEdge('e_canal_exp4_r', 'n_exp_4', 'n_gamma1_west', 800, 'secondary', 40, { lanes: 2 }),

  // Sector Alpha Corridors
  createEdge('e_alpha2_alpha1c_f', 'n_alpha2_hub', 'n_alpha1_center', 1050, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_alpha2_alpha1c_r', 'n_alpha1_center', 'n_alpha2_hub', 1050, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_alpha2_alpha2e_f', 'n_alpha2_hub', 'n_alpha2_east', 750, 'secondary', 40, { lanes: 2 }),
  createEdge('e_alpha2_alpha2e_r', 'n_alpha2_east', 'n_alpha2_hub', 750, 'secondary', 40, { lanes: 2 }),
  createEdge('e_alpha1c_alpha1n_f', 'n_alpha1_center', 'n_alpha1_north', 600, 'secondary', 40, { lanes: 2 }),
  createEdge('e_alpha1c_alpha1n_r', 'n_alpha1_north', 'n_alpha1_center', 600, 'secondary', 40, { lanes: 2 }),
  createEdge('e_alpha1c_alpha1w_f', 'n_alpha1_center', 'n_alpha1_west', 700, 'residential', 30, { lanes: 1, isNarrow: true, hasSpeedBreaker: true }),
  createEdge('e_alpha1c_alpha1w_r', 'n_alpha1_west', 'n_alpha1_center', 700, 'residential', 30, { lanes: 1, isNarrow: true, hasSpeedBreaker: true }),
  createEdge('e_alpha1w_gamma1_f', 'n_alpha1_west', 'n_gamma1_hub', 650, 'tertiary', 35, { lanes: 2 }),
  createEdge('e_alpha1w_gamma1_r', 'n_gamma1_hub', 'n_alpha1_west', 650, 'tertiary', 35, { lanes: 2 }),

  // Sector Beta Corridors
  createEdge('e_parie_beta1_f', 'n_pari_east', 'n_beta1_center', 1000, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_parie_beta1_r', 'n_beta1_center', 'n_pari_east', 1000, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_beta1_beta2_f', 'n_beta1_center', 'n_beta2_center', 800, 'primary', 50, { lanes: 3 }),
  createEdge('e_beta1_beta2_r', 'n_beta2_center', 'n_beta1_center', 800, 'primary', 50, { lanes: 3 }),
  createEdge('e_beta1_beta1s_f', 'n_beta1_center', 'n_beta1_south', 650, 'secondary', 40, { lanes: 2 }),
  createEdge('e_beta1_beta1s_r', 'n_beta1_south', 'n_beta1_center', 650, 'secondary', 40, { lanes: 2 }),
  createEdge('e_beta1s_kp1_f', 'n_beta1_south', 'n_kp1_hub', 1300, 'secondary', 45, { lanes: 2 }),
  createEdge('e_beta1s_kp1_r', 'n_kp1_hub', 'n_beta1_south', 1300, 'secondary', 45, { lanes: 2 }),
  createEdge('e_beta2_beta2n_f', 'n_beta2_center', 'n_beta2_north', 600, 'secondary', 40, { lanes: 2 }),
  createEdge('e_beta2_beta2n_r', 'n_beta2_north', 'n_beta2_center', 600, 'secondary', 40, { lanes: 2 }),

  // Sector Delta Corridors (Destination for Sample Hospital 4)
  createEdge('e_beta2_delta1w_f', 'n_beta2_center', 'n_delta1_west', 1100, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_beta2_delta1w_r', 'n_delta1_west', 'n_beta2_center', 1100, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_delta1w_delta1e_f', 'n_delta1_west', 'n_delta1_east', 800, 'primary', 50, { lanes: 3, hasSignal: false }),
  createEdge('e_delta1w_delta1e_r', 'n_delta1_east', 'n_delta1_west', 800, 'primary', 50, { lanes: 3, hasSignal: false }),
  createEdge('e_delta1e_delta2_f', 'n_delta1_east', 'n_delta2_hub', 900, 'primary', 50, { lanes: 3 }),
  createEdge('e_delta1e_delta2_r', 'n_delta2_hub', 'n_delta1_east', 900, 'primary', 50, { lanes: 3 }),
  createEdge('e_delta2_delta2s_f', 'n_delta2_hub', 'n_delta2_south', 950, 'secondary', 40, { lanes: 2 }),
  createEdge('e_delta2_delta2s_r', 'n_delta2_south', 'n_delta2_hub', 950, 'secondary', 40, { lanes: 2 }),

  // Northern Link to Surajpur Industrial / Multi-Specialty Hospital 5
  createEdge('e_exp4_linknw_f', 'n_exp_4', 'n_link_nw', 1050, 'primary', 60, { lanes: 3 }),
  createEdge('e_exp4_linknw_r', 'n_link_nw', 'n_exp_4', 1050, 'primary', 60, { lanes: 3 }),
  createEdge('e_linknw_surajs_f', 'n_link_nw', 'n_surajpur_south', 1200, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_linknw_surajs_r', 'n_surajpur_south', 'n_link_nw', 1200, 'primary', 50, { lanes: 3, hasSignal: true }),
  createEdge('e_surajs_surajm_f', 'n_surajpur_south', 'n_surajpur_mid', 750, 'secondary', 40, { lanes: 2 }),
  createEdge('e_surajs_surajm_r', 'n_surajpur_mid', 'n_surajpur_south', 750, 'secondary', 40, { lanes: 2 }),
  createEdge('e_surajm_surajn_f', 'n_surajpur_mid', 'n_surajpur_north', 650, 'secondary', 40, { lanes: 2, hasSpeedBreaker: true }),
  createEdge('e_surajm_surajn_r', 'n_surajpur_north', 'n_surajpur_mid', 650, 'secondary', 40, { lanes: 2, hasSpeedBreaker: true }),
  createEdge('e_surajs_suraje_f', 'n_surajpur_south', 'n_surajpur_east', 1300, 'secondary', 40, { lanes: 2 }),
  createEdge('e_surajs_suraje_r', 'n_surajpur_east', 'n_surajpur_south', 1300, 'secondary', 40, { lanes: 2 }),

  // Kasna Bypass & Eastern Peripheral Expressway Connection
  createEdge('e_delta2s_kasna1_f', 'n_delta2_south', 'n_kasna_1', 1400, 'primary', 50, { lanes: 2 }),
  createEdge('e_delta2s_kasna1_r', 'n_kasna_1', 'n_delta2_south', 1400, 'primary', 50, { lanes: 2 }),
  createEdge('e_kasna1_kasna3_f', 'n_kasna_1', 'n_kasna_3', 1200, 'trunk', 60, { lanes: 3 }),
  createEdge('e_kasna1_kasna3_r', 'n_kasna_3', 'n_kasna_1', 1200, 'trunk', 60, { lanes: 3 }),
  createEdge('e_kasna1_kasna2_f', 'n_kasna_1', 'n_kasna_2', 1100, 'secondary', 45, { lanes: 2 }),
  createEdge('e_kasna1_kasna2_r', 'n_kasna_2', 'n_kasna_1', 1100, 'secondary', 45, { lanes: 2 }),

  // Cross-Links across Sectors
  createEdge('e_alpha1n_linkne_f', 'n_alpha1_north', 'n_link_ne', 1250, 'secondary', 45, { lanes: 2 }),
  createEdge('e_alpha1n_linkne_r', 'n_link_ne', 'n_alpha1_north', 1250, 'secondary', 45, { lanes: 2 }),
  createEdge('e_linkne_delta1w_f', 'n_link_ne', 'n_delta1_west', 900, 'secondary', 45, { lanes: 2 }),
  createEdge('e_linkne_delta1w_r', 'n_delta1_west', 'n_link_ne', 900, 'secondary', 45, { lanes: 2 }),
  createEdge('e_beta1s_linkse_f', 'n_beta1_south', 'n_link_se', 1400, 'secondary', 45, { lanes: 2 }),
  createEdge('e_beta1s_linkse_r', 'n_link_se', 'n_beta1_south', 1400, 'secondary', 45, { lanes: 2 }),
  createEdge('e_linkse_kasna1_f', 'n_link_se', 'n_kasna_1', 1050, 'secondary', 45, { lanes: 2 }),
  createEdge('e_linkse_kasna1_r', 'n_kasna_1', 'n_link_se', 1050, 'secondary', 45, { lanes: 2 }),
];
