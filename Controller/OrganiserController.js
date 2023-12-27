const org = require("../Models/Organiser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const User = require("../Models/user");

const express = require("express");

const router = express.Router();

const jwtSecret = process.env.JWT_SECRET;

const register = async (req, res) => {
  console.log(req.body);
  const { name, email, password, role, signIn /*contactInformation*/ } =
    req.body;
  if (signIn && password) {
    const user = await User.findOne({ email: email });
    if (user?.password != null) {
      return res.status(401).json({ message: "Account Already exist" });
    } else if (user) {
      user.password = password;
      await user.save();
      res.status(200).json({
        message: "Account created successfully",
      });
    }
  }
  const user = await User.find({ email: email });
  if (user.length > 0) {
    return res.status(401).json({ message: "Account Already exist" });
  }
  var verified = true;
  if (role === "admin") {
    verified = false;
  }
  User.create({
    name: name,
    email: email,
    password: password,
    role: role,
    signIn: signIn,
    verified: verified,
  })
    .then(() => {
      if (role === "admin") {
        org.create({
          username: name,
          email: email,
          password: password,
          //    contactInformation:contactInformation,
        });
      }
      res.status(200).json({
        message: "Account created successfully",
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Account creation failed",
      });
    });
};

const login = async (req, res) => {
  console.log(req.body);
  const { email, password, signIn } = req.body;
  var user = await User.findOne({ email: email });
  if (!signIn) {
    user = await User.findOne({
      email: email,
      password: password,
    });
  }
  if (user?.verified === false) {
    return res.status(401).json({ message: "Your request is pending" });
  } else if (user?.status === true) {
    return res.status(401).json({ message: "Your account is blocked" });
  }
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user) {
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      jwtSecret,
      {
        expiresIn: "1h",
      }
    );
    return res.json({ token });
  }
  if (password !== user.password) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
};
updateUserProfile = async (req, res) => {
  if (req.role !== "admin")
    return res.status(403).json({ message: "Access Denied" });

  try {
    const { username, email, organizationName, contactInformation } = req.body;

    // Construct the update object with only the specified fields
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (organizationName) updateData.organizationName = organizationName;
    if (contactInformation) updateData.contactInformation = contactInformation;

    // Update the vendor profile using the email from the JWT token
    await org.findOneAndUpdate({ email: req.email }, updateData, { new: true });
    res.status(200).json({ message: "Organiser profile updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating vendor profile: " + error.message });
  }
};
module.exports = {
  register,
  login,
  updateUserProfile,
};
