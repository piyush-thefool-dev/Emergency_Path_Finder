# Emergency Path Finder: External API Catalog & Integration Guide

This document lists every external API and telemetry service integrated into the **Emergency Path Finder** platform across the **Delhi-NCR** region, detailing endpoints, authentication requirements, fallback mechanisms, and recommended enterprise/free alternatives.

> 📚 **Looking for extended API research, free quotas, and fallback comparisons?**  
> See the [API Research & Fallback Directory](file:///f:/Emergency_Path_Finder/docs/API_RESEARCH_AND_FALLBACKS.md) for a comprehensive study of 25+ alternative providers across Routing, Live Traffic, Weather, Hospital Registries, Geocoding, and Disaster Feeds.

---

## 1. Master API Inventory Table

| # | Service / Capability | Current Endpoint / Provider | Auth Required | Offline Backup & Fallback Mechanism |
|---|---|---|---|---|
| **1** | **Road-Snapped Geometry & Routing Engine** | **Project-OSRM Route API**<br>`https://router.project-osrm.org/route/v1/driving/` | None (Public Demo) | **Primary Fallback:** German OSM Foundation Mirror (`https://routing.openstreetmap.de/routed-car/route/v1/driving/`).<br>**Secondary Offline:** Bundled Delhi-NCR High-Fidelity Graph ([src/data/delhiNcrRoadGraph.js](file:///f:/Emergency_Path_Finder/src/data/delhiNcrRoadGraph.js) with 182 arterial nodes & 494 directed edges) running internal $A^*$ / Dijkstra algorithms. |
| **2** | **Map Background Tiles (Cartography)** | **OpenStreetMap Tile Server**<br>`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | None (ODbL 1.0) | Leaflet raster tile caching + custom dark CSS cartographic filter overlay. |
| **3** | **Live Weather & Friction Telemetry** | **Open-Meteo Weather API**<br>`https://api.open-meteo.com/v1/forecast` | None (Free / Open) | Deterministic weather condition simulator ([src/services/weatherService.js](file:///f:/Emergency_Path_Finder/src/services/weatherService.js)) with friction scaling factors (`clear: 1.0`, `rain: 0.82`, `heavy_rain: 0.65`, `fog: 0.75`). |
| **4** | **Hospital Registry & Bed Capacity** | **WIB India Hospitals API**<br>`https://wibest.in/data/json/hospitals.json` | None (Public) | Bundled Delhi-NCR Apex Hospital Registry ([src/data/delhiNcrHospitals.js](file:///f:/Emergency_Path_Finder/src/data/delhiNcrHospitals.js)) with 19 apex trauma facilities across Delhi, Noida, Greater Noida, Ghaziabad, Gurugram, and Faridabad + interactive user bed editor with `localStorage` persistence. |
| **5** | **Live Traffic Congestion Speeds** | **TomTom Traffic Flow API**<br>`https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json` | API Key (`VITE_TOMTOM_API_KEY`) | Time-of-day traffic model ([src/services/trafficService.js](file:///f:/Emergency_Path_Finder/src/services/trafficService.js): Midnight `1.05x`, Morning Rush `0.65x`, Afternoon `0.85x`, Evening Peak `0.55x`) + dynamic manual road incident blockades. |
| **6** | **Live Street Vector Bounding-Box Extract** | **OpenStreetMap Overpass API**<br>`https://overpass-api.de/api/interpreter` | None (Public) | Rotating fallback mirrors (`lz4.overpass-api.de`, `overpass.kumi.systems`) + static local graph snapshot cache. |
| **7** | **Device GPS Location Streaming** | **W3C Geolocation API** (`navigator.geolocation.watchPosition`) | Browser Permission | Default initial dispatch coordinates centered on Delhi-NCR / Greater Noida (Lat: `28.4744`, Lon: `77.5040`). |

---

## 2. In-Depth Breakdown & Best Alternatives

### 1. Road Geometry & Route Directions (OSRM)
- **Role in Project**: Converts start and hospital destination points into smooth, high-resolution road polylines that strictly adhere to real motorway centerlines, flyovers, roundabouts, and dual carriageways.
- **Current Endpoints**:
  - Primary: `https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson`
  - Fallback: `https://routing.openstreetmap.de/routed-car/route/v1/driving/`
- **Recommended Alternatives**:
  - **Google Maps Routes API**: Gold standard for real-world road navigation in India with live turn-by-turn guidance and traffic incident avoidance.
  - **Mapbox Directions API**: High-frequency real-time traffic speeds, customizable route profiles (`mapbox/driving-traffic`), and smooth vector polyline output.
  - **OpenRouteService (ORS) API**: Open-source, self-hostable or cloud-hosted routing engine with generous free tier (2,000 requests/day).
  - **GraphHopper Routing API**: Extremely fast Java-based OSM routing engine with support for custom vehicle profiles (ambulance speed exemptions).
  - **Self-Hosted Valhalla / OSRM Instance**: Can be deployed via Docker on an AWS/GCP instance with a local India `.osm.pbf` extract for unlimited queries and zero network latency.

---

### 2. Map Cartography & Tile Layer
- **Role in Project**: Renders interactive map canvas (roads, terrain, district labels, landmarks) via Leaflet.
- **Current Tile Endpoint**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Recommended Alternatives**:
  - **CartoDB Positron & Dark Matter**: Clean, distraction-free minimalist basemaps ideal for emergency dispatch dashboards (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`).
  - **MapTiler / MapLibre GL**: Fast vector tiles with customizable styling and high-DPI retina display support.
  - **Stadia Maps (Alidade Smooth Dark)**: Professional emergency and logistics dark basemap tiles.
  - **Mapbox Streets / Dark Style**: Industrial-strength global mapping layer.

---

### 3. Live Weather Telemetry (Open-Meteo)
- **Role in Project**: Provides temperature, relative humidity, precipitation ($mm$), and wind speed to dynamically calculate road braking distances, hydroplaning risks, and weather friction multipliers on ambulance speeds.
- **Current Endpoint**: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`
- **Recommended Alternatives**:
  - **OpenWeatherMap One Call 3.0 API**: Minute-by-minute precipitation forecasts and national severe weather warnings.
  - **Tomorrow.io Weather API**: Provides hyper-local road hazard indices (flood probability, road wetness factor).
  - **WeatherAPI**: Highly reliable, includes air quality index (AQI) data critical for Delhi-NCR emergency dispatches.

---

### 4. Hospital Directory & Bed Management
- **Role in Project**: Provides verified healthcare facility locations, trauma level designations, contact numbers, and ICU/oxygen bed numbers.
- **Current Endpoint**: `https://wibest.in/data/json/hospitals.json` (fallback: bundled `src/data/delhiNcrHospitals.js` with 19 apex centers).
- **Recommended Alternatives**:
  - **Ayushman Bharat Digital Mission (ABDM) HFR API**: Government of India National Health Authority verified registry of hospitals and medical centers.
  - **Delhi State Health Department Portal / Real-Time Bed Dashboard**: Live bed availability feed across Delhi government and private empanelled hospitals.
  - **Custom Supabase / PostgreSQL REST API**: Host a dedicated database with Realtime WebSockets so hospital ER triage staff can update ICU bed counts instantly.

---

### 5. Live Traffic Congestion Speeds
- **Role in Project**: Retrieves current vehicle speeds versus free-flow speeds on given road segments to detect gridlock and dynamically adjust route cost.
- **Current Endpoint**: `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point={lat},{lon}&key={key}`
- **Recommended Alternatives**:
  - **Google Routes / Distance Matrix API (`departure_time=now`)**: Most accurate crowd-sourced traffic speeds in Delhi NCR.
  - **HERE Traffic API**: High-frequency flow vectors and real-time road hazard notifications.
  - **Mapbox Traffic API**: Live and typical traffic speeds per road corridor.

---

### 6. Vector Geometry Extracts (Overpass API)
- **Role in Project**: Dynamically queries OpenStreetMap nodes and ways inside a geographical bounding box (`[bbox]`) to generate local street graphs.
- **Current Endpoints**:
  - Primary: `https://overpass-api.de/api/interpreter`
  - Mirrors: `https://lz4.overpass-api.de/api/interpreter`, `https://overpass.kumi.systems/api/interpreter`
- **Recommended Alternatives**:
  - **Geofabrik Regional Extracts**: Pre-compiled `.osm.pbf` files updated daily for India and Northern Region.
  - **Protomaps / PMTiles**: Serverless vector tile extract format hosted on Cloudflare R2 / AWS S3.

---

## 3. How to Configure Custom API Keys

To configure custom or enterprise API keys, create a `.env.local` file in the project root:

```env
# TomTom Traffic API (Optional - for live congestion telemetry)
VITE_TOMTOM_API_KEY="your_tomtom_api_key_here"

# Google Maps Platform Key (Optional - for future Google Routes integration)
VITE_GOOGLE_MAPS_API_KEY="your_google_api_key_here"

# Mapbox Access Token (Optional - for future Mapbox tiles / directions)
VITE_MAPBOX_ACCESS_TOKEN="your_mapbox_token_here"

# OpenWeatherMap Key (Optional - alternative to Open-Meteo)
VITE_OPENWEATHER_API_KEY="your_openweather_key_here"
```

If no external API keys are configured, the application **automatically runs on zero-cost public endpoints and built-in Delhi-NCR offline datasets**, ensuring 100% uptime without payment gates.
