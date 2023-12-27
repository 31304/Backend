const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
  description: String,
  serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }], // Array of service IDs
  profilePicture: String,
  rating: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Vendor', vendorSchema);
