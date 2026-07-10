const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createIncident,
  getNearbyIncidents,
  getIncidentById,
  verifyIncident,
  updateIncidentStatus,
} = require("../controllers/incidentController");

router.use(protect);

router.post("/", createIncident);
router.get("/nearby", getNearbyIncidents);
router.get("/:id", getIncidentById);
router.post("/:id/verify", verifyIncident);
router.patch("/:id/status", updateIncidentStatus);

module.exports = router;
