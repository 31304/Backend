const express = require("express");
const Event = require("../Models/event");
const authenticateUser = require("../Authentication/Authentication");
const Attendee = require("../Models/attendeeSchema");
const Ticket = require("../Models/ticketSchema");

const router = express.Router();

router.get("/allevents", authenticateUser, async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/search", authenticateUser, async (req, res) => {
  const { eventName, eventType, date, venue } = req.query;
  const query = {};

  if (eventName) query.eventName = { $regex: new RegExp(eventName, "i") };
  if (eventType) query.eventType = eventType;
  if (date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.dateTime = { $gte: new Date(date), $lte: endOfDay };
  }
  if (venue) query.venue = { $regex: new RegExp(venue, "i") };

  try {
    const events = await Event.find(query);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:eventId", authenticateUser, async (req, res) => {
  const eventId = req.params.eventId;

  try {
    const event = await Event.findById(eventId);
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/give-feedback/:eventId", authenticateUser, async (req, res) => {
  const eventId = req.params.eventId;
  const attendeeEmail = req.email;
  const { feedback, rating } = req.body;

  try {
    // Find the attendee by email
    const attendee = await Attendee.findOne({ email: attendeeEmail });
    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    // Find the event by ID
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Add feedback to the event
    event.feedbackAndRatings.push({
      userEmail: attendeeEmail,
      feedback,
      rating,
    });

    await event.save();

    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.get("/checkForFeedback/:eventId", authenticateUser, async (req, res) => {
  const eventId = req.params.eventId;
  const attendeeEmail = req.email;
  try {
    const attendee = await Attendee.findOne({ email: attendeeEmail });
    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    // Find the event by ID
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the attendee has booked a ticket for the event
    const isAttendeeBooked = attendee.bookedEvents.some((booking) =>
      booking.eventId.equals(event._id)
    );
    if (!isAttendeeBooked) {
      return res
        .status(403)
        .json({
          message: "You must book a ticket for the event to give feedback",
        });
    }

    // Check if the event is completed before allowing feedback
    if (event.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Feedback can only be given for completed events" });
    }

    // Check if the attendee has already given feedback for this event
    const existingFeedback = event.feedbackAndRatings.find(
      (item) => item.userEmail === attendeeEmail
    );
    if (existingFeedback) {
      return res
        .status(400)
        .json({ message: "Feedback submitted for this event" });
    }

    res.status(201).json({ message: "Feedback can be given" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.post("/insert-event", async (req, res) => {
  try {
    // Assign random values directly (without using faker)
    const randomValues = () => ({
      words: Math.random().toString(36).substring(7),
      word: Math.random().toString(36).substring(2),
      futureDate: new Date(
        Date.now() + Math.floor(Math.random() * 10000000000)
      ),
      city: Math.random().toString(36).substring(2, 10),
      number: Math.floor(Math.random() * (200 - 50 + 1) + 50),
      boolean: Math.random() < 0.5,
      arrayElement: (arr) => arr[Math.floor(Math.random() * arr.length)],
      paragraph:
        Math.random().toString(36).substring(2, 10) +
        " " +
        Math.random().toString(36).substring(2, 10),
    });

    const fakeEvent = {
      eventName:
        randomValues().words +
        " " +
        randomValues().words +
        " " +
        randomValues().words,
      eventType: randomValues().word,
      dateTime: randomValues().futureDate,
      venue: randomValues().city,
      maxTicketsRegular: 100,
      regularTicketsSold: 90,
      maxTicketsVip: 100,
      vipTicketsSold: 10,
      priceOfRegularTicket: randomValues().number,
      priceOfVipTicket: randomValues().number,
      ticketAvailability: randomValues().boolean,
      servicesType: [randomValues().word, randomValues().word],
      organizerEmail: randomValues().word + "@example.com",
      status: randomValues().arrayElement([
        "upcoming",
        "ongoing",
        "completed",
        "cancelled",
      ]),
      feedbackAndRatings: [
        {
          userEmail: randomValues().word + "@example.com",
          feedback: randomValues().paragraph,
          rating: Math.floor(Math.random() * (5 - 1 + 1) + 1),
        },
      ],
      schedule: randomValues().paragraph,
      attendeeList: [
        randomValues().word + "@example.com",
        randomValues().word + "@example.com",
      ],
      eventUpdates: randomValues().paragraph,
      totalrevenue: (Math.random() * (1000 - 1) + 1).toFixed(2),
    };

    // Create and save the event
    const newEvent = new Event(fakeEvent);
    await newEvent.save();

    const eventUpdateNotification = {
      eventId: newEvent._id,
      message: "New event: " + newEvent.eventName,
      type: "newEvent",
    };

    await Attendee.updateMany(
      {},
      {
        $push: { notifications: eventUpdateNotification },
      }
    );

    res
      .status(201)
      .json({ message: "Event inserted successfully", event: newEvent });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.put("/update-event/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find the event by ID
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Generate a random status
    const randomStatus = () =>
      ["upcoming", "ongoing", "completed", "cancelled"][
        Math.floor(Math.random() * 4)
      ];
    const newStatus = randomStatus();

    // Update the event status
    await Event.findByIdAndUpdate(eventId, { status: newStatus });

    // Get the list of attendees who purchased tickets for this event
    const attendeesWithTickets = await Ticket.find({ eventId }).distinct(
      "attendeeId"
    );

    // Update notifications for specific attendees
    const eventUpdateNotification = {
      eventId: event._id,
      message: `Event status updated: ${event.eventName} is now ${newStatus}`,
      type: "eventUpdate",
    };

    await Attendee.updateMany(
      { _id: { $in: attendeesWithTickets } },
      {
        $push: { notifications: eventUpdateNotification },
      }
    );

    res
      .status(200)
      .json({ message: "Event status updated successfully", newStatus });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.delete("/delete-event/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find the event by ID
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    // Update notifications for all attendees
    const cancellationNotification = {
      eventId: event._id,
      message: `Event cancellation: ${event.eventName} has been cancelled`,
      type: "cancellation",
    };

    await Attendee.updateMany(
      {},
      {
        $push: { notifications: cancellationNotification },
      }
    );

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = router;
