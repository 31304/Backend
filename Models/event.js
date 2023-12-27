const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventType: { type: String },
  dateTime: { type: Date },
  venue: { type: String },
  maxTicketsRegular: { type: Number, min: 0 },
  maxTicketsVip: { type: Number, min: 0 },
  regularTicketsSold: { type: Number, min: 0, default: 0 },
  vipTicketsSold: { type: Number, min: 0, default: 0 },
  priceOfVipTicket: { type: Number, min: 0 },
  PriceRegularTicket: { type: Number, min: 0 },
  ticketAvailability: { type: Boolean },
  pic: [{ type: String }],
  approve: {
    type: Boolean,
    default: false,
  },
  servicesType: [{ type: String }],
  organizerEmail: { type: String },
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed", "cancelled"],
    default: "upcoming",
  },
  feedbackAndRatings: [
    {
      userEmail: { type: String },
      feedback: { type: String },
      rating: { type: Number, min: 1, max: 5 },
    },
  ],
  title: { type: String },
  description: { type: String },
  schedule: { type: String },
  attendeeList: [{ type: String }],
  eventUpdates: { type: String },
  totalrevenue: { type: String },
  totalprofit: { type: Number },
  totalinvestment: { type: Number },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
