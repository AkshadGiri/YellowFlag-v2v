const mongoose = require("mongoose");

const LocationPingSchema = new mongoose.Schema(
  {
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RecordingSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["audio", "video", "photo"], required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const EscalationSchema = new mongoose.Schema(
  {
    fromLevel: Number,
    toLevel: Number,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SOSAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 1 = Feeling Unsafe, 2 = Need Help, 3 = Emergency
    level: { type: Number, enum: [1, 2, 3], required: true },

    status: {
      type: String,
      enum: ["active", "resolved", "cancelled"],
      default: "active",
    },

    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: { type: String, default: "" },

    // Continuous tracking trail while alert is active
    locationHistory: [LocationPingSchema],

    // Which trusted contacts were actually notified for this alert
    notifiedContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "TrustedContact" }],

    // Feature flags derived from level, stored for audit/history
    guardianModeActive: { type: Boolean, default: false }, // Level 1+
    audioRecordingActive: { type: Boolean, default: false }, // Level 2+
    videoRecordingActive: { type: Boolean, default: false }, // Level 3
    policeNotified: { type: Boolean, default: false }, // Level 3 (simulated)

    recordings: [RecordingSchema],
    escalationHistory: [EscalationSchema],

    startedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

SOSAlertSchema.index({ currentLocation: "2dsphere" });
SOSAlertSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("SOSAlert", SOSAlertSchema);
