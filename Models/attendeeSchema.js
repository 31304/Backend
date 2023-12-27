const mongoose = require('mongoose');
const attendeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  bookedEvents: [{
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    status: String,
  }],
  notifications: [
    {
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
      message: { type: String },
      type: { type: String, enum: ['eventUpdate', 'newEvent', 'cancellation'] },
      isRead: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ]
});
const Attendee = mongoose.model('Attendee', attendeeSchema);
module.exports = Attendee;
