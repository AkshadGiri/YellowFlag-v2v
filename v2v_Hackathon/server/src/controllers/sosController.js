const asyncHandler = require("../utils/asyncHandler");
const SOSAlert = require("../models/SOSAlert");
const TrustedContact = require("../models/TrustedContact");
const User = require("../models/User");
const { reverseGeocode } = require("../services/geocodingService");
const { notifyTrustedContacts, notifyPolice } = require("../services/notificationService");
const {
  emitSOSTriggered,
  emitLocationUpdate,
  emitSOSEscalated,
  emitSOSResolved,
} = require("../sockets");

// Derive feature flags from the emergency level (1/2/3)
const flagsForLevel = (level) => ({
  guardianModeActive: level >= 1,
  audioRecordingActive: level >= 2,
  videoRecordingActive: level >= 3,
  policeNotified: level >= 3,
});

// @desc    Trigger a new SOS alert (Level 1, 2, or 3)
// @route   POST /api/sos/trigger
// @access  Private
// body: { level: 1|2|3, lat, lng }
const triggerSOS = asyncHandler(async (req, res) => {
  const { level, lat, lng } = req.body;

  if (![1, 2, 3].includes(Number(level))) {
    res.status(400);
    throw new Error("level must be 1 (Feeling Unsafe), 2 (Need Help), or 3 (Emergency)");
  }
  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error("lat and lng are required to trigger SOS");
  }

  // Prevent duplicate active alerts - escalate instead if one already exists
  const existing = await SOSAlert.findOne({ user: req.user._id, status: "active" });
  if (existing) {
    res.status(400);
    throw new Error(
      `You already have an active Level ${existing.level} alert (id: ${existing._id}). Escalate it instead of triggering a new one.`
    );
  }

  const address = await reverseGeocode(lat, lng);
  const flags = flagsForLevel(Number(level));

  // Level 1: notify only primary trusted contacts. Level 2+: notify everyone.
  const contactFilter = { user: req.user._id };
  if (Number(level) === 1) contactFilter.isPrimary = true;
  const contactsToNotify = await TrustedContact.find(contactFilter);

  const alert = await SOSAlert.create({
    user: req.user._id,
    level: Number(level),
    currentLocation: { type: "Point", coordinates: [lng, lat] },
    address,
    locationHistory: [{ coordinates: [lng, lat], address, timestamp: new Date() }],
    notifiedContacts: contactsToNotify.map((c) => c._id),
    ...flags,
  });

  await User.findByIdAndUpdate(req.user._id, { activeSOS: alert._id });

  // Fire-and-forget notifications so the SOS trigger response stays fast
  notifyTrustedContacts(contactsToNotify, alert, req.user).catch((e) =>
    console.error("notifyTrustedContacts failed:", e.message)
  );
  if (flags.policeNotified) {
    notifyPolice(alert, req.user).catch((e) => console.error("notifyPolice failed:", e.message));
  }

  const io = req.app.get("io");
  emitSOSTriggered(io, alert._id, { alert });

  res.status(201).json({ success: true, data: alert });
});

// @desc    Continuously update location for an active SOS alert (Guardian Mode tracking)
// @route   PATCH /api/sos/:id/location
// @access  Private
// body: { lat, lng }
const updateSOSLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error("lat and lng are required");
  }

  const alert = await SOSAlert.findOne({ _id: req.params.id, user: req.user._id, status: "active" });
  if (!alert) {
    res.status(404);
    throw new Error("Active SOS alert not found");
  }

  const address = await reverseGeocode(lat, lng);

  alert.currentLocation = { type: "Point", coordinates: [lng, lat] };
  alert.address = address;
  alert.locationHistory.push({ coordinates: [lng, lat], address, timestamp: new Date() });
  await alert.save();

  const io = req.app.get("io");
  emitLocationUpdate(io, alert._id, {
    alertId: alert._id,
    coordinates: [lng, lat],
    address,
    timestamp: new Date(),
  });

  res.json({ success: true, data: { location: alert.currentLocation, address } });
});

