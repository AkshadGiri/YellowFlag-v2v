const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  triggerSOS,
  updateSOSLocation,
  escalateSOS,
  uploadRecording,
  resolveSOS,
  getActiveSOS,
  getSOSHistory,
  getSOSById,
} = require("../controllers/sosController");

router.use(protect);

router.post("/trigger", triggerSOS);
router.get("/active", getActiveSOS);
router.get("/history", getSOSHistory);
router.get("/:id", getSOSById);
router.patch("/:id/location", updateSOSLocation);
router.patch("/:id/escalate", escalateSOS);
router.post("/:id/recording", upload.single("file"), uploadRecording);
router.patch("/:id/resolve", resolveSOS);

module.exports = router;
