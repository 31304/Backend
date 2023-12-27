const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  serviceType: { type: String, required: true }, // Changed from serviceId to serviceType
  bidAmount: Number,
  message: String,
  status: {
    type: String,
    enum: ["submitted", "accepted", "rejected"],
    default: "submitted",
  },
  dateSubmitted: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Bid", bidSchema);
