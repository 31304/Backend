const express = require("express");
const router = express.Router();
const authenticateUser = require("../Authentication/Authentication"); // Adjust the path as necessary
const Vendor = require("../Models/vendor"); // Import the Vendor model
const Event = require("../Models/event"); // Import the Event model
const Bid = require("../Models/bid"); // Import the Bid model

// Submit a bid
router.post("/submit", authenticateUser, async (req, res) => {
  if (req.role !== "vendor")
    return res.status(403).json({ message: "Access Denied" });

  const { eventId, serviceType, bidAmount, message } = req.body;

  try {
    // Find the vendor by email to get the vendor's ID
    const vendor = await Vendor.findOne({ email: req.email });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    if (!vendor.isActive)
      return res.status(403).json({ message: "Vendor is not activated" });

    // Check if the event exists and contains the specified serviceType
    const event = await Event.findById(eventId);
    if (!event || !event.servicesType.includes(serviceType)) {
      return res.status(400).json({ message: "Invalid event or service type" });
    }

    // Check if a bid for this service type by this vendor for this event already exists
    const existingBid = await Bid.findOne({
      vendorId: vendor._id,
      eventId,
      serviceType,
    });
    if (existingBid) {
      return res
        .status(400)
        .json({
          message: "Bid already submitted for this service type and event",
        });
    }

    const newBid = new Bid({
      vendorId: vendor._id,
      eventId,
      serviceType,
      bidAmount,
      message,
      status: "submitted",
      dateSubmitted: new Date(),
    });

    await newBid.save();
    res
      .status(201)
      .json({ message: "Bid submitted successfully", bidId: newBid._id });
  } catch (error) {
    res.status(500).json({ message: "Error submitting bid: " + error.message });
  }
});

// View all bids made by a vendor
router.get("/", authenticateUser, async (req, res) => {
  if (req.role !== "vendor")
    return res.status(403).json({ message: "Access Denied" });

  try {
    // Find the vendor by email to get the vendor's ID
    const vendor = await Vendor.findOne({ email: req.email });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Fetch all bids associated with the vendor
    const bids = await Bid.find({ vendorId: vendor._id }).populate({
      path: "eventId",
      select: "eventName dateTime",
    }); // Populating event name and date

    // Format the bids to include required fields
    const formattedBids = bids.map((bid) => ({
      bidId: bid._id,
      eventName: bid.eventId.eventName,
      eventDate: bid.eventId.dateTime,
      serviceType: bid.serviceType,
      bidAmount: bid.bidAmount,
      message: bid.message,
      status: bid.status,
      dateSubmitted: bid.dateSubmitted,
    }));

    res.status(200).json(formattedBids);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bids: " + error.message });
  }
});

router.get("/:bidId", authenticateUser, async (req, res) => {
  if (req.role !== "vendor")
    return res.status(403).json({ message: "Access Denied" });

  const bidId = req.params.bidId;
  try {
    // Find the vendor by email to get the vendor's ID
    const vendor = await Vendor.findOne({ email: req.email });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Fetch the specific bid associated with the vendor
    const bid = await Bid.findOne({
      _id: bidId,
      vendorId: vendor._id,
    }).populate({ path: "eventId", select: "eventName dateTime" }); // Populating event name and date

    if (!bid) {
      return res
        .status(404)
        .json({ message: "Bid not found or access denied" });
    }

    // Format the bid to include required fields
    const formattedBid = {
      vendorId: vendor._id,
      eventName: bid.eventId.eventName,
      eventDate: bid.eventId.dateTime,
      serviceType: bid.serviceType,
      bidAmount: bid.bidAmount,
      message: bid.message,
      status: bid.status,
      dateSubmitted: bid.dateSubmitted,
    };

    res.status(200).json(formattedBid);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bid: " + error.message });
  }
});

// Delete a bid
router.delete("/delete/:bidId", authenticateUser, async (req, res) => {
  if (req.role !== "vendor")
    return res.status(403).json({ message: "Access Denied" });

  const bidId = req.params.bidId;
  try {
    // Find the vendor by email to get the vendor's ID
    const vendor = await Vendor.findOne({ email: req.email });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    if (!vendor.isActive)
      return res.status(403).json({ message: "Vendor is not activated" });

    // Find the bid and ensure it belongs to the authenticated vendor and is in 'submitted' status
    const bid = await Bid.findOne({
      _id: bidId,
      vendorId: vendor._id,
      status: "submitted",
    });

    if (!bid) {
      return res
        .status(404)
        .json({
          message: "Bid not found, already processed, or access denied",
        });
    }

    // Delete the bid
    await Bid.deleteOne({ _id: bidId });
    res.status(200).json({ message: "Bid deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting bid: " + error.message });
  }
});

module.exports = router;
