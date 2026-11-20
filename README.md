# Emergency Path Finder for Ambulances

## 1. Project Overview

The **Emergency Path Finder for Ambulances** is a decision-support prototype that models an urban road network as a directed, weighted graph $G = (V, E, w)$. Instead of using static geographic distance, each directed road segment is assigned a predicted travel-time cost:

$$t(e) = \frac{L(e)}{v(e)}$$

where $L(e)$ is segment length in metres and $v(e)$ is estimated speed in metres per second ($v(\text{m/s}) = v(\text{km/h}) \times \frac{1000}{3600}$).

The application computes optimal routes using **Dijkstra's Algorithm** (correctness baseline) and **A\* Search** (with an admissible lower-bound travel-time heuristic). Candidate hospitals are first filtered by the configured specialty and then ordered by modelled travel time. Bed figures are illustrative or user-entered prototype values; they are not live hospital inventory and must be confirmed directly with each facility. The system supports dynamic route recalculation when scenario weights or user-injected road incidents change.

### System Interface Previews

<p align="center">
  <img src="screenshots/preview-desktop.png" width="68%" alt="PC Desktop Dispatch Console (1440x900)" />
  <img src="screenshots/preview-samsung-mobile.png" width="28%" alt="Samsung Galaxy Mobile CAD (412x915)" />
</p>

<p align="center">
  <em>Left: Desktop CAD Command Console (1440 × 900) &nbsp;|&nbsp; Right: Samsung Galaxy Mobile CAD View (412 × 915)</em>
</p>

---

## 2. Academic Honesty & Limitations Statement

In accordance with the underlying B.Tech project report:

- **No Measured Travel-Time Savings:** No percentage reductions in travel time or arrival certainty are asserted. All time-saved formulas require empirical route trials on real road networks.
- **No Clinical Outcome Claims:** Reaching a medical center in shorter transit time does not establish improved patient survival or clinical treatment outcomes. The rigid 60-minute "golden hour" concept is treated as an urgent communication metaphor, not a strict survival boundary (Lerner & Moscati, 2001).
- **Illustrative Traffic Model:** No trained machine learning model or live traffic feed is connected to the route weights. The application uses a documented time-of-day, weather, and road-class multiplier model over the road graph.
- **Illustrative Hospital Availability:** Free-bed figures are derived estimates or user-entered demo values. A directory lookup is not a bed-management integration; confirm all capacity by phone.
- **Decision-Support Only:** This system is not a substitute for human dispatchers, paramedic triage, or municipal traffic police authority.
- **Signal Pre-emption Simulation:** Green corridor simulation is a software demonstration only. Operational signal pre-emption requires vehicle-to-infrastructure (V2I) equipment and legal traffic authorization.

---

## 3. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Compile the production build
npm run build

# 4. Run TypeScript project checks (if configured in your environment)
npm run lint
```

---

## 4. File Structure & Report Concept Mapping

Every theoretical concept from the project report maps directly to a modular JavaScript source file:

```
src/
├── algorithms/
│   ├── minHeap.js           # Binary Min-Heap Priority Queue (O(log |V|) push/pop)
│   ├── dijkstra.js          # Dijkstra Shortest Path (Baseline, O((|V|+|E|) log |V|))
│   ├── astar.js             # A* Search with f(n) = g(n) + h(n)
│   ├── heuristics.js        # Admissible travel-time heuristic: haversine / v_max
│   └── pathUtils.js         # Adjacency list builder and predecessor path recovery
├── services/
│   ├── speedModel.js        # Baseline speed prediction lookup (time/weather/road class)
│   ├── edgeWeights.js       # t(e) = L/v formula, signal delays, suitability penalties
│   ├── hospitalRanking.js   # Multi-criteria ranking: road travel time + seat/bed availability
│   ├── roadSnapService.js   # OSRM road centerline snapping & real polyline routing
│   ├── weatherService.js    # Open-Meteo live weather telemetry & road friction
│   ├── benchmark.js         # Statistical batch comparison of Dijkstra vs A*
│   └── graphLoader.js       # Pluggable graph loader and schema validator
├── data/
│   ├── delhiNcrRoadGraph.js # Canonical Delhi-NCR 182-node, 494-edge arterial road network
│   ├── delhiNcrHospitals.js # Canonical 19 apex trauma & emergency facilities registry
│   ├── demoGraphFigure2.js  # Exact 6-node Figure 2 benchmark graph (Cost = 9 min)
│   ├── syntheticCityGraph.js# 46-node Greater Noida directed road network
│   ├── sampleHospitals.js   # Backward-compatible re-export wrapper
│   └── congestionFactors.js # Documented congestion multiplier tables
├── config/
│   ├── constants.js         # Speed bounds, fallback limits, delays, and placeholders
│   └── emergencyCategories.js # Trauma, Cardiac, Burn, General emergency constraints
├── hooks/
│   ├── useGraph.js          # Manages scenario conditions, incidents, and graph weights
│   └── useRouting.js        # Manages ambulance snapping, hospital ranking, and comparisons
├── components/
│   ├── layout/              # Navbar, Footer, and DisclaimerBanner
│   ├── map/                 # MapView, RouteLayer, HospitalMarkers, AmbulanceMarker, IncidentTool
│   ├── panels/              # ControlPanel, ResultCard, CompareTable, DataFreshness, WarningsList
│   └── charts/              # BenchmarkChart
├── pages/
│   ├── Dashboard.jsx        # Main dispatch map and scenario-based routing view
│   ├── Benchmark.jsx        # Empirical Dijkstra vs A* performance evaluation
│   ├── Evaluation.jsx       # Planned ML models, metric definitions, and comparative sheet
│   ├── GraphExplorer.jsx    # Live worked formula calculator and data structures table
│   ├── Architecture.jsx     # 5-stage pipeline, inputs/outputs, and ODbL compliance
│   └── About.jsx            # Team, guide, problem statement, future scope, references [1]-[18]
├── routes/
│   └── AppRoutes.jsx        # React Router view routing
├── styles/
│   └── global.css           # Tailwind CSS and Leaflet overrides
└── tests/
    ├── minHeap.test.js       # Binary min-heap operations and decrease-key tests
    ├── algorithms.test.js    # Figure 2 cost=9 verification, one-way edges, closures
    └── speedAndWeights.test.js # Speed conversions, zero-speed fallbacks, delay physics
