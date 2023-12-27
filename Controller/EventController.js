const event = require("../Models/event");
const Bid = require("../Models/bid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const User = require("../Models/user");
const Ticket = require("../Models/ticketSchema");
const express = require("express");
const Attendee = require("../Models/attendeeSchema");
const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;
const Joi = require("joi");
const Booking = require("../Models/booking");
const { eventNames } = require("../Models/Organiser");
const createEvent = async (req, res) => {
  try {
    const {
      eventName,
      eventType,
      dateTime,
      venue,
      maxTicketsRegular,
      maxTicketsVip,
      priceOfRegularTicket,
      priceOfVipTicket,
      servicesType,
    } = req.body;

    // Create a new event
    const newEvent = new event({
      eventName,
      eventType,
      dateTime,
      venue,
      maxTicketsRegular,
      maxTicketsVip,
      priceOfRegularTicket,
      priceOfVipTicket,
      servicesType,
      organizerEmail: req.email, // Ensure req.email is correct based on your authentication process
      status: dateTime <= new Date() ? "ongoing" : "upcoming",
    });

    // Save the new event to the database
    const savedEvent = await newEvent.save();

    // Respond with the created event
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const updateTicketInfo = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const {
      maxTicketsRegular,
      maxTicketsVip,
      priceOfRegularTicket,
      priceOfVipTicket,
    } = req.body;

    // Validate the input data (optional)
    if (
      !eventId ||
      !maxTicketsRegular ||
      !maxTicketsVip ||
      !priceOfRegularTicket ||
      !priceOfVipTicket
    ) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Find the event by ID
    const events = await event.findById(eventId);

    if (!events) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (
      events.maxTicketsRegular < maxTicketsRegular &&
      events.maxTicketsVip < maxTicketsVip
    ) {
      // Update ticket information
      events.maxTicketsRegular = maxTicketsRegular;
      events.maxTicketsVip = maxTicketsVip;
      events.priceOfRegularTicket = priceOfRegularTicket;
      events.priceOfVipTicket = priceOfVipTicket;
    }
    if (
      events.vipTicketsSold >= events.maxTicketsVip &&
      events.regularTicketsSold >= events.maxTicketsRegular
    ) {
      events.ticketAvailability = false;
    } else {
      events.ticketAvailability = true;
    }
    // Save the updated event
    const updatedEvent = await events.save();

    res.json({
      message: "Ticket information updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const calculateTotalRevenue = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find the event by ID
    const events = await event.findById(eventId);

    if (!events) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Calculate total revenue based on the number of tickets sold and their prices
    const totalRegularRevenue =
      events.regularTicketsSold * events.priceOfRegularTicket;
    const totalVipRevenue = events.vipTicketsSold * events.priceOfVipTicket;

    // Calculate the grand total
    const grandTotalRevenue = totalRegularRevenue + totalVipRevenue;

    res.json({ totalRevenue: grandTotalRevenue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const updateEventDetails = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const {
      eventName,
      eventType,
      dateTime,
      venue,
      maxTicketsRegular,
      maxTicketsVip,
      priceOfRegularTicket,
      priceOfVipTicket,
      servicesType,
    } = req.body;

    // Find the event by ID and update its details
    const updatedEvent = await event.findByIdAndUpdate(
      eventId,
      {
        eventName,
        eventType,
        dateTime,
        venue,
        maxTicketsRegular,
        maxTicketsVip,
        priceOfRegularTicket,
        priceOfVipTicket,
        servicesType,
        status: dateTime <= new Date() ? "ongoing" : "upcoming",
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (updatedEvent.organizerEmail !== req.email) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this event" });
    }
    // Respond with the updated event details
    res.json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const deleteOrCancelEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find the event by ID
    const Event = await event.findById(eventId);

    if (!Event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (Event.organizerEmail !== req.email) {
      return res
        .status(403)
        .json({
          message: "You are not authorized to delete or cancel this event",
        });
    }
    const currentDate = new Date();

    // Check if the event is in the past or upcoming
    if (Event.dateTime < currentDate) {
      // Delete past event
      await event.findByIdAndDelete(eventId);
      res.json({ message: "Past event deleted successfully" });
    } else {
      // For upcoming events, cancel them by updating the status
      Event.status = "cancelled";
      await Event.save();
      res.json({ message: "Upcoming event disabled successfully", Event });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const getAllEvents = async (req, res) => {
  try {
    // Find all events in the database
    const events = await event.find();

    // Respond with the list of events
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

const getFeedbackAndRatings = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find the event by ID
    const events = await event.findById(eventId);

    if (!events) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Respond with feedback and ratings
    res.json({
      feedback: events.feedback,
      ratings: events.ratings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

const searchEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find the event by ID
    const foundEvent = await event.findById(eventId);

    if (!foundEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Send the event details in the response
    res.json(foundEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const updateTicketCounts = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Count the number of VIP and regular tickets sold for the event
    const vipTicketsSold = await Ticket.countDocuments({
      eventId,
      type: "vip",
    });
    const regularTicketsSold = await Ticket.countDocuments({
      eventId,
      type: "regular",
    });

    // Find the event by ID
    const Event = await event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Update the VIP and regular tickets sold attributes in the event schema
    Event.vipTicketsSold = vipTicketsSold;
    Event.regularTicketsSold = regularTicketsSold;

    // Check if the maximum tickets for both types have been sold
    if (
      vipTicketsSold >= Event.maxTicketsVip &&
      regularTicketsSold >= Event.maxTicketsRegular
    ) {
      Event.ticketAvailability = false;
    }

    // Save the updated event to the database
    await Event.save();

    // Respond with the updated event details
    res.json({
      message: "Ticket counts and availability updated successfully",
      Event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

const getAttendeesForEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find all tickets for the event
    const tickets = await Ticket.find({ eventId }).populate("attendeeId");

    // Extract attendee information from the tickets
    const attendees = tickets.map(async (ticket) => {
      // Get attendee details
      const attendee = await Attendee.findById(ticket.attendeeId);

      // Update attendee list in the event
      await event.findByIdAndUpdate(
        eventId,
        { $addToSet: { attendeeList: attendee.name } },
        { new: true }
      );

      // Return relevant attendee information
      return {
        attendeeId: attendee._id,
        name: attendee.name,
        email: attendee.email,
        status: ticket.status,
      };
    });

    // Respond with the list of attendees
    res.json(await Promise.all(attendees));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const getAttendeeCount = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find the event by ID
    const events = await event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get the count of attendees from the attendeeList in the event
    const attendeeCount = events.attendeeList.length;

    // Respond with the count of attendees for the event
    res.json({ attendeeCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const searchAttendeeInEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { name } = req.query;

    // Find the event by ID
    const events = await event.findById(eventId);

    if (!events) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Search for an attendee in the attendeeList based on the provided name
    const matchingAttendees = events.attendeeList.filter((attendeeName) =>
      attendeeName.toLowerCase().includes(name.toLowerCase())
    );

    // Respond with the list of matching attendees
    res.json({ matchingAttendees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const viewBidsForEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { serviceType } = req.query;

    // Build the query object based on the provided service type
    const query = { eventId };
    if (serviceType) {
      query.serviceType = serviceType; // Adjust to your actual field name
    }

    // Find bids for the event based on the query
    const bids = await Bid.find(query);

    // Respond with the list of bids
    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const acceptOrRejectBid = async (req, res) => {
  try {
    const bidId = req.params.bidId;
    const { decision } = req.body; // 'accepted' or 'rejected'

    // Validate the decision (optional)
    if (decision !== "accepted" && decision !== "rejected") {
      return res.status(400).json({ message: "Invalid decision" });
    }

    // Update the bid status based on the decision
    const updatedBid = await Bid.findByIdAndUpdate(
      bidId,
      { $set: { status: decision } },
      { new: true }
    );
    if (!updatedBid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    // Respond with the updated bid
    res.json(updatedBid);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const deleteBid = async (req, res) => {
  try {
    const bidId = req.params.bidId;

    // Delete the bid
    const deletedBid = await Bid.findByIdAndDelete(bidId);

    if (!deletedBid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    // Respond with a success message or additional information if needed
    res.json({ message: "Bid deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const addpic = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { pictures } = req.body;

    // Find the event by ID
    const existingEvent = await event.findById(eventId);

    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Add pictures to the event
    existingEvent.pictures = pictures;

    // Save the updated event
    const updatedEvent = await existingEvent.save();

    res.json({ message: "Pictures added successfully", event: updatedEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const postFeedbackAndRatings = async (req, res) => {
  const schema = Joi.object({
    feedbackAndRatings: Joi.array()
      .items(
        Joi.object({
          feedback: Joi.string().required(),
          rating: Joi.number().required(),
        })
      )
      .required(),
  });

  try {
    const validationResult = schema.validate(req.body);
    if (validationResult.error) {
      return res
        .status(400)
        .json({
          message: "Validation error",
          detail: validationResult.error.details,
        });
    }

    // Your logic for handling valid feedback and ratings
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const sendBookingRequest = async (req, res) => {
  try {
    const { serviceName, bookingDate } = req.body;
    const { eventId, vendorId } = req.params;
    // Create a new booking request
    const newBooking = new Booking({
      eventId,
      vendorId,
      serviceName,
      bookingDate,
      status: "pending", // Default status for a new booking request
    });

    // Save the booking request to the database
    const savedBooking = await newBooking.save();

    // Respond with the created booking
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const calculateTotalInvestment = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find all accepted bids for the specified event
    const acceptedBids = await Bid.find({
      eventId: eventId,
      status: "accepted",
    });

    // Calculate the total investment by summing the bid amounts
    const totalInvestment = acceptedBids.reduce(
      (sum, bid) => sum + bid.bidAmount,
      0
    );

    // Update the totalinvestment field in the Event model
    await event.findByIdAndUpdate(eventId, {
      totalinvestment: totalInvestment,
    });

    res.json({ totalInvestment });
  } catch (error) {
    console.error("Error calculating total investment:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
const calculateTotalProfit = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find the event by ID
    const events = await event.findById(eventId);

    if (!eventNames) {
      return res.status(404).json({ message: "Event not found" });
    }
    const totalRevenue = parseFloat(event.totalrevenue);
    if (isNaN(totalRevenue)) {
      return res.status(400).json({ message: "Invalid totalrevenue value" });
    }
    // Calculate total profit by subtracting totalinvestment from totalrevenue
    const totalProfit = events.totalrevenue - events.totalinvestment;

    // Update the totalprofit field in the Event model
    await event.findByIdAndUpdate(eventId, { totalprofit: totalProfit });

    res.json({ totalProfit });
  } catch (error) {
    console.error("Error calculating total profit:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};
module.exports = {
  createEvent,
  postFeedbackAndRatings,
  calculateTotalInvestment,
  sendBookingRequest,
  calculateTotalProfit,
  updateEventDetails,
  addpic,
  searchEvent,
  calculateTotalRevenue,
  deleteOrCancelEvent,
  getAllEvents,
  updateTicketInfo,
  updateTicketCounts,
  getAttendeesForEvent,
  getAttendeeCount,
  searchAttendeeInEvent,
  viewBidsForEvent,
  acceptOrRejectBid,
  deleteBid,
  getFeedbackAndRatings,
};

//2023-12-31T18:00:00.000Z
/*"eventName":"Eman@gmail.com",
"eventType":"concert",
"dateTime":"2023-12-20T18:00:00.000Z",
"venue":"F-6 Islamabad",
"maxTicketsRegular":1000,
"maxTicketsVip":1000,
"priceOfRegularTicket":500,
"priceOfVipTicket":500,
 "servicesType": ["Service1", "Service2", "Service3"]*/
