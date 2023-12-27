const Ticket = require("../Models/ticketSchema");
const express = require("express");
const router = express.Router();
const authenticateUser = require("../Authentication/Authentication");
const Attendee = require("../Models/attendeeSchema");
const Event = require("../Models/event");

router.post("/purchaseregular/:eventId", authenticateUser, async (req, res) => {
  const eventId = req.params.eventId;
  const attendeeEmail = req.email;

  try {
    // Find the attendee by email
    const attendee = await Attendee.findOne({ email: attendeeEmail });
    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    // Find the event by ID to extract status, price, maxTicketsRegular, and regularTicketsSold
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if regular tickets are sold out
    if (event.regularTicketsSold >= event.maxTicketsRegular) {
      return res.status(400).json({ message: "Regular tickets are sold out" });
    }

    // Get the price of the regular ticket
    const regularTicketPrice = event.priceOfRegularTicket || 0; // Replace 'priceOfRegularTicket' with the correct field name

    const ticket = new Ticket({
      eventId,
      attendeeId: attendee._id,
      price: regularTicketPrice,
      type: "regular",
    });

    await ticket.save();

    // Update bookedEvents array
    const status = event.status || "upcoming"; // Default to 'upcoming' if status is not available
    attendee.bookedEvents.push({ eventId, ticketId: ticket._id, status });
    await attendee.save();

    // Increment the regularTicketsSold count
    event.regularTicketsSold += 1;
    await event.save();

    res
      .status(201)
      .json({ message: "Ticket purchased successfully", ticketId: ticket._id });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" + error });
  }
});

router.post("/purchasevip/:eventId", authenticateUser, async (req, res) => {
  const eventId = req.params.eventId;
  const attendeeEmail = req.email;

  try {
    // Find the attendee by email
    const attendee = await Attendee.findOne({ email: attendeeEmail });

    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    // Find the event by ID to extract status, price, maxTicketsVip, and vipTicketsSold
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if VIP tickets are sold out
    if (event.vipTicketsSold >= event.maxTicketsVip) {
      return res.status(400).json({ message: "VIP tickets are sold out" });
    }

    // Get the price of the VIP ticket
    const vipTicketPrice = event.priceOfVipTicket || 0; // Replace 'priceOfVipTicket' with the correct field name

    const ticket = new Ticket({
      eventId,
      attendeeId: attendee._id,
      price: vipTicketPrice,
      type: "vip",
    });

    await ticket.save();

    // Update bookedEvents array
    const status = event.status || "upcoming"; // Default to 'upcoming' if status is not available
    attendee.bookedEvents.push({ eventId, ticketId: ticket._id, status });
    await attendee.save();

    // Increment the vipTicketsSold count
    event.vipTicketsSold += 1;
    await event.save();

    res.status(201).json({
      message: "VIP Ticket purchased successfully",
      ticketId: ticket._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" + error });
  }
});

router.get("/", authenticateUser, async (req, res) => {
  const attendeeEmail = req.email;

  try {
    const attendee = await Attendee.findOne({ email: attendeeEmail });

    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    const tickets = await Ticket.find({ attendeeId: attendee._id });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" + error });
  }
});

router.get("/:ticketId", authenticateUser, async (req, res) => {
  const ticketId = req.params.ticketId;

  try {
    const ticket = await Ticket.findById(ticketId);
    const eventId = ticket.eventId;
    const event = await Event.findById(eventId);
    res.status(200).json({ ticket, event });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" + error });
  }
});

router.post("/cancel/:ticketId", authenticateUser, async (req, res) => {
  const ticketId = req.params.ticketId;
  const attendeeEmail = req.email; // Attendee email of the authenticated user

  try {
    // Find the attendee by email
    const attendee = await Attendee.findOne({ email: attendeeEmail });

    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    // Find the ticket by ID
    const ticket = await Ticket.findById(ticketId);
    const eventId = ticket.eventId.toString();

    const event = await Event.findById(eventId);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the ticket belongs to the authenticated user
    if (ticket.attendeeId.toString() !== attendee._id.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to cancel this ticket" });
    }

    if (event.status === "completed" || event.status === "ongoing") {
      return res.status(403).json({
        message: "Can not cancel this ticket. Event is ongoing or completed",
      });
    }

    if (ticket.type === "regular") {
      event.regularTicketsSold -= 1;
      event.save();
    } else if (ticket.type === "vip") {
      event.vipTicketsSold -= 1;
      event.save();
    }

    // Cancel the ticket
    await Ticket.findByIdAndDelete(ticketId);
    const updatedBookedEvents = attendee.bookedEvents.filter(
      (bookedEvent) => bookedEvent.ticketId.toString() !== ticketId
    );

    attendee.bookedEvents = updatedBookedEvents;
    await attendee.save();

    res
      .status(200)
      .json({ message: "Ticket reservation canceled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" + error });
  }
});

router.put("/update/:ticketId", authenticateUser, async (req, res) => {
  const ticketId = req.params.ticketId;
  const { ticketType } = req.body;
  const attendeeEmail = req.email;

  try {
    // Find the attendee by email
    const attendee = await Attendee.findOne({ email: attendeeEmail });

    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    // Find the ticket by ID
    const ticket = await Ticket.findById(ticketId);
    const eventId = ticket.eventId.toString();

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (event.status === "completed" || event.status === "ongoing") {
      return res.status(403).json({
        message: "Can not update this ticket. Event is ongoing or completed",
      });
    }

    // Check if the ticket belongs to the authenticated user
    if (ticket.attendeeId.toString() !== attendee._id.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to update this ticket" });
    }

    if (ticketType === "vip") {
      if (event.vipTicketsSold >= event.maxTicketsVip) {
        return res.status(400).json({ message: "VIP tickets are sold out" });
      }
    } else if (ticketType === "regular") {
      if (event.regularTicketsSold >= event.maxTicketsRegular) {
        return res
          .status(400)
          .json({ message: "Regular tickets are sold out" });
      }
    }

    ticket.type = ticketType;
    await ticket.save();

    res.status(200).json({
      message: "Ticket type updated successfully",
      ticketId: ticket._id,
      newType: ticket.type,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" + error });
  }
});

module.exports = router;