```

The test specifications use Vitest syntax. This project archive does not currently include a Vitest dependency or an `npm test` script, so those files are not executed by `npm run lint` or `npm run build`.

---

## 5. Report Benchmark Verification: Figure 2 Graph

The project report illustrates its routing principles in **Figure 2** using a 6-node directed graph with edge travel times in minutes:

- `Ambulance → A` = 4 min
- `A → C` = 6 min
- `C → Hospital` = 3 min
- `A → D` = 5 min
- `Ambulance → B` = 3 min
- `B → D` = 4 min
- `D → Hospital` = 2 min

### Optimal Path & Cost:

$$\text{Ambulance} \to \text{B} (3) \to \text{D} (4) \to \text{Hospital} (2) = 9 \text{ minutes}$$

### Alternative Suboptimal Paths:

- $\text{Ambulance} \to \text{A} (4) \to \text{D} (5) \to \text{Hospital} (2) = 11 \text{ minutes}$
- $\text{Ambulance} \to \text{A} (4) \to \text{C} (6) \to \text{Hospital} (3) = 13 \text{ minutes}$

Both Dijkstra and A\* algorithms in this codebase strictly yield **cost = 9.0 min** on this benchmark, verified automatically in `src/tests/algorithms.test.js`.

---

## 6. Graph JSON Schema for External OSM / OSMnx Ingestion

To plug in a real OpenStreetMap extract exported via OSMnx, NetworkX, or Overpass API without changing any application code, provide a JSON file satisfying this schema via `src/services/graphLoader.js`:

```json
{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "EmergencyPathFinderRoadGraph",
      "type": "object",
      "required": ["id", "nodes", "edges"],
      "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "disclaimer": { "type": "string" },
            "nodes": {
                  "type": "array",
                  "items": {
                        "type": "object",
                        "required": ["id", "lat", "lon"],
                        "properties": {
                              "id": { "type": ["string", "number"] },
                              "name": { "type": "string" },
                              "lat": { "type": "number" },
                              "lon": { "type": "number" },
                              "type": { "type": "string" }
                        }
                  }
            },
            "edges": {
                  "type": "array",
                  "items": {
                        "type": "object",
                        "required": ["id", "from", "to", "lengthM"],
                        "properties": {
                              "id": { "type": "string" },
                              "from": { "type": ["string", "number"] },
                              "to": { "type": ["string", "number"] },
                              "lengthM": { "type": "number" },
                              "roadType": {
                                    "type": "string",
                                    "enum": [
                                          "motorway",
                                          "trunk",
                                          "primary",
                                          "secondary",
                                          "tertiary",
                                          "residential",
                                          "unclassified"
                                    ]
                              },
                              "speedLimitKph": { "type": "number" },
                              "lanes": { "type": "integer" },
                              "hasSignal": { "type": "boolean" },
                              "isNarrow": { "type": "boolean" },
                              "hasSpeedBreaker": { "type": "boolean" },
                              "inSchoolZone": { "type": "boolean" },
                              "closed": { "type": "boolean" },
                              "isOneWay": { "type": "boolean" }
                        }
                  }
            }
      }
}
```

---

## 7. OpenStreetMap & Licensing Notice

Map tile visualization and spatial coordinates utilize OpenStreetMap data:

- **Licence:** Open Database Licence (ODbL) &copy; [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
- **Public Tile Usage:** Rendered via standard OpenStreetMap cartographic tile servers in accordance with tile usage guidelines.

## 8. Authors & Project Team

- **Created By:** Piyush Kumar · Nilesh Kumar Singh · Abhishek Maurya
- **Institution:** Delhi Technical Campus, Greater Noida (Affiliated to GGSIPU)
- **Department:** B.Tech Computer Science & Engineering
