const mongoose = require("mongoose");

const saveSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
    // You can add the same tracking as the Scan model
    ipAddress: String,
    device: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Save", saveSchema);