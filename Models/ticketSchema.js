const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: [true, "Event ID is required"],
  },
  attendeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attendee",
    required: [true, "Attendee ID is required"],
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  type: {
    type: String,
    enum: ["vip", "regular"],
    default: "regular",
    required: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
