const express = require('express');
const router = express.Router();
const authenticateUser = require("../Authentication/Authentication");// Adjust the path as necessary
const Event = require('../Models/event');

// Route to search for events
router.get('/events', authenticateUser, async (req, res) => {
  try {
      const { query } = req.query;
      let searchCriteria = {};

      if (query) {
          const regexQuery = { $regex: query, $options: 'i' }; // 'i' for case-insensitivity
          searchCriteria = {
            $or: [
              { eventName: regexQuery },
              { eventType: regexQuery },
              { venue: regexQuery },
              { 'servicesType': regexQuery }
            ]
          };
      }

      const events = await Event.find(searchCriteria).select('eventName eventType dateTime venue servicesType status');

      res.status(200).json(events);
  } catch (error) {
      res.status(500).json({ message: 'Error searching for events: ' + error.message });
  }
});

router.get('/allevents', authenticateUser, async (req, res) => {
  try {
      // Fetch all events
      const events = await Event.find({})
          .select('eventName eventType dateTime venue servicesType status');

      res.status(200).json(events);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching events: ' + error.message });
  }
});

router.get('/event/:eventId', authenticateUser, async (req, res) => {
  const eventId = req.params.eventId;
  
  try {
      // Fetch the event by its ID
      const event = await Event.findById(eventId)
          .select('eventName eventType dateTime venue servicesType status');

      if (!event) {
          return res.status(404).json({ message: 'Event not found' });
      }

      res.status(200).json(event);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching event: ' + error.message });
  }
});

module.exports = router;
