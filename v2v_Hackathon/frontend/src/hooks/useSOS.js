import { useCallback, useEffect, useRef, useState } from "react";
import {
  triggerSOS as apiTriggerSOS,
  updateSOSLocation,
  escalateSOS as apiEscalateSOS,
  resolveSOS as apiResolveSOS,
  getActiveSOS,
} from "../api/sos";
import { useGeolocation } from "./useGeolocation";
import { useSocket } from "./useSocket";

const LOCATION_PING_INTERVAL_MS = 12000; // matches the 10-15s cadence the backend expects

/**
 * Owns the full lifecycle of an SOS alert:
 * - restores any already-active alert on mount (e.g. page refresh mid-emergency)
 * - trigger(level) / escalate(level) / resolve()
 * - while active: watches the device position and PATCHes /sos/:id/location
 *   on an interval (Guardian Mode), and listens for live socket updates
 */
export function useSOS() {
  const [alert, setAlert] = useState(null); // current active alert doc, or null
  const [status, setStatus] = useState("idle"); // idle | triggering | active | resolving | error
  const [error, setError] = useState(null);

  const geo = useGeolocation();
  const socketRef = useSocket(alert?._id || null);
  const pingIntervalRef = useRef(null);

  // Restore any alert that was already active (e.g. user refreshed the page).
  useEffect(() => {
    getActiveSOS()
      .then((existing) => {
        if (existing) {
          setAlert(existing);
          setStatus("active");
        }
      })
      .catch(() => {
        /* not logged in yet, or no active alert - ignore */
      });
  }, []);

  // Live updates pushed from the server (e.g. from another of the user's own
  // devices, or just to keep this client authoritative on escalation/resolve).
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onLocation = (payload) => {
      setAlert((prev) =>
        prev ? { ...prev, currentLocation: { type: "Point", coordinates: payload.coordinates }, address: payload.address } : prev
      );
    };
    const onEscalated = (payload) => setAlert(payload.alert);
    const onResolved = () => {
      setAlert(null);
      setStatus("idle");
    };

    socket.on("location_update", onLocation);
    socket.on("sos_escalated", onEscalated);
    socket.on("sos_resolved", onResolved);
    return () => {
      socket.off("location_update", onLocation);
      socket.off("sos_escalated", onEscalated);
      socket.off("sos_resolved", onResolved);
    };
  }, [socketRef, alert?._id]);

  // While an alert is active: keep watching position + ping the backend on an interval.
  useEffect(() => {
    if (!alert) {
      geo.stopWatching();
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    geo.startWatching();
    pingIntervalRef.current = setInterval(async () => {
      try {
        const pos = await geo.getCurrentPosition();
        const updated = await updateSOSLocation(alert._id, pos.lat, pos.lng);
        setAlert((prev) => (prev ? { ...prev, currentLocation: updated.location, address: updated.address } : prev));
      } catch (e) {
        // Swallow individual ping failures (e.g. transient GPS hiccup) — keep trying.
        console.error("SOS location ping failed:", e.message);
      }
    }, LOCATION_PING_INTERVAL_MS);

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alert?._id]);

  const trigger = useCallback(async (level) => {
    setStatus("triggering");
    setError(null);
    try {
      const pos = await geo.getCurrentPosition();
      const created = await apiTriggerSOS(level, pos.lat, pos.lng);
      setAlert(created);
      setStatus("active");
      return created;
    } catch (e) {
      const message = e.response?.data?.message || e.message || "Could not send SOS alert.";
      setError(message);
      setStatus("error");
      throw e;
    }
  }, [geo]);

  const escalate = useCallback(
    async (level) => {
      if (!alert) return;
      setError(null);
      try {
        const updated = await apiEscalateSOS(alert._id, level);
        setAlert(updated);
        return updated;
      } catch (e) {
        const message = e.response?.data?.message || e.message || "Could not escalate alert.";
        setError(message);
        throw e;
      }
    },
    [alert]
  );

  const resolve = useCallback(async () => {
    if (!alert) return;
    setStatus("resolving");
    setError(null);
    try {
      await apiResolveSOS(alert._id);
      setAlert(null);
      setStatus("idle");
    } catch (e) {
      const message = e.response?.data?.message || e.message || "Could not resolve alert.";
      setError(message);
      setStatus("active");
      throw e;
    }
  }, [alert]);

  return {
    alert,
    status,
    error,
    isActive: !!alert,
    geoError: geo.error,
    trigger,
    escalate,
    resolve,
  };
}
