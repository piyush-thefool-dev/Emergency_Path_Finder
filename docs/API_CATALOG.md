# Emergency Path Finder: External API Catalog & Integration Guide

This document catalogs every external API and telemetry service integrated into the **Emergency Path Finder** platform across the **Delhi-NCR** region. All selected services adhere strictly to a **zero credit card requirement** (either 100% public without keys, or free email sign-up only).

---

## 1. Master API Inventory Table (Zero Credit Card Requirement)

| # | Service / Capability | Selected Free / No-Card Provider | Quota & Auth Policy | Offline Backup & Fallback Mechanism |
|---|---|---|---|---|
| **1** | **Routing & Road Geometry** | **OpenRouteService (ORS) or Stadia Maps (Valhalla)**<br>Fallback: **Project-OSRM** | **Email sign-up only (NO card required)**<br>• ORS: 2,000 routes/day (40/min)<br>• Stadia: 200,000 credits/month (hard stop, zero overage risk) | **Ambulance Priority & Avoidances:**<br>• ORS supports `avoid_polygons` directly around manual incident blockades.<br>• Stadia/Valhalla passes `ignore_oneways: true`, `ignore_restrictions: true`, `use_highways: 1.0`.<br>• Offline: Bundled Delhi-NCR Graph (182 nodes, 494 edges) running internal $A^*$ / Dijkstra. |
| **2** | **Cartographic Base Map** | **OpenStreetMap Tiles (ODbL 1.0) + Tactical Night Filter**<br>`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | **No sign-up, no API key, unlimited** | 100% free with zero watermarks (avoids CARTO's mandatory API-key watermarking). Styled with tactical night radar contrast. |
| **3** | **Weather Friction Telemetry** | **Open-Meteo Weather API** | **No sign-up, no API key, unlimited** | Queries WMO `weather_code` and `visibility` (metres) to trigger exact friction multipliers ($C_{\text{weather}}$: fog/smog $<350\text{ m} \to 0.60$, rain $\to 0.82$, heavy downpour $\to 0.65$, squall $\to 0.50$, clear $\to 1.00$). Fallback: deterministic matrix in [weatherService.js](file:///f:/Emergency_Path_Finder/src/services/weatherService.js). |
| **4** | **Hospital Registry & Intake** | **Overpass `amenity=hospital` + data.gov.in OGD API** | • Overpass: **No key**<br>• data.gov.in: **Free email sign-up (NO card)** | Prevents dead third-party JSON links. Combines official Indian health directories with live OSM emergency tags (`emergency=yes`, `emergency:ward=yes`, `beds=*`). Fallback: 19 Apex Delhi-NCR Registry + `localStorage` bed editor. |
| **5** | **Live Congestion Telemetry** | **TomTom Traffic Flow API**<br>*(Dropped HERE — HERE requires credit card verification)* | **Email sign-up only (NO card required)**<br>• TomTom: 2,500 non-tile API calls/day (~75,000 calls/month) | Unlike HERE or Google Maps, TomTom does not require a credit card at sign-up and has strong probe-vehicle traffic coverage across Delhi-NCR / Noida. Fallback: Diurnal time-of-day model (Peak `0.55x`, Night `1.05x`) + manual blockades. |
| **6** | **Dynamic Street Topology** | **OpenStreetMap Overpass API (Strict Vehicle Filter)** | **No sign-up, no API key, free public** | Strict regex filter: `way["highway"~"^(motorway|trunk|primary|secondary|tertiary)"]`, excluding pedestrian footways, tracks, cycleways, and service alleys (>60% smaller payloads). Fallback: Geofabrik daily `.osm.pbf` regional extracts + static local cache. |
| **7** | **Live Responder GPS** | **W3C Geolocation + 2D Kalman Filter & OSRM Match** | **Native browser API / No key** | Snaps raw browser GPS coordinates onto road centerlines with OSRM `/match/v1/driving/` and 2D Kalman smoothing, preventing 5–15 m drift onto parallel service lanes or under expressway flyovers. |

---

## 2. In-Depth Technical Breakdown

### 1. Routing & Road Geometry (ORS + Stadia / Valhalla + OSRM)
- **Role in Project**: Computes mathematically optimal, legal road-following corridors from ambulance GPS to emergency trauma centers.
- **Why It's Better**:
  - **OpenRouteService (`VITE_ORS_API_KEY`)**: Supports `avoid_polygons`, routing directly around your manual incident blockades.
  - **Stadia Maps / Valhalla (`VITE_STADIA_API_KEY`)**: Supports `costing_options: { auto: { ignore_oneways: true, ignore_restrictions: true, use_highways: 1.0 } }`, allowing emergency vehicles to legally utilize empty one-way corridors and prioritize grade-separated expressways.
  - **Zero Card Requirement**: Both providers offer 100% free tiers without credit card verification (Stadia has a hard credit ceiling, preventing overage surprises).

### 2. Cartographic Base Map (OpenStreetMap Tiles + Tactical Night Radar)
- **Role in Project**: Tactical night-mode situational awareness display for first responders.
- **Why It's Better**:
  - 100% free with zero API key requirement and zero watermarks (completely avoids CARTO's mandatory "API KEY REQUIRED" watermark).
  - OpenStreetMap (ODbL 1.0) global coverage renders every street, roundabout, and expressway in Greater Noida and Delhi-NCR.
  - High-contrast CSS filter renders a tactical dark cockpit interface that keeps emergency ambulance routes prominently visible.

### 3. Live Weather Telemetry (Open-Meteo with WMO & Visibility)
- **Role in Project**: Supplies live atmospheric telemetry to adjust vehicle braking distance and safe cornering speeds.
- **Why It's Better**:
  - Directly queries `weather_code` and `visibility` in metres.
  - Automatically maps hazardous NCR winter smog / fog (< 350 m visibility &rarr; `0.60x`) and monsoon downpours (`0.65x`) directly into the edge weight formulation $v(e) = v_{\text{limit}} \times C_{\text{weather}}$.

### 4. Hospital Registry & Intake (Overpass + data.gov.in)
- **Role in Project**: Identifies emergency intake facilities, available ICU/ventilator beds, and casualty hotlines.
- **Why It's Better**:
  - Replaces static third-party JSON files with live OpenStreetMap queries for `amenity=hospital` and `emergency=yes`.
  - Integrates official Government of India Open Data (OGD) directory records from `data.gov.in` (free registration, no credit card required).

### 5. Live Congestion Telemetry (TomTom Traffic Flow)
- **Role in Project**: Detects live bottlenecks, jams, and construction delays on regional arterial corridors.
- **Why It's Better**:
  - **Zero Financial Risk**: Unlike HERE Platform or Google Maps (which force entering credit card credentials upon account creation), TomTom requires **only an email address**.
  - **Generous Free Allocation**: 2,500 daily calls (~75k/month) easily covers all real-time probe-vehicle queries across Delhi-NCR and Greater Noida.

### 6. Dynamic Street Topology (Strict Overpass & Geofabrik)
- **Role in Project**: Dynamically imports road networks inside arbitrary study bounding boxes.
- **Why It's Better**:
  - Strict highway classification filter (`motorway`, `trunk`, `primary`, `secondary`, `tertiary`) strips away walking trails, pedestrian plazas, and driveway alleys.
  - Cuts Overpass JSON payload size by >60% and prevents gateway timeouts in dense metropolitan regions like Noida and Delhi.

### 7. Live Responder GPS (W3C Geolocation + Kalman Smoothing + OSRM Match)
- **Role in Project**: Tracks active ambulance positions during patient transit.
- **Why It's Better**:
  - In-memory 2D Kalman filter: $K = \frac{P}{P + R}$, dampening random 5–15 m GPS jitter.
  - Snaps coordinates to the nearest road centerline with OSRM `/match/v1/driving/` to eliminate erratic jumps onto parallel service lanes or elevated flyovers.

---

## 3. Environment Variables Configuration (`.env.local`)

All candidate API keys are **100% free with no credit card required**:

```env
# 1. TomTom Traffic Flow API (Email sign-up only, No credit card, 2,500 calls/day)
# Get key: https://developer.tomtom.com/
VITE_TOMTOM_API_KEY=""

# 2. Stadia Maps / Valhalla (Email sign-up only, No credit card, 200,000 credits/month)
# Get key: https://client.stadiamaps.com/signup/
VITE_STADIA_API_KEY=""

# 3. OpenRouteService (ORS) (Email sign-up only, No credit card, 2,000 routes/day)
# Get key: https://openrouteservice.org/dev/#/signup
VITE_ORS_API_KEY=""

# 4. data.gov.in Open Government Data (Free email registration, No credit card)
# Get key: https://data.gov.in/
DATA_GOV_IN_API_KEY=""
```

If no keys are provided, the application runs automatically on **zero-key public mirrors and built-in offline Delhi-NCR datasets**.
