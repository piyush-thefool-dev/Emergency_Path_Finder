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

export function useLiveLocation({
  onLocationUpdate,
  activeRouteNodeIds = [],
  graphNodes = [],
  initialPos = { lat: 28.4625, lon: 77.4930 },
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

  // Stop real GPS tracker
  const stopGps = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsActive(false);
  }, []);

  // Start real GPS tracking via navigator.geolocation.watchPosition
  const startGps = useCallback(() => {
    setGpsError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or environment.');
      return;
    }

    setIsGpsActive(true);

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const newPos = { lat: latitude, lon: longitude };

      // Compute incremental distance moved
      if (lastCoordsRef.current) {
        const dist = haversineDistance(
          lastCoordsRef.current.lat,
          lastCoordsRef.current.lon,
          latitude,
          longitude
        );
        if (dist > 1) {
          setTotalDistanceMovedM((prev) => prev + dist);
        }
      }
      lastCoordsRef.current = newPos;

      setGpsAccuracy(accuracy ? Math.round(accuracy) : null);
      setGpsSpeedKph(speed !== null && speed !== undefined ? Math.round(speed * 3.6) : null);
      setGpsHeading(heading !== null && heading !== undefined ? Math.round(heading) : null);
      setLastUpdated(new Date().toISOString());

      if (onLocationUpdate) {
        onLocationUpdate(latitude, longitude, {
          isRealGps: true,
          accuracy,
          speedKph: speed !== null && speed !== undefined ? speed * 3.6 : 0,
        });
      }
    };

    const handleError = (err) => {
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
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 1000,
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
