const mongoose = require("mongoose");

const TrustedContactSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },
    relation: { type: String, default: "Friend" }, // e.g. Parent, Sibling, Friend
    notifyBy: {
      type: [String],
      enum: ["sms", "email", "push"],
      default: ["sms", "email"],
    },
    // Priority contacts get notified even at Level 1 (Feeling Unsafe)
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrustedContact", TrustedContactSchema);
