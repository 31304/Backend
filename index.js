const express = require("express");
const app = express();
const app1 = express();
const app2 = express();
const app3 = express();
require("dotenv").config();
const user = require("./Routes/user");
const event = require("./Routes/event");
let OrganiserRoutes = require("./Routes/OrganiserRoutes");
let EventRoutes = require("./Routes/EventRoutes");
const authController = require("./Authentication/Authentication");
const attendeeController = require("./Controller/attendee");
const eventController = require("./Controller/eventAttende");
const ticketController = require("./controller/ticket");
const notificationController = require("./Controller/notification");
const jwt = require("jsonwebtoken");
const strip = require("stripe")(process.env.STRIPE_SECRET_KEY);
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./Models/user");
const Ticket = require("./Models/ticketSchema");
const Attendee = require("./Models/attendeeSchema");
const Vendor = require("./Models/vendor");

const biddingRoutes = require("./Controller/biddingRoutes");
const feedbackRoutes = require("./Controller/feedbackRoutes");
const serviceRoutes = require("./Controller/serviceRoutes");
const vendorRoutes = require("./Controller/vendorRoutes");
const searchRoutes = require("./Controller/searchRoutes"); // If you have this file
const bookingRoutes = require("./Controller/bookingRoutes"); // If you have this file

app1.use(cors());
app1.use(express.json());
app.use(cors());
app.use(express.json());
app2.use(cors());
app2.use(express.json());
app3.use(cors());
app3.use(express.json());
const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
app2.use("/attendee", attendeeController);
app2.use("/event", eventController);
app2.use("/ticket", ticketController);
app2.use("/notification", notificationController);
app2.use("/auth", authController);
app.use("/user", user);
app.use("/event", event);
app1.use("/org", OrganiserRoutes);
app1.use("/event", EventRoutes);

app3.use("/bidding", biddingRoutes);
app3.use("/feedback", feedbackRoutes);
app3.use("/service", serviceRoutes);
app3.use("/vendor", vendorRoutes);
app3.use("/search", searchRoutes); // If you have this file
app3.use("/booking", bookingRoutes);

app1.listen(8080, () => {
  console.log("Port " + 8080 + " is running");
});
app.listen(process.env.PORT, () => {
  console.log("Port " + process.env.PORT + " is running");
});
app2.listen(3001, () => {
  console.log("Port " + 3001 + " is running");
});

app3.listen(3002, () => {
  console.log("Port " + 3002 + " is running");
});

mongoose
  .connect(process.env.MONGODB_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    const modelNames = mongoose.modelNames();
    console.log(modelNames);
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
// app.post("/create-ticket", async (req, res) => {
//   try {
//     const { eventId, attendeeId, purchaseDate, type, price } = req.body;

//     const newTicket = new Ticket({
//       eventId,
//       attendeeId,
//       purchaseDate,
//       type,
//       price,
//     });
//     const savedTicket = await newTicket.save();

//     res.status(201).json({ ticket: savedTicket });
//   } catch (error) {
//     res.status(500).json({ error: error.toString() });
//   }
// });
// app.post("/createAttendee", async (req, res) => {
//   const { name, email } = req.body;

//   try {
//     const attendee = await Attendee.create({
//       name,
//       email,
//       bookedEvents: [],
//       notifications: [],
//     });

//     res.status(200).json({ attendee });
//   } catch (error) {
//     res.status(500).json({ error: error.toString() });
//   }
// }),
app.post("/create-checkout-session", async (req, res) => {
  const { products } = req.body;
  const lineitems = products.map((product) => {
    return {
      price_data: {
        currency: "pkr",
        product_data: {
          name: product.id,
          images: [process.env.STRIPE_IMAGE],
        },
        unit_amount: product.price * 100,
      },
      quantity: product.quantity,
    };
  });
  const session = await strip.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineitems,
    mode: "payment",
    success_url: `http://localhost:3000/success`,
    cancel_url: `http://localhost:3000/fail`,
  });
  res.json({ id: session.id });
});
const io = socketIO(server);
app.get("/data", async (req, res) => {
  const data = await User.find({});
  res.json(data);
});
app.post("/remove", async (req, res) => {
  const { id } = req.body;
  const data = await User.findOneAndRemove({ _id: id });
  res.json(data);
});
app.use("/date", (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  res.json({ date: Date.now() });
});
const ios = socketIO(server, {
  cors: {
    origin: "http://localhost:3000", // replace with your frontend app URL
    methods: ["GET", "POST"],
  },
});
ios.on("connection", (socket) => {
  console.log("Client connected");
  setTimeout(() => {
    socket.emit("newNotification", "New Notification");
  }, 5000);
});
server.listen(4000, () => {
  console.log(`Server running on http://localhost:${4000}`);
});
