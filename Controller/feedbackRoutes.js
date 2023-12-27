const express = require('express');
const router = express.Router();
const authenticateUser = require("../Authentication/Authentication");
const Vendor = require('../Models/vendor');  // Import the Vendor model
const Feedback = require('../Models/feedback');

// View feedback for a specific vendor
router.get('/', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        // Find the vendor by email to get the vendor's ID
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const feedbacks = await Feedback.find({ vendorId: vendor._id })
            .populate({
                path: 'eventId',
                select: 'eventName' // Select only the eventName from the Event model
            })
            .select('eventId rating comment response date _id'); // Exclude the _id field

        // Filter out null attributes
        const filteredFeedbacks = feedbacks.map(fb => {
            const feedbackData = {};
            feedbackData.feedbackId = fb._id;
            if (fb.eventId && fb.eventId.eventName) feedbackData.eventName = fb.eventId.eventName;
            if (fb.rating) feedbackData.rating = fb.rating;
            if (fb.comment) feedbackData.comment = fb.comment;
            if (fb.response) feedbackData.response = fb.response;
            if (fb.date) feedbackData.date = fb.date;
            return feedbackData;
        });

        res.status(200).json(filteredFeedbacks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback: ' + error.message });
    }
});

// Respond to a specific piece of feedback
router.post('/respond/:feedbackId', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        const feedbackId = req.params.feedbackId;
        const { text } = req.body.response; // Assuming 'text' contains the vendor's response text

        // Find the vendor by email to get the vendor's ID
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        if (!vendor.isActive) return res.status(403).json({ message: 'Vendor is not activated' });

        const feedback = await Feedback.findOne({ _id: feedbackId, vendorId: vendor._id });

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found or access denied' });
        }

        feedback.response = { text, dateResponded: new Date() };
        await feedback.save();

        res.status(200).json({ message: 'Feedback responded to successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error responding to feedback: ' + error.message });
    }
});

//View a specific feedback
router.get('/:feedbackId', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        const feedbackId = req.params.feedbackId;

        // Find the vendor by email to get the vendor's ID
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Fetch the specific feedback
        const feedback = await Feedback.findOne({ _id: feedbackId, vendorId: vendor._id })
            .populate({
                path: 'eventId',
                select: 'eventName' // Select only the eventName from the Event model
            })
            .select('eventId rating comment response date -_id'); // Exclude the _id field

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Format the feedback to exclude any null attributes
        const feedbackData = {
            eventName: feedback.eventId && feedback.eventId.eventName ? feedback.eventId.eventName : undefined,
            rating: feedback.rating,
            comment: feedback.comment,
            response: feedback.response,
            date: feedback.date
        };

        res.status(200).json(feedbackData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback: ' + error.message });
    }
});


module.exports = router;
