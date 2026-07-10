const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const trustedContactRoutes = require("./routes/trustedContactRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const sosRoutes = require("./routes/sosRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();

// ===== Global middleware =====
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Serve uploaded evidence files (audio/video/images) statically
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ===== Home Route =====
app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "SafeSphere Backend",
    message: "Backend is running successfully 🚀",
  });
});

// ===== Health check =====
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/contacts", trustedContactRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/location", locationRoutes);

// ===== 404 handler =====
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ===== Centralized error handler (must be last) =====
app.use(errorHandler);

module.exports = app;
