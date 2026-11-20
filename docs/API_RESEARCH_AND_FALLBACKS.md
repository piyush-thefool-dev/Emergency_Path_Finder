# Emergency Path Finder: API Research & Fallback Directory

> **Purpose**: This directory catalogs all current, candidate, and fallback APIs for the **Emergency Path Finder** system. Use this guide to research additional endpoints, test developer keys, compare rate limits, and propose new data sources to enhance real-time dispatch reliability.

---

## Quick Navigation

1. [Routing & Road Pathfinding Engines](#1-routing--road-pathfinding-engines)
2. [Live Real-Time Traffic & Road Congestion](#2-live-real-time-traffic--road-congestion)
3. [Interactive Map Tiles & Cartography](#3-interactive-map-tiles--cartography)
4. [Live Weather & Road Friction Telemetry](#4-live-weather--road-friction-telemetry)
5. [Hospital Registries & Bed Intake Capacity](#5-hospital-registries--bed-intake-capacity)
6. [Address Search & Geocoding (Autocomplete)](#6-address-search--geocoding-autocomplete)
7. [Disaster & Emergency Alert Feeds](#7-disaster--emergency-alert-feeds)
8. [Fallback Architecture & How to Add New APIs](#8-fallback-architecture--how-to-add-new-apis)

---

## 1. Routing & Road Pathfinding Engines

These APIs calculate legal road-snapped routes, polyline geometries, turn-by-turn maneuvers, and baseline travel times.

| Provider / API | Documentation URL | Pricing / Free Tier | Role & Value in Project | Fallback Tier |
| :--- | :--- | :--- | :--- | :--- |
| **Project-OSRM Route API** *(Current Primary)* | [project-osrm.org](https://project-osrm.org/) | 100% Free (Public demo servers) | Provides smooth road polylines strictly aligned with expressway centerlines and roundabouts. | **Tier 1 (Current)** |
| **OpenStreetMap Germany Mirror** | [routing.openstreetmap.de](https://routing.openstreetmap.de/) | 100% Free | Immediate drop-in mirror if `router.project-osrm.org` rate-limits or has downtime. | **Tier 2 (Fallback)** |
| **Internal Graph Engine** *(Offline Fallback)* | [delhiNcrRoadGraph.js](file:///f:/Emergency_Path_Finder/src/data/delhiNcrRoadGraph.js) | Free / 0 network latency | In-memory $A^*$ and Dijkstra engines over 182 nodes & 494 directed edges. Runs 100% offline. | **Tier 3 (Zero-Net)** |
| **Google Maps Routes API** | [developers.google.com/maps/documentation/routes](https://developers.google.com/maps/documentation/routes) | \$200 free monthly credit (~40,000 requests/mo) | Industry gold-standard traffic-aware routing in India. Accounts for local flyovers and road diversions. | *Research Candidate* |
| **OpenRouteService (ORS)** | [openrouteservice.org](https://openrouteservice.org/) | Free tier: 2,000 requests/day, 40 req/min | Open-source OSM routing with ambulance/emergency profiles, avoidances (barricades), and isochrones. | *Research Candidate* |
| **GraphHopper Directions API** | [graphhopper.com](https://www.graphhopper.com/) | Free tier: 500 credits/day (non-commercial) | Ultra-fast Java-based matrix and routing engine. Highly customizable vehicle physics. | *Research Candidate* |
| **Mapbox Directions API** | [mapbox.com/navigation](https://www.mapbox.com/navigation) | Free tier: 100,000 requests/month | High-frequency congestion matching, vector polyline geometries, and smooth mobile camera panning. | *Research Candidate* |
| **Valhalla (Self-Hosted via Docker)** | [github.com/valhalla/valhalla](https://github.com/valhalla/valhalla) | 100% Free / Open Source | Can be hosted on a cloud VM or local server using a Delhi-NCR `.osm.pbf` extract for unlimited queries. | *Research Candidate* |

> [!TIP]
> **Research Questions for You**:
> - Test OpenRouteService by creating a free account at [openrouteservice.org/dev](https://openrouteservice.org/dev/#/signup) to see if their 2,000 free daily calls suit your testing.
> - Verify if Google Routes API free tier (\$200/month recurring credit) is available on your Google Cloud Console.

---

## 2. Live Real-Time Traffic & Road Congestion

These services provide live vehicular speeds, congestion delays, accident reports, and road construction bottlenecks.

| Provider / API | Documentation URL | Pricing / Free Tier | Role in Emergency Path Finder | Fallback Tier |
| :--- | :--- | :--- | :--- | :--- |
| **TomTom Traffic Flow API** *(Integrated)* | [developer.tomtom.com](https://developer.tomtom.com/traffic-api) | Free tier: 2,500 non-commercial requests/day | Queries real-time speed vs free-flow speed ($v_{\text{current}} / v_{\text{free}}$) to dynamically increase edge travel time $t(e)$. | **Tier 1 (Supported)** |
| **Internal Diurnal Speed Model** *(Offline)* | [trafficService.js](file:///f:/Emergency_Path_Finder/src/services/trafficService.js) | Free / Zero latency | Mathematical time-of-day model: Rush hour (`0.55x`), Afternoon (`0.85x`), Night (`1.05x`) + user incident injection. | **Tier 2 (Offline)** |
| **Google Distance Matrix / Traffic API** | [developers.google.com/maps](https://developers.google.com/maps/documentation/distance-matrix) | \$200 monthly free credit | Highest crowd-sourced traffic density in India (millions of active Android devices on Delhi-NCR roads). | *Research Candidate* |
| **HERE Traffic API** | [developer.here.com/documentation/traffic-api](https://developer.here.com/documentation/traffic-api) | Free tier: 250,000 transactions/month | Enterprise-grade flow vectors, accident reporting, and lane-level closures. | *Research Candidate* |
| **Mapbox Traffic Data** | [docs.mapbox.com/data/traffic/](https://docs.mapbox.com/data/traffic/) | Included with Mapbox navigation suite | Real-time and typical historical speeds for primary, secondary, and residential roads. | *Research Candidate* |
| **Delhi Traffic Police Open Alerts** | [delhitrafficpolice.nic.in](https://delhitrafficpolice.nic.in/) | Public Web Advisories | Official road closures for VIP movements, rallies, and waterlogged underpasses in Delhi-NCR. | *Research Candidate* |

---

## 3. Interactive Map Tiles & Cartography

Raster and vector map tile providers for Leaflet cartography.

| Provider / Style | Documentation URL | Free Tier / Limits | Visual Style & Performance |
| :--- | :--- | :--- | :--- |
| **OpenStreetMap Standard** *(Current)* | [tile.openstreetmap.org](https://www.openstreetmap.org/) | Free (ODbL 1.0) | Default global map; customized with our high-contrast CSS dark filter. |
| **CartoDB Dark Matter / Positron** | [carto.com/basemaps](https://carto.com/basemaps) | Free for public non-commercial apps | Minimalist, ultra-clean dark emergency map. Removes map clutter so routes and ambulances stand out. |
| **Stadia Maps (Alidade Smooth Dark)** | [stadiamaps.com](https://stadiamaps.com/) | Free tier: 200,000 tiles/month | High-definition tactical dark tiles designed specifically for fleet telematics and logistics. |
| **MapTiler Vector Basemaps** | [maptiler.com](https://www.maptiler.com/) | Free tier: 100,000 tile requests/month | Crisp vector tiles with 60fps zooming and custom color palette editor. |
| **Thunderforest Transport Dark** | [thunderforest.com](https://www.thunderforest.com/) | Free tier: 150,000 tiles/month | Emphasizes arterial highways, metro lines, and emergency corridors. |

---

## 4. Live Weather & Road Friction Telemetry

Services that stream real-time precipitation, visibility, and wind speeds to dynamically scale vehicle deceleration distances and hydroplaning risks.

| Provider / API | Documentation URL | Free Tier / Limits | Capabilities & Output Metrics |
| :--- | :--- | :--- | :--- |
| **Open-Meteo** *(Current Active)* | [open-meteo.com](https://open-meteo.com/) | **100% Free / No API Key required** (up to 10,000 calls/day) | Provides temperature, relative humidity, precipitation ($mm$), wind speed, and WMO weather codes. |
| **OpenWeatherMap One Call 3.0** | [openweathermap.org/api/one-call-3](https://openweathermap.org/api/one-call-3) | Free tier: 1,000 calls/day | Minute-by-minute rain forecasts, storm warnings, and road surface temperature. |
| **Tomorrow.io Weather API** | [tomorrow.io/weather-api](https://www.tomorrow.io/weather-api/) | Free tier: 500 calls/day | Hyperlocal weather with explicit road risk indices (e.g. road wetness factor, flood hazard score). |
| **WeatherAPI** | [weatherapi.com](https://www.weatherapi.com/) | Free tier: 1,000,000 calls/month | Includes Air Quality Index (AQI - PM2.5, PM10) which affects visibility during NCR winter smog. |
| **India Meteorological Dept (IMD)** | [mausam.imd.gov.in](https://mausam.imd.gov.in/) | Public Govt Data | Official Government of India alerts for heavy monsoon downpours and fog advisories in Delhi-NCR. |

---

## 5. Hospital Registries & Bed Intake Capacity

Live data sources for healthcare facility coordinates, ICU/ventilator capacity, clinical specialties, and emergency casualties.

| Source / Provider | Documentation / URL | Nature of Data | Coverage & Usefulness |
| :--- | :--- | :--- | :--- |
| **WIB India Open Directory** *(Integrated)* | [wibest.in/data/json/hospitals.json](https://wibest.in/data/json/hospitals.json) | Open-data JSON (CC-BY 4.0) | Multi-specialty hospital records across India; mapped via our Greater Noida regional anchors. |
| **Bundled Delhi-NCR Apex Registry** *(Local)* | [delhiNcrHospitals.js](file:///f:/Emergency_Path_Finder/src/data/delhiNcrHospitals.js) | Static Verified Registry | 19 premier trauma centers with verified active 24/7 casualty phone lines and bed estimates. |
| **Ayushman Bharat Digital Mission (ABDM - HFR)** | [abdm.gov.in/facilities](https://abdm.gov.in/) | Government of India National Health Authority | National Health Facility Registry (HFR). Official database of accredited hospitals and clinics. |
| **Delhi State Govt Health Portal** | [delhi.gov.in](https://delhi.gov.in/) | State Government Portal | Periodic bed availability feeds across Delhi government and private empanelled hospitals. |
| **National Health Portal (NHP India)** | [nhp.gov.in](https://www.nhp.gov.in/) | Ministry of Health & Family Welfare (MoHFW) | National directory of emergency blood banks, trauma centers, and district hospitals. |
| **Custom Supabase / PostgreSQL API** | [supabase.com](https://supabase.com/) | Self-hosted or Cloud DB (Free tier) | Realtime WebSocket feed where hospital intake triage nurses update free ICU beds live on-screen. |

---

## 6. Address Search & Geocoding (Autocomplete)

Enables dispatchers to search for any street address, landmark, or village in Delhi-NCR and snap coordinates automatically.

| Provider / Service | Documentation URL | Free Tier / Pricing | Best Feature |
| :--- | :--- | :--- | :--- |
| **Nominatim (OpenStreetMap)** | [nominatim.org](https://nominatim.org/) | Free (1 request/sec limit) | Open-source global geocoder. Excellent for street names, sector numbers, and major chowks. |
| **Photon by Komoot** | [photon.komoot.io](https://photon.komoot.io/) | Free (Open API) | Fast search-as-you-type geocoding with typo tolerance based on OSM data. |
| **LocationIQ Geocoding API** | [locationiq.com](https://locationiq.com/) | Free tier: 5,000 requests/day | High-performance commercial wrapper around OSM Nominatim with fast Indian CDN servers. |
| **Google Places Autocomplete API** | [developers.google.com/maps/places](https://developers.google.com/maps/documentation/places/web-service/overview) | \$200 monthly free credit | Unrivaled accuracy for local Indian shop names, societies, gate numbers, and residential colonies. |
| **Mapbox Geocoding API** | [docs.mapbox.com/api/search/geocoding/](https://docs.mapbox.com/api/search/geocoding/) | Free tier: 100,000 requests/month | Clean structured addresses with forward and reverse geocoding. |

---

## 7. Disaster & Emergency Alert Feeds

National and international feeds for severe infrastructure emergencies, earthquakes, and flood warnings.

| Organization / API | Documentation URL | Type of Alert | Usage in System |
| :--- | :--- | :--- | :--- |
| **NDMA Sachet Portal (India)** | [sachet.ndma.gov.in](https://sachet.ndma.gov.in/) | Common Alerting Protocol (CAP) | Real-time geo-targeted disaster alerts (floods, storms, hazardous chemical leaks) from Govt of India. |
| **GDACS (Global Disaster Alert & Coordination System)** | [gdacs.org/xml/rss.xml](https://www.gdacs.org/) | Public RSS / GeoJSON | Worldwide real-time disaster alerts; can flag regional earthquake tremors and storm fronts. |
| **USGS Earthquake API** | [earthquake.usgs.gov](https://earthquake.usgs.gov/fdsnws/event/1/) | Public GeoJSON | Tracks seismic activity in Northern India / Himalayan seismic belt affecting NCR bridge safety. |

---

## 8. Fallback Architecture & How to Add New APIs

The platform follows a **resilient multi-tier fallback architecture**:

```
Client Request (Routing, Traffic, Weather, or Hospitals)
   │
   ├──▶ 1. Try Primary Cloud API (OSRM, Open-Meteo, TomTom, WIB)
   │       └── Successful? Use data immediately.
   │
   ├──▶ 2. Network Timeout or HTTP Error (429/500/503)?
   │       └── Switch to Secondary Mirror (e.g. routing.openstreetmap.de)
   │
   └──▶ 3. Offline / Insecure Context / Zero Network Connection?
           └── Automatically engage Tier 3 Local In-Memory Fallback:
                 • Routing: Internal A* / Dijkstra on local 494-edge graph
                 • Traffic: Diurnal speed model (morning peak, evening rush)
                 • Weather: Synthetic friction model based on season
                 • Hospitals: 19 verified offline apex trauma centers
```

### Adding New API Keys to Your Local Environment

Create or edit `.env.local` in the project root:

```env
# TomTom Traffic API (Optional - enhances real-time traffic speeds)
VITE_TOMTOM_API_KEY="your_tomtom_api_key_here"

# OpenRouteService API (Optional - alternative routing engine)
VITE_ORS_API_KEY="your_ors_api_key_here"

# Google Maps Platform (Optional - future Google Routes / Places integration)
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"

# Mapbox Access Token (Optional - future Mapbox vector tiles & directions)
VITE_MAPBOX_ACCESS_TOKEN="your_mapbox_token_here"

# OpenWeatherMap Key (Optional - alternative weather engine)
VITE_OPENWEATHER_API_KEY="your_openweather_key_here"
```

> **Note**: If no environment variables are set, the platform will continue running seamlessly on its **zero-cost public endpoints and built-in offline graph datasets**.
