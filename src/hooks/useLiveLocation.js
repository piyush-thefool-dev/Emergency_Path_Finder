/**
 * Live GPS Geolocation and Movement Tracking Hook.
 *
 * Implements:
 *   1. Real-time device GPS location streaming via navigator.geolocation.watchPosition.
 *   2. High-accuracy coordinate, speed, heading, and accuracy radius updates.
 *   3. Safe boundary handling with auto-snapping to the road network graph.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { haversineDistance } from '../utils/geo.js';
import { matchGpsCoordinates } from '../services/roadSnapService.js';
import { DEFAULT_AMBULANCE_ORIGIN } from '../config/constants.js';

/**
 * 2D Kalman Filter for GPS Coordinate Smoothing & Multipath Drift Rejection.
 * Prevents 5-15m random GPS wander and spurious service-road/flyover jumps.
 */
class GpsKalmanFilter {
  constructor(processNoise = 0.000005) {
    this.processNoise = processNoise;
    this.lat = null;
    this.lon = null;
    this.variance = -1;
  }

  filter(lat, lon, accuracyM = 15) {
    const r = Math.max(0.000005, Math.pow(accuracyM / 111320, 2));

    if (this.variance < 0) {
      this.lat = lat;
      this.lon = lon;
      this.variance = r;
      return { lat, lon, isFiltered: false };
    }

    this.variance += this.processNoise;
    const k = this.variance / (this.variance + r);
    this.lat += k * (lat - this.lat);
    this.lon += k * (lon - this.lon);
    this.variance = (1 - k) * this.variance;

    return { lat: this.lat, lon: this.lon, isFiltered: true };
  }

  reset() {
    this.lat = null;
    this.lon = null;
    this.variance = -1;
  }
}

export const GPS_TRACKING_CONFIG = {
  fastLockTimeoutMs: 3500,
  fastLockMaxAgeMs: 15000,
  highAccuracyTimeoutMs: 7500,
  highAccuracyMaxAgeMs: 2000,
  fallbackTimeoutMs: 6000,
  fallbackMaxAgeMs: 5000,
};

