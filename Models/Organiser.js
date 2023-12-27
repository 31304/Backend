const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true,unique:true },
  organizationName: { type: String},
  contactInformation: { type: String ,required:true},
  eventManagementHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
});


const Organizer = mongoose.model('Organizer', organizerSchema);
module.exports = Organizer;
