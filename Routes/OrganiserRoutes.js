const express = require("express");
const router = express.Router();
const {
  register,
  login,
  updateUserProfile,
} = require("../Controller/OrganiserController");
const { authenticateUser } = require("../Authentication/Authentication");
router.post("/register", register);
router.post("/login", login);
//router.put("/profile", authenticateUser, updateUserProfile);
module.exports = router;
