const express = require("express");
const app = express();
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

app.use(cors());
app.use(express.json());
app.use("/user", user);
app.use("/event", event);

app.listen(process.env.PORT, () => {
  console.log("Port " + process.env.PORT + " is running");
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
