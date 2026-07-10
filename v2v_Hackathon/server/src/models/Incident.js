const mongoose = require("mongoose");

const VerificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vote: { type: String, enum: ["confirm", "dispute"], required: true },
    comment: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const IncidentSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isAnonymous: { type: Boolean, default: false }, // hides reporter identity in public responses

    type: {
      type: String,
      enum: [
        "harassment",
        "theft",
        "assault",
        "stalking",
        "suspicious_activity",
        "unsafe_area",
        "other",
      ],
      required: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: { type: String, default: "" }, // filled via Geocoding API (reverse geocode)

    media: [{ type: String }], // URLs to uploaded photos/videos as evidence

    status: {
      type: String,
      enum: ["reported", "verified", "disputed", "resolved"],
      default: "reported",
    },

    verifications: [VerificationSchema],
    confirmCount: { type: Number, default: 0 },
    disputeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

IncidentSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Incident", IncidentSchema);