// @desc    Escalate an active alert to a higher level (e.g. Level 1 -> Level 3)
// @route   PATCH /api/sos/:id/escalate
// @access  Private
// body: { level }
const escalateSOS = asyncHandler(async (req, res) => {
  const { level } = req.body;
  if (![1, 2, 3].includes(Number(level))) {
    res.status(400);
    throw new Error("level must be 1, 2, or 3");
  }

  const alert = await SOSAlert.findOne({ _id: req.params.id, user: req.user._id, status: "active" });
  if (!alert) {
    res.status(404);
    throw new Error("Active SOS alert not found");
  }

  if (Number(level) <= alert.level) {
    res.status(400);
    throw new Error("New level must be higher than the current level");
  }

  const previousLevel = alert.level;
  const flags = flagsForLevel(Number(level));

  alert.escalationHistory.push({ fromLevel: previousLevel, toLevel: Number(level) });
  alert.level = Number(level);
  Object.assign(alert, flags);

  // If we escalated up to (or past) Level 1's "primary only" restriction,
  // make sure ALL trusted contacts are now notified, not just primary ones.
  const allContacts = await TrustedContact.find({ user: req.user._id });
  const newlyAddedContacts = allContacts.filter(
    (c) => !alert.notifiedContacts.some((id) => id.toString() === c._id.toString())
  );
  alert.notifiedContacts = allContacts.map((c) => c._id);

  await alert.save();

  const user = await User.findById(req.user._id);
  if (newlyAddedContacts.length > 0) {
    notifyTrustedContacts(newlyAddedContacts, alert, user).catch((e) =>
      console.error("notifyTrustedContacts failed:", e.message)
    );
  }
  if (flags.policeNotified && previousLevel < 3) {
    notifyPolice(alert, user).catch((e) => console.error("notifyPolice failed:", e.message));
  }

  const io = req.app.get("io");
  emitSOSEscalated(io, alert._id, { alert, previousLevel });

  res.json({ success: true, data: alert });
});

// @desc    Attach an evidence recording (audio/video/photo) to an active alert
// @route   POST /api/sos/:id/recording
// @access  Private
// multipart/form-data field name: "file", plus body field "type" (audio|video|photo)
const uploadRecording = asyncHandler(async (req, res) => {
  const { type } = req.body;
  if (!["audio", "video", "photo"].includes(type)) {
    res.status(400);
    throw new Error("type must be 'audio', 'video', or 'photo'");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const alert = await SOSAlert.findOne({ _id: req.params.id, user: req.user._id });
  if (!alert) {
    res.status(404);
    throw new Error("SOS alert not found");
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  alert.recordings.push({ type, url: fileUrl });
  await alert.save();

  res.status(201).json({ success: true, data: { url: fileUrl, recordings: alert.recordings } });
});

// @desc    Resolve/cancel an active SOS alert ("I'm safe now")
// @route   PATCH /api/sos/:id/resolve
// @access  Private
const resolveSOS = asyncHandler(async (req, res) => {
  const alert = await SOSAlert.findOne({ _id: req.params.id, user: req.user._id, status: "active" });
  if (!alert) {
    res.status(404);
    throw new Error("Active SOS alert not found");
  }

  alert.status = "resolved";
  alert.resolvedAt = new Date();
  await alert.save();

  await User.findByIdAndUpdate(req.user._id, { activeSOS: null });

  const io = req.app.get("io");
  emitSOSResolved(io, alert._id, { alertId: alert._id, resolvedAt: alert.resolvedAt });

  res.json({ success: true, data: alert });
});

// @desc    Get the logged-in user's currently active alert, if any
// @route   GET /api/sos/active
// @access  Private
const getActiveSOS = asyncHandler(async (req, res) => {
  const alert = await SOSAlert.findOne({ user: req.user._id, status: "active" });
  res.json({ success: true, data: alert || null });
});

// @desc    Get full alert history for the logged-in user
// @route   GET /api/sos/history
// @access  Private
const getSOSHistory = asyncHandler(async (req, res) => {
  const alerts = await SOSAlert.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: alerts.length, data: alerts });
});

// @desc    Get a single alert by ID (used by the owner or trusted contacts with the link)
// @route   GET /api/sos/:id
// @access  Private
// NOTE: for a real production build, generate a separate signed share-token for
// trusted contacts instead of relying on requiring a login for every viewer.
const getSOSById = asyncHandler(async (req, res) => {
  const alert = await SOSAlert.findById(req.params.id).populate("user", "name phone");
  if (!alert) {
    res.status(404);
    throw new Error("SOS alert not found");
  }
  res.json({ success: true, data: alert });
});

module.exports = {
  triggerSOS,
  updateSOSLocation,
  escalateSOS,
  uploadRecording,
  resolveSOS,
  getActiveSOS,
  getSOSHistory,
  getSOSById,
};
