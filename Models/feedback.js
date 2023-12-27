const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  rating: Number,
  comment: String,
  response: { // Vendor's response to the feedback
    text: String,
    dateResponded: { type: Date, default: Date.now }
  },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
