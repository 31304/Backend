const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    enum: ["vendor", "admin", "superadmin", "user"],
    default: "user",
  },
  status: {
    type: Boolean,
    default: false,
  },
  signIn: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  showMessages: {
    type: Boolean,
    default: false,
  },
  pic: {
    type: String,
    default:
      "https://campussafetyconference.com/wp-content/uploads/2020/08/iStock-476085198.jpg",
  },
});
const User = mongoose.model("User", userSchema);
module.exports = User;