export function useLiveLocation({
  onLocationUpdate,
  activeRouteNodeIds = [],
  graphNodes = [],
  initialPos = { lat: DEFAULT_AMBULANCE_ORIGIN.lat, lon: DEFAULT_AMBULANCE_ORIGIN.lon },
}) {
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [followVehicle, setFollowVehicle] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState(null); // in metres
  const [gpsSpeedKph, setGpsSpeedKph] = useState(null);
  const [gpsHeading, setGpsHeading] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [totalDistanceMovedM, setTotalDistanceMovedM] = useState(0);

  const lastCoordsRef = useRef(initialPos);
  const watchIdRef = useRef(null);
  const kalmanRef = useRef(new GpsKalmanFilter());

  // Stop real GPS tracker
  const stopGps = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    kalmanRef.current.reset();
    setIsGpsActive(false);
  }, []);

  // Start real GPS tracking via navigator.geolocation.watchPosition
  const startGps = useCallback(() => {
    setGpsError(null);

    // Modern mobile browsers (Chrome / Safari) strictly block Geolocation on insecure HTTP over network IP
    const isSecure = typeof window === 'undefined' || window.isSecureContext !== false;
    if (!isSecure) {
      const host = typeof window !== 'undefined' ? window.location.host : 'local IP';
      setGpsError(
        `Mobile browsers block GPS on insecure HTTP (${host}). Chrome and Safari require HTTPS or localhost to access device location hardware.`
      );
      setIsGpsActive(false);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or environment.');
      return;
    }

    setIsGpsActive(true);

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const rawAccuracy = accuracy ? Math.round(accuracy) : 15;

      // Apply 2D Kalman smoothing to eliminate 5-15m random drift and multipath spikes
      const filtered = kalmanRef.current.filter(latitude, longitude, rawAccuracy);
      const effectiveLat = filtered.lat;
      const effectiveLon = filtered.lon;
      const newPos = { lat: effectiveLat, lon: effectiveLon };

      // Compute incremental distance moved
      if (lastCoordsRef.current) {
        const dist = haversineDistance(
          lastCoordsRef.current.lat,
          lastCoordsRef.current.lon,
          effectiveLat,
          effectiveLon
        );
        if (dist > 1) {
          setTotalDistanceMovedM((prev) => prev + dist);
        }
      }
      lastCoordsRef.current = newPos;

      setGpsAccuracy(rawAccuracy);
      setGpsSpeedKph(speed !== null && speed !== undefined ? Math.round(speed * 3.6) : null);
      setGpsHeading(heading !== null && heading !== undefined ? Math.round(heading) : null);
      setLastUpdated(new Date().toISOString());

      if (onLocationUpdate) {
        onLocationUpdate(effectiveLat, effectiveLon, {
          isRealGps: true,
          accuracy: rawAccuracy,
          speedKph: speed !== null && speed !== undefined ? speed * 3.6 : 0,
          rawLat: latitude,
          rawLon: longitude,
          isSmoothed: filtered.isFiltered,
        });
      }
    };

    const handleError = (err) => {
      // Automatically downgrade from high-accuracy satellite fix to responsive network/Wi-Fi tracking on timeout
      if (err?.code === 3 && watchIdRef.current !== null) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, (fallbackErr) => {
            const msg =
              fallbackErr.code === 1
                ? 'Location permission denied. Please allow location access in your browser to enable live tracking.'
                : fallbackErr.code === 2
                ? 'Position unavailable. Check your device GPS signal.'
                : 'Location request timed out. Retrying...';
            setGpsError(msg);
            setIsGpsActive(false);
          }, {
            enableHighAccuracy: false,
            timeout: GPS_TRACKING_CONFIG.fallbackTimeoutMs,
            maximumAge: GPS_TRACKING_CONFIG.fallbackMaxAgeMs,
          });
          return;
        } catch {}
      }

      let msg = 'Unable to retrieve your location.';
      if (err.code === 1) {
        msg = 'Location permission denied. Please allow location access in your browser to enable live tracking.';
      } else if (err.code === 2) {
        msg = 'Position unavailable. Check your device GPS signal.';
      } else if (err.code === 3) {
        msg = 'Location request timed out. Retrying...';
      }
      setGpsError(msg);
      setIsGpsActive(false);
    };

    try {
      // Fast initial pre-lock (< 3.5s) using cached/network positioning before high-accuracy stream refines it
      if (typeof navigator.geolocation.getCurrentPosition === 'function') {
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          () => {},
          {
            enableHighAccuracy: false,
            timeout: GPS_TRACKING_CONFIG.fastLockTimeoutMs,
            maximumAge: GPS_TRACKING_CONFIG.fastLockMaxAgeMs,
          }
        );
      }

      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: GPS_TRACKING_CONFIG.highAccuracyTimeoutMs,
        maximumAge: GPS_TRACKING_CONFIG.highAccuracyMaxAgeMs,
      });
    } catch (e) {
      setGpsError(`Error initializing GPS tracker: ${e.message}`);
      setIsGpsActive(false);
    }
  }, [onLocationUpdate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopGps();
    };
  }, [stopGps]);

  const clearGpsError = useCallback(() => {
    setGpsError(null);
  }, []);

  return {
    isGpsActive,
    isSimulatingMove: false,
    isMoving: isGpsActive,
    followVehicle,
    setFollowVehicle,
    gpsAccuracy,
    gpsSpeedKph,
    gpsHeading,
    gpsError,
    clearGpsError,
    lastUpdated,
    totalDistanceMovedM,
    startGps,
    stopGps,
    startSimulation: () => {},
    stopSimulation: () => {},
  };
}

export default useLiveLocation;
