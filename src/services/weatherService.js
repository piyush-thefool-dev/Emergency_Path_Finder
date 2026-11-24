/**
 * Live Weather Service using Open-Meteo API.
 *
 * Fetches real-time, zero-key, open-data atmospheric metrics for the
 * Greater Noida / Delhi-NCR study corridor (Pari Chowk: 28.4795°N, 77.5090°E):
 *   - Temperature (°C)
 *   - Relative Humidity (%)
 *   - Precipitation (mm) & Rain (mm)
 *   - WMO Weather Code
 *   - Wind Speed (km/h)
 *   - Visibility (metres)
 *
 * Automatically maps WMO codes to road network congestion factors:
 *   - 0, 1, 2, 3: Clear / Dry (1.0x speed)
 *   - 45, 48: Dense NCR Fog / Smog (0.60x speed)
 *   - 51-67, 80-82: Rain / Showers (0.72x speed)
 *   - 95-99: Severe Thunderstorm / Squall (0.50x speed)
 */

import { isOffline, markNetworkFailure } from '../utils/network.js';

export const OPEN_METEO_CONFIG = {
  latitude: 28.4795,
  longitude: 77.5090,
  city: 'Greater Noida, Uttar Pradesh',
  endpoint: 'https://api.open-meteo.com/v1/forecast',
};

/**
 * Returns deterministic fallback weather when offline or in sandboxed tests.
 */
export function getOfflineFallbackWeather(targetLat = OPEN_METEO_CONFIG.latitude, targetLon = OPEN_METEO_CONFIG.longitude) {
  return {
    isLive: false,
    temperatureC: 24,
    humidityPercent: 55,
    precipitationMm: 0,
    windSpeedKph: 8,
    visibilityKm: 10,
    wmoCode: 0,
    weatherId: 'clear',
    label: 'Clear / Dry Conditions (Offline Mode)',
    description: 'Clear sky, high visibility, nominal dry pavement friction.',
    frictionFactor: 1.0,
    timestamp: new Date().toISOString(),
    source: `Local Atmospheric Model (${targetLat.toFixed(2)}°N, ${targetLon.toFixed(2)}°E)`,
  };
}

/**
 * Maps WMO weather code and atmospheric visibility directly to project weatherId,
 * human-readable label, and the physical road friction multiplier C_weather.
 *
 * @param {number} code WMO code
 * @param {number} visibilityMetres
 * @returns {{
 *   weatherId: 'clear'|'rain'|'fog'|'storm',
 *   label: string,
 *   description: string,
 *   frictionFactor: number
 * }}
 */
export function mapWmoCodeToWeather(code, visibilityMetres = 10000) {
  // If visibility is severely impaired (< 350m), classify as dense fog/smog
  if (visibilityMetres < 350) {
    return {
      weatherId: 'fog',
      label: 'Dense NCR Fog / Smog',
      description: `Visibility severely restricted (${(visibilityMetres / 1000).toFixed(1)} km)`,
      frictionFactor: 0.60,
    };
  }

  // Thunderstorms & severe convective squalls (WMO 95-99)
  if (code >= 95 && code <= 99) {
    return {
      weatherId: 'storm',
      label: 'Thunderstorm & High Winds',
      description: 'Severe weather with localized waterlogging and high braking risk',
      frictionFactor: 0.50,
    };
  }

  // Heavy rain or violent showers (WMO 65, 67, 81, 82)
  if (code === 65 || code === 67 || code === 81 || code === 82) {
    return {
      weatherId: 'rain',
      label: 'Heavy Downpour / Waterlogged',
      description: 'High hydroplaning risk and severely lengthened emergency braking distance',
      frictionFactor: 0.65,
    };
  }

  // Active rain, drizzle, showers (WMO 51-64, 80)
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      weatherId: 'rain',
      label: 'Active Rain / Wet Surface',
      description: 'Reduced friction coefficient and increased braking distances',
      frictionFactor: 0.82,
    };
  }

  // Fog / morning mist (WMO 45, 48 or visibility < 1000m)
  if (code === 45 || code === 48 || visibilityMetres < 1000) {
    return {
      weatherId: 'fog',
      label: 'Dense Fog / Morning Mist',
      description: `Low visibility (${(visibilityMetres / 1000).toFixed(1)} km) along expressway and arterial roads`,
      frictionFactor: 0.75,
    };
  }

  // Moderate NCR Winter Haze / Smog (visibility between 1000m and 8000m)
  if (visibilityMetres < 8000) {
    return {
      weatherId: 'fog',
      label: 'Moderate NCR Haze / Winter Smog',
      description: `Reduced atmospheric visibility (${(visibilityMetres / 1000).toFixed(1)} km) requiring cautionary emergency pacing`,
      frictionFactor: 0.85,
    };
  }

  // Clear / partly cloudy (WMO 0-3)
  return {
    weatherId: 'clear',
    label: 'Clear / Dry Conditions',
    description: 'Normal visibility and optimal road friction',
    frictionFactor: 1.00,
  };
}

/**
 * Fetches real-time weather observations from Open-Meteo.
 * @returns {Promise<{
 *   isLive: boolean,
 *   temperatureC: number,
 *   humidityPercent: number,
 *   precipitationMm: number,
 *   windSpeedKph: number,
 *   visibilityKm: number,
 *   wmoCode: number,
 *   weatherId: 'clear'|'rain'|'fog'|'storm',
 *   label: string,
 *   description: string,
 *   timestamp: string,
 *   source: string
 * }>}
 */
export async function fetchLiveWeather(lat = OPEN_METEO_CONFIG.latitude, lon = OPEN_METEO_CONFIG.longitude) {
  const targetLat = typeof lat === 'number' ? lat : OPEN_METEO_CONFIG.latitude;
  const targetLon = typeof lon === 'number' ? lon : OPEN_METEO_CONFIG.longitude;

  if (isOffline()) {
    return getOfflineFallbackWeather(targetLat, targetLon);
  }

  const url = `${OPEN_METEO_CONFIG.endpoint}?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,visibility`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const visibilityM = current.visibility !== undefined ? current.visibility : 10000;
    const weatherMapping = mapWmoCodeToWeather(current.weather_code, visibilityM);

    return {
      isLive: true,
      temperatureC: current.temperature_2m ?? 24,
      humidityPercent: current.relative_humidity_2m ?? 60,
      precipitationMm: current.precipitation ?? 0,
      windSpeedKph: current.wind_speed_10m ?? 8,
      visibilityKm: Number((visibilityM / 1000).toFixed(1)),
      wmoCode: current.weather_code ?? 0,
      weatherId: weatherMapping.weatherId,
      label: weatherMapping.label,
      description: weatherMapping.description,
      frictionFactor: weatherMapping.frictionFactor,
      timestamp: current.time || new Date().toISOString(),
      source: `Open-Meteo Live API (${targetLat.toFixed(2)}°N, ${targetLon.toFixed(2)}°E)`,
    };
  } catch (err) {
    markNetworkFailure(err);
    return getOfflineFallbackWeather(targetLat, targetLon);
  }
}
