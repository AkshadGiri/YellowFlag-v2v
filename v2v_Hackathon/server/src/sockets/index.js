const { Server } = require("socket.io");

/**
 * Real-time layer used for:
 * - Guardian Mode live location tracking (Level 1+)
 * - Trusted contacts watching an active SOS alert unfold in real time
 *
 * Rooms are keyed by SOS alert ID: `sos:<alertId>`
 * Anyone with the alert ID (the user + notified trusted contacts) can join
 * that room to receive live updates without polling the REST API.
 */
const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client joins the room for a specific active SOS alert
    socket.on("join_sos_room", (alertId) => {
      socket.join(`sos:${alertId}`);
      console.log(`Socket ${socket.id} joined sos:${alertId}`);
    });

    socket.on("leave_sos_room", (alertId) => {
      socket.leave(`sos:${alertId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// ===== Helper emitters used inside controllers via req.app.get("io") =====

const emitLocationUpdate = (io, alertId, payload) => {
  io.to(`sos:${alertId}`).emit("location_update", payload);
};

const emitSOSTriggered = (io, alertId, payload) => {
  io.to(`sos:${alertId}`).emit("sos_triggered", payload);
};

const emitSOSEscalated = (io, alertId, payload) => {
  io.to(`sos:${alertId}`).emit("sos_escalated", payload);
};

const emitSOSResolved = (io, alertId, payload) => {
  io.to(`sos:${alertId}`).emit("sos_resolved", payload);
};

module.exports = initSocket;
module.exports.emitLocationUpdate = emitLocationUpdate;
module.exports.emitSOSTriggered = emitSOSTriggered;
module.exports.emitSOSEscalated = emitSOSEscalated;
module.exports.emitSOSResolved = emitSOSResolved;
