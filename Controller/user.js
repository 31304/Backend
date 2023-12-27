const User = require("../Models/user");
const jwt = require("jsonwebtoken");
const Event = require("../Models/event");
const Vendor = require("../Models/vendor");
const Attendee = require("../Models/attendeeSchema");
const login = async (req, res) => {
  var { email, password, signIn, name, role, pic } = req.body;
  var user = await User.findOne({ email: email });
  if (!signIn) {
    user = await User.findOne({
      email: email,
      password: password,
    });
  }
  if (user?.verified === false) {
    return res
      .status(401)
      .json({ message: "Your request is pending", verified: false });
  } else if (user?.status === true) {
    return res
      .status(401)
      .json({ message: "Your account is blocked", status: true });
  }
  if (!user && !signIn) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (signIn && !user) {
    let verified = true;
    let showMessages = true;
    if (role?.toLowerCase() === "admin") {
      verified = false;
      showMessages = false;
    }
    if (role == null) {
      role = "user";
    }
    console.log(pic);
    console.log(req.body);
    await User.create({
      name: name,
      email: email,
      password: password,
      role: role.toLowerCase(),
      signIn: signIn,
      verified: verified,
      showMessages: showMessages,
      pic: pic,
    });
    if (role.toLowerCase() === "user") {
      Attendee.create({
        name: name,
        email: email,
      });
    } else if (role.toLowerCase() === "vendor") {
      {
        Vendor.create({
          name: name,
          email: email,
        });
      }
    }
  }
  user = await User.findOne({ email: email });
  if (user) {
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    return res.status(200).json({
      token,
      verified: user.verified,
      showMessages: user.showMessages,
      role: user.role,
    });
  }
  if (password !== user?.password) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
};
const signup = async (req, res) => {
  const { name, email, password, role, pic } = req.body;
  const user = await User.findOne({ email: email });
  if (user) {
    return res.status(401).json({ message: "Account Already exist!" });
  }
  var verified = true;
  var showMessages = true;
  if (role.toLowerCase() === "admin") {
    verified = false;
    showMessages = false;
  }
  User.create({
    name: name,
    email: email,
    password: password,
    role: role.toLowerCase(),
    verified: verified,
    showMessages: showMessages,
    pic: pic,
  })
    .then(() => {
      if (role.toLowerCase() === "user") {
        Attendee.create({
          name: name,
          email: email,
        });
      } else if (role.toLowerCase() === "vendor") {
        {
          Vendor.create({
            name: name,
            email: email,
          });
        }
      }
      res.status(200).json({
        message: "Account created successfully!",
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Account creation failed!",
      });
    });
};
const verifyAccount = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (user) {
    res.status(200).json({
      registered: true,
    });
  } else {
    res.status(200).json({
      registered: false,
    });
  }
};
const RequestAcceptMessge = async (req, res) => {
  const id = req.id;
  console.log(id);
  const user = await User.findOne({ _id: id });
  user.showMessages = true;
  await user.save();
  console.log(user);
  res.status(200).json({
    message: "Message Accepted",
    name: user.name,
    email: user.email,
  });
};

const PendingRequest = async (req, res) => {
  const user = await User.find({ verified: false });
  let data = user.map((item) => ({
    name: item.name,
    email: item.email,
    role: item.role,
    pic: item.pic,
    id: item._id,
  }));
  res.status(200).json({
    data,
  });
};
const AcceptedRequest = async (req, res) => {
  try {
    const { idno } = req.body;
    const user = await User.findOne({ _id: idno });
    if (user) {
      user.verified = true;
      await user.save();
      return res.status(200).json({
        verified: user.verified,
        name: user.name,
        email: user.email,
      });
    } else {
      return res.status(400).json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Error in AcceptedRequest:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const DeclineRequest = async (req, res) => {
  try {
    const { idno } = req.body;
    const user = await User.findOneAndRemove({ _id: idno });
    if (user) {
      return res.status(200).json({
        verified: user.verified,
        name: user.name,
        email: user.email,
      });
    } else {
      return res.status(400).json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Error in AcceptedRequest:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const getAllOrganizar = async (req, res) => {
  try {
    const users = await User.find({ role: "admin", verified: true });
    console.log(users);
    console.log("hello");

    const data = await Promise.all(
      users.map(async (item) => {
        const totalEvents = await Event.find({ organizerEmail: item.email });
        console.log("item", item);

        let rating = 0;
        for (let i = 0; i < totalEvents?.length; i++) {
          let j = 0;
          for (j = 0; j < totalEvents[i]?.feedbackAndRatings?.length; j++) {
            rating += totalEvents[i]?.feedbackAndRatings[j]?.rating;
            console.log(rating);
          }
          rating = rating / j + 1;
        }
        rating = rating / totalEvents.length;
        rating = rating.toFixed(1);
        rating = parseFloat(rating);
        if (isNaN(rating)) {
          rating = 0;
        }
        let status = "Below Average";
        if (rating >= 4.5) {
          status = "Excellent";
        } else if (rating >= 3.0) {
          status = "Good";
        }

        const length = totalEvents.length;
        console.log(length);

        return {
          name: item.name,
          email: item.email,
          totalEvents: length,
          pic: item.pic,
          rating: rating,
          status: status,
          id: item._id,
          block: item.status,
        };
      })
    );

    res.status(200).json({ data });
  } catch (error) {
    console.error("Error in getAllOrganizar:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllVendor = async (req, res) => {
  try {
    const users = await User.find({ role: "vendor", verified: true });
    let data = await Promise.all(
      users.map(async (item) => {
        const vendor = await Vendor.findOne({ email: item.email });
        const rating = vendor ? vendor.rating : 0;
        let status = "Below Average";
        if (rating >= 4.5) {
          status = "Excellent";
        } else if (rating >= 3.0) {
          status = "Good";
        }
        return {
          name: item.name,
          email: item.email,
          pic: item.pic,
          rating: rating,
          status: status,
          id: item._id,
          block: item.status,
        };
      })
    );

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Error in getAllOrganizar:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const BlockUser = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findOne({ _id: id });
    if (user) {
      user.status = true;
      console.log(user);
      await user.save();
      return res.status(200).json({
        message: "User Blocked Successfully!",
        name: user.name,
        email: user.email,
      });
    } else {
      return res.status(400).json({
        message: "User not found!",
      });
    }
  } catch (error) {
    console.error("Error in BlockUser:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const UnBlockUser = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findOne({ _id: id });
    if (user) {
      user.status = false;
      await user.save();
      console.log(user);
      return res.status(200).json({
        name: user.name,
        email: user.email,
        message: "User UnBlocked Successfully!",
      });
    } else {
      return res.status(400).json({
        message: "User not found!",
      });
    }
  } catch (error) {
    console.error("Error in BlockUser:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const getOrgaziarNumber = async (req, res) => {
  try {
    const user = await User.find({ role: "admin", verified: true });
    console.log(user.length);
    res.status(200).json({
      length: user.length,
    });
  } catch (error) {
    console.error("Error in getAllOrganizar:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const getVendorNumber = async (req, res) => {
  try {
    const user = await User.find({ role: "vendor", verified: true });
    res.status(200).json({
      length: user.length,
    });
  } catch (error) {
    console.error("Error in getAllOrganizar:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
module.exports = {
  login,
  signup,
  verifyAccount,
  RequestAcceptMessge,
  PendingRequest,
  AcceptedRequest,
  DeclineRequest,
  getAllOrganizar,
  BlockUser,
  UnBlockUser,
  getAllVendor,
  getOrgaziarNumber,
  getVendorNumber,
};
