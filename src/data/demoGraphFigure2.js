/**
 * Exact representation of Figure 2 from the project report:
 * "Illustrative directed road graph" (Delhi Technical Campus B.Tech report, page 7 & page 14).
 *
 * Direct edges and weights (in minutes):
 *   Ambulance -> A: 4 min
 *   A -> C: 6 min
 *   C -> Hospital: 3 min
 *   A -> D: 5 min
 *   Ambulance -> B: 3 min
 *   B -> D: 4 min
 *   D -> Hospital: 2 min
 *
 * Expected Optimal Path:
 *   Ambulance -> B -> D -> Hospital = 3 + 4 + 2 = 9 minutes (540 s)
 *
 * Suboptimal Alternative Paths:
 *   Ambulance -> A -> D -> Hospital = 4 + 5 + 2 = 11 minutes (660 s)
 *   Ambulance -> A -> C -> Hospital = 4 + 6 + 3 = 13 minutes (780 s)
 */

export const FIGURE_2_DEMO_GRAPH = {
  id: 'figure_2_report_demo',
  name: 'Report Demo Graph (Figure 2)',
  description: 'Exact 6-node schematic graph from project report Figure 2 to verify algorithmic correctness.',
  isSchematic: true,
  unit: 'minutes',
  timeUnitMultiplier: 60, // 1 minute = 60 seconds
  nodes: [
    { id: 'Ambulance', label: 'Ambulance (Source)', lat: 28.4700, lon: 77.4900, type: 'source' },
    { id: 'A', label: 'Node A', lat: 28.4820, lon: 77.4960, type: 'waypoint' },
    { id: 'B', label: 'Node B', lat: 28.4580, lon: 77.5010, type: 'waypoint' },
    { id: 'C', label: 'Node C', lat: 28.4900, lon: 77.5120, type: 'waypoint' },
    { id: 'D', label: 'Node D', lat: 28.4680, lon: 77.5180, type: 'waypoint' },
    { id: 'Hospital', label: 'Hospital (Destination)', lat: 28.4800, lon: 77.5320, type: 'hospital' },
  ],
  edges: [
    {
      id: 'e_Amb_A',
      from: 'Ambulance',
      to: 'A',
      weightMinutes: 4,
      lengthM: 2000,
      roadType: 'primary',
      speedLimitKph: 50,
      lanes: 2,
      hasSignal: false,
      isNarrow: false,
      hasSpeedBreaker: false,
      inSchoolZone: false,
      closed: false,
    },
    {
      id: 'e_A_C',
      from: 'A',
      to: 'C',
      weightMinutes: 6,
      lengthM: 3000,
      roadType: 'secondary',
      speedLimitKph: 40,
      lanes: 2,
      hasSignal: true,
      isNarrow: false,
      hasSpeedBreaker: false,
      inSchoolZone: false,
      closed: false,
    },
    {
      id: 'e_C_Hosp',
      from: 'C',
      to: 'Hospital',
      weightMinutes: 3,
      lengthM: 1500,
      roadType: 'primary',
      speedLimitKph: 50,
      lanes: 2,
      hasSignal: false,
      isNarrow: false,
      hasSpeedBreaker: false,
      inSchoolZone: false,
      closed: false,
    },
    {
      id: 'e_A_D',
      from: 'A',
      to: 'D',
      weightMinutes: 5,
      lengthM: 2500,
      roadType: 'tertiary',
      speedLimitKph: 40,
      lanes: 1,
      hasSignal: true,
      isNarrow: true,
      hasSpeedBreaker: true,
      inSchoolZone: false,
      closed: false,
    },
    {
      id: 'e_Amb_B',
      from: 'Ambulance',
      to: 'B',
      weightMinutes: 3,
      lengthM: 1800,
      roadType: 'primary',
      speedLimitKph: 60,
      lanes: 3,
      hasSignal: false,
      isNarrow: false,
      hasSpeedBreaker: false,
      inSchoolZone: false,
      closed: false,
    },
    {
      id: 'e_B_D',
      from: 'B',
      to: 'D',
      weightMinutes: 4,
      lengthM: 2200,
      roadType: 'primary',
      speedLimitKph: 50,
      lanes: 2,
      hasSignal: false,
      isNarrow: false,
      hasSpeedBreaker: false,
      inSchoolZone: false,
      closed: false,
    },
    {
      id: 'e_D_Hosp',
      from: 'D',
      to: 'Hospital',
      weightMinutes: 2,
      lengthM: 1200,
      roadType: 'primary',
      speedLimitKph: 60,
      lanes: 3,
      hasSignal: false,
      isNarrow: false,
      hasSpeedBreaker: false,
      inSchoolZone: false,
      closed: false,
    },
  ],
  expectedOptimalCostMinutes: 9,
  expectedOptimalPath: ['Ambulance', 'B', 'D', 'Hospital'],
};
