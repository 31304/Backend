const express = require('express');
const router = express.Router();
const authenticateUser = require("../Authentication/Authentication");// Adjust the path as necessary
const Booking = require('../Models/booking');
const Event = require('../Models/event');  // Assuming you have an Event model
const Vendor = require('../Models/vendor');  // Import the Vendor model
const Service = require('../Models/service');  // Assuming you have an Event model

router.get('/', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });
    try {
        // Find the vendor by email to get the vendor's ID
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Fetch all bookings associated with the vendor
        const bookings = await Booking.find({ vendorId: vendor._id })
            .populate({
                path: 'eventId',
                select: 'eventName dateTime' // Include event date along with event name
            });

        // Format each booking to only include required fields and exclude null attributes
        const formattedBookings = bookings.map(booking => {
            return {
                bookingId: booking._id,
                eventName: booking.eventId ? booking.eventId.eventName : undefined,
                eventDate: booking.eventId ? booking.eventId.dateTime : undefined,
                serviceName: booking.serviceName, // Directly use serviceName
                bookingDate: booking.bookingDate,
                status: booking.status
            };
        });

        res.status(200).json(formattedBookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings: ' + error.message });
    }
});

//Route to view a specific booking
router.get('/:bookingId', authenticateUser, async (req, res) => {
  if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

  const bookingId = req.params.bookingId;
  try {
      // Find the vendor by email to get the vendor's ID
      const vendor = await Vendor.findOne({ email: req.email });
      if (!vendor) {
          return res.status(404).json({ message: 'Vendor not found' });
      }

      // Fetch the specific booking associated with the vendor
      const booking = await Booking.findOne({ _id: bookingId, vendorId: vendor._id })
          .populate({ path: 'eventId', select: 'eventName' }) // Assuming eventName is a field in the Event model
          .populate({ path: 'serviceId', select: 'serviceName' }); // Assuming serviceName is a field in the Service model

      if (!booking) {
          return res.status(404).json({ message: 'Booking not found or access denied' });
      }

      // Format the booking to only include required fields and exclude null attributes
      const formattedBooking = {
          eventName: booking.eventId && booking.eventId.eventName ? booking.eventId.eventName : undefined,
          serviceName: booking.serviceId && booking.serviceId.serviceName ? booking.serviceId.serviceName : undefined,
          bookingDate: booking.bookingDate,
          status: booking.status
      };

      res.status(200).json(formattedBooking);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching booking: ' + error.message });
  }
});


// Route to accept a booking
router.patch('/accept/:bookingId', authenticateUser, async (req, res) => {
  if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

  const bookingId = req.params.bookingId;
  try {
      // Find the vendor by email to get the vendor's ID
      const vendor = await Vendor.findOne({ email: req.email });
      if (!vendor) {
          return res.status(404).json({ message: 'Vendor not found' });
      }
      if (!vendor.isActive) return res.status(403).json({ message: 'Vendor is not activated' });

      const booking = await Booking.findOne({ _id: bookingId, vendorId: vendor._id });
      if (!booking) {
          return res.status(404).json({ message: 'Booking not found or access denied' });
      }

      booking.status = 'confirmed';
      await booking.save();

      res.status(200).json({ message: 'Booking accepted' });
  } catch (error) {
      res.status(500).json({ message: 'Error updating booking: ' + error.message });
  }
});


// Route to reject a booking
router.patch('/reject/:bookingId', authenticateUser, async (req, res) => {
  if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

  const bookingId = req.params.bookingId;
  try {
      // Find the vendor by email to get the vendor's ID
      const vendor = await Vendor.findOne({ email: req.email });
      if (!vendor) {
          return res.status(404).json({ message: 'Vendor not found' });
      }
      if (!vendor.isActive) return res.status(403).json({ message: 'Vendor is not activated' });

      const booking = await Booking.findOne({ _id: bookingId, vendorId: vendor._id });
      if (!booking) {
          return res.status(404).json({ message: 'Booking not found or access denied' });
      }

      booking.status = 'cancelled';
      await booking.save();

      res.status(200).json({ message: 'Booking rejected' });
  } catch (error) {
      res.status(500).json({ message: 'Error updating booking: ' + error.message });
  }
});

module.exports = router;
