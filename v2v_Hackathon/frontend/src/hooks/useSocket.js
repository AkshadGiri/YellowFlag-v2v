import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/**
 * Opens one shared socket connection and joins the room for the given SOS
 * alert id, so this client receives location_update / sos_escalated /
 * sos_resolved events live (see server src/sockets/index.js).
 */
export function useSocket(alertId) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !alertId) return;
    socket.emit("join_sos_room", alertId);
    return () => socket.emit("leave_sos_room", alertId);
  }, [alertId]);

  return socketRef;
}
