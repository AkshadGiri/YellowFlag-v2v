const asyncHandler = require("../utils/asyncHandler");
const Incident = require("../models/Incident");
const { reverseGeocode } = require("../services/geocodingService");

// @desc    Report a new incident
// @route   POST /api/incidents
// @access  Private
const createIncident = asyncHandler(async (req, res) => {
  const { type, description, severity, lat, lng, isAnonymous, media } = req.body;

  if (!type || !description || lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error("type, description, lat and lng are required");
  }

  // Geocoding API: turn coordinates into a readable address (no map used)
  const address = await reverseGeocode(lat, lng);

  const incident = await Incident.create({
    reporter: req.user._id,
    isAnonymous: !!isAnonymous,
    type,
    description,
    severity,
    location: { type: "Point", coordinates: [lng, lat] },
    address,
    media: media || [],
  });

  res.status(201).json({ success: true, data: incident });
});

// @desc    Get incidents near a given point (geospatial query)
// @route   GET /api/incidents/nearby?lat=..&lng=..&radius=2000
// @access  Private
const getNearbyIncidents = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 2000, type, status } = req.query; // radius in meters

  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error("lat and lng query params are required");
  }

  const filter = {
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radius),
      },
    },
  };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const incidents = await Incident.find(filter)
    .populate("reporter", "name")
    .limit(100);

  // Hide reporter identity for anonymous reports
  const sanitized = incidents.map((incident) => {
    const obj = incident.toObject();
    if (obj.isAnonymous) obj.reporter = null;
    return obj;
  });

  res.json({ success: true, count: sanitized.length, data: sanitized });
});

// @desc    Get single incident by ID
// @route   GET /api/incidents/:id
// @access  Private
const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id).populate("reporter", "name");

  if (!incident) {
    res.status(404);
    throw new Error("Incident not found");
  }

  const obj = incident.toObject();
  if (obj.isAnonymous) obj.reporter = null;

  res.json({ success: true, data: obj });
});

// @desc    Verify (confirm/dispute) an incident report
// @route   POST /api/incidents/:id/verify
// @access  Private
const verifyIncident = asyncHandler(async (req, res) => {
  const { vote, comment } = req.body; // vote: 'confirm' | 'dispute'

  if (!["confirm", "dispute"].includes(vote)) {
    res.status(400);
    throw new Error("vote must be 'confirm' or 'dispute'");
  }

  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    res.status(404);
    throw new Error("Incident not found");
  }

  const alreadyVoted = incident.verifications.find(
    (v) => v.user.toString() === req.user._id.toString()
  );
  if (alreadyVoted) {
    res.status(400);
    throw new Error("You have already verified this incident");
  }

  incident.verifications.push({ user: req.user._id, vote, comment });
  if (vote === "confirm") incident.confirmCount += 1;
  else incident.disputeCount += 1;

  // Simple auto-status logic: 3+ confirms -> verified, 3+ disputes -> disputed
  if (incident.confirmCount >= 3) incident.status = "verified";
  if (incident.disputeCount >= 3) incident.status = "disputed";

  await incident.save();

  res.json({ success: true, data: incident });
});

// @desc    Update incident status (e.g. mark resolved)
// @route   PATCH /api/incidents/:id/status
// @access  Private
const updateIncidentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["reported", "verified", "disputed", "resolved"];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${allowed.join(", ")}`);
  }

  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    res.status(404);
    throw new Error("Incident not found");
  }

  incident.status = status;
  await incident.save();

  res.json({ success: true, data: incident });
});

module.exports = {
  createIncident,
  getNearbyIncidents,
  getIncidentById,
  verifyIncident,
  updateIncidentStatus,
};
