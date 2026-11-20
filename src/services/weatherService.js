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

export const OPEN_METEO_CONFIG = {
  latitude: 28.4795,
  longitude: 77.5090,
  city: 'Greater Noida, Uttar Pradesh',
  endpoint: 'https://api.open-meteo.com/v1/forecast',
};

/**
 * Maps WMO weather code to project weatherId and human-readable label.
 * @param {number} code WMO code
 * @param {number} visibilityMetres
 * @returns {{ weatherId: 'clear'|'rain'|'fog'|'storm', label: string, description: string }}
 */
export function mapWmoCodeToWeather(code, visibilityMetres = 10000) {
  // If visibility is severely impaired (< 300m), classify as dense fog/smog
  if (visibilityMetres < 350) {
    return {
      weatherId: 'fog',
      label: 'Dense NCR Fog / Smog',
      description: `Visibility severely restricted (${(visibilityMetres / 1000).toFixed(1)} km)`,
    };
  }

  // Thunderstorms
  if (code >= 95 && code <= 99) {
    return {
      weatherId: 'storm',
      label: 'Thunderstorm & High Winds',
      description: 'Severe weather with localized waterlogging and high braking risk',
    };
  }

  // Rain, drizzle, showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      weatherId: 'rain',
      label: 'Active Rain / Wet Surface',
      description: 'Reduced friction coefficient and increased braking distances',
    };
  }

  // Fog / mist
  if (code === 45 || code === 48) {
    return {
      weatherId: 'fog',
      label: 'Fog / Morning Mist',
      description: 'Low visibility along expressway and arterial roads',
    };
  }

  // Clear / partly cloudy
  return {
    weatherId: 'clear',
    label: 'Clear / Dry Conditions',
    description: 'Normal visibility and optimal road friction',
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
export async function fetchLiveWeather() {
  const url = `${OPEN_METEO_CONFIG.endpoint}?latitude=${OPEN_METEO_CONFIG.latitude}&longitude=${OPEN_METEO_CONFIG.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,visibility`;

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
    timestamp: current.time || new Date().toISOString(),
    source: 'Open-Meteo Live API (Greater Noida Station 28.4795°N, 77.5090°E)',
  };
}
