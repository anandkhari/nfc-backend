const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    location: String,
    device: String,
    ipAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scan", scanSchema);
