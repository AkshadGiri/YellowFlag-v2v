const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Last known location, updated on login / periodic pings / during SOS
    lastLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        // [longitude, latitude]  <-- GeoJSON order, NOT lat/lng
        type: [Number],
        default: [0, 0],
      },
      address: { type: String, default: "" },
      updatedAt: { type: Date },
    },

    trustedContacts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "TrustedContact" },
    ],

    // Currently active SOS alert, if any (quick lookup)
    activeSOS: { type: mongoose.Schema.Types.ObjectId, ref: "SOSAlert", default: null },
  },
  { timestamps: true }
);

UserSchema.index({ lastLocation: "2dsphere" });

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
