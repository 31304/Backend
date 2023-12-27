const express = require('express');
const router = express.Router();
const authenticateUser = require("../Authentication/Authentication");
const Service = require('../Models/service');
const Vendor = require('../Models/vendor'); 

router.post('/add', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        // Find the vendor by email to get the vendor's ID
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        if (!vendor.isActive) return res.status(403).json({ message: 'Vendor is not activated' });

        const { serviceName, description, price, availability, category } = req.body;
        
        const newService = new Service({
            vendorId: vendor._id,
            serviceName,
            description,
            price,
            availability,
            category
        });

        await newService.save();
        res.status(201).json({ message: 'Service added successfully', serviceId: newService._id });
    } catch (error) {
        res.status(500).json({ message: 'Error adding service: ' + error.message });
    }
});

router.put('/update/:serviceId', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    const serviceId = req.params.serviceId;
    try {
        // Find the service by serviceId
        const service = await Service.findById(serviceId).populate('vendorId');

        if (!service || !service.vendorId) {
            return res.status(404).json({ message: 'Service not found' });
        }
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor.isActive) return res.status(403).json({ message: 'Vendor is not activated' });

        // Check if the vendor's email matches the service's vendor email
        if (service.vendorId.email !== req.email) {
            return res.status(403).json({ message: 'Access Denied' });
        }

        // Extract updatable fields from req.body
        const { serviceName, description, price, availability, category } = req.body;
        const updateData = {};
        if (serviceName) updateData.serviceName = serviceName;
        if (description) updateData.description = description;
        if (price) updateData.price = price;
        if (availability) updateData.availability = availability;
        if (category) updateData.category = category;

        // Update the service
        await Service.updateOne({ _id: serviceId }, { $set: updateData });
        res.status(200).json({ message: 'Service updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating service: ' + error.message });
    }
});

router.delete('/delete/:serviceId', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    const serviceId = req.params.serviceId;
    try {
        const service = await Service.findById(serviceId).populate('vendorId');
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        if (!service.vendorId) {
            return res.status(404).json({ message: 'Vendor not found for this service' });
        }
        if (!service.vendorId.isActive) {
            return res.status(403).json({ message: 'Vendor is not activated' });
        }
        if (service.vendorId.email !== req.email) {
            return res.status(403).json({ message: 'Access Denied' });
        }
        await Service.deleteOne({ _id: serviceId });
        res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);  // Log the error for debugging
        res.status(500).json({ message: 'Error deleting service: ' + error.message });
    }
});


router.get('/', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        // Find the vendor by email to get the vendor's ID
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Fetch all services offered by the vendor
        const services = await Service.find({ vendorId: vendor._id })
            .select('serviceName description price availability category _id');  // Adjust fields as needed

        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching services: ' + error.message });
    }
});

router.get('/:serviceId', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    const serviceId = req.params.serviceId;
    try {
        // Find the vendor by email to get the vendor's ID
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Find the service by serviceId and ensure it belongs to the authenticated vendor
        const service = await Service.findOne({ _id: serviceId, vendorId: vendor._id })
            .select('serviceName description price availability category -_id');  // Adjust fields as needed

        if (!service) {
            return res.status(404).json({ message: 'Service not found or access denied' });
        }

        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching service: ' + error.message });
    }
});

module.exports = router;
