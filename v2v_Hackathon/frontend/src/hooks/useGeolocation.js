import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps the browser Geolocation API.
 *
 * - getCurrentPosition(): one-off fetch, returns a promise of { lat, lng } — used
 *   the instant the SOS button is pressed so the trigger request isn't held up
 *   by a slow/denied permission prompt for longer than necessary.
 * - startWatching()/stopWatching(): continuous tracking used for Guardian Mode
 *   while an SOS alert is active.
 */
export function useGeolocation() {
  const [position, setPosition] = useState(null); // { lat, lng, accuracy }
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef(null);

  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!supported) {
        const err = new Error("Geolocation is not supported by this browser.");
        setError(err.message);
        reject(err);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(coords);
          setError(null);
          resolve(coords);
        },
        (err) => {
          setError(err.message);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [supported]);

  const startWatching = useCallback(() => {
    if (!supported || watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    setIsWatching(true);
  }, [supported]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  useEffect(() => () => stopWatching(), [stopWatching]);

  return {
    position,
    error,
    supported,
    isWatching,
    getCurrentPosition,
    startWatching,
    stopWatching,
  };
}
