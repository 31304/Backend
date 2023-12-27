const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  serviceName: { type: String, required: true },
  description: String,
  price: Number,
  availability: { start: Date, end: Date }, // Date range for availability
  images: [String],
  category: String
});

module.exports = mongoose.model('Service', serviceSchema);
