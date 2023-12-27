const express = require('express');
const router = express.Router();
const authenticateUser = require("../Authentication/Authentication");// Adjust the path as necessary
const Vendor = require('../Models/vendor');
const User = require('../Models/user');  // Import the User model

// Update vendor profile
router.put('/update', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        const { name, email, phone, address, description } = req.body;

        // Construct the update object for Vendor
        const vendorUpdateData = {};
        if (name) vendorUpdateData.name = name;
        if (email) vendorUpdateData.email = email;
        if (phone) vendorUpdateData.phone = phone;
        if (address) vendorUpdateData.address = address;
        if (description) vendorUpdateData.description = description;

        // Construct the update object for User
        const userUpdateData = {};
        if (name) userUpdateData.name = name;
        if (email) userUpdateData.email = email;

        // Update the User document
        await User.findOneAndUpdate({ email: req.email }, userUpdateData, { new: true });

        // Update the Vendor profile
        await Vendor.findOneAndUpdate({ email: req.email }, vendorUpdateData, { new: true });

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile: ' + error.message });
    }
});

// View vendor profile
router.get('/profile', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        // Find the vendor by email obtained from the JWT token
        const vendor = await Vendor.findOne({ email: req.email }).select('name email phone address description');

        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
        res.status(200).json(vendor);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vendor profile: ' + error.message });
    }
});

router.delete('/delete', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        // Use the email from the JWT token to delete the vendor profile
        const vendorDeletionResult = await Vendor.findOneAndDelete({ email: req.email });

        // If a vendor profile is found and deleted, then delete the corresponding user
        if (vendorDeletionResult) {
            await User.findOneAndDelete({ email: req.email });
            res.status(200).json({ message: 'Vendor and User profiles deleted successfully' });
        } else {
            res.status(404).json({ message: 'Vendor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting profiles: ' + error.message });
    }
});

router.patch('/deactivate', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        // Find the vendor by email to get the vendor's ID
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Check if the vendor is already inactive
        if (!vendor.isActive) {
            return res.status(400).json({ message: 'Vendor profile is already deactivated' });
        }

        // Deactivate the vendor profile
        vendor.isActive = false;
        await vendor.save();

        // Optional: Update the corresponding user status if needed
        // await User.findOneAndUpdate({ email: req.email }, { isActive: false });

        res.status(200).json({ message: 'Vendor profile deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deactivating vendor profile: ' + error.message });
    }
});

router.patch('/activate', authenticateUser, async (req, res) => {
    if (req.role !== 'vendor') return res.status(403).json({ message: 'Access Denied' });

    try {
        // Find the vendor by email to get the vendor's ID
        const vendor = await Vendor.findOne({ email: req.email });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Check if the vendor is already active
        if (vendor.isActive) {
            return res.status(400).json({ message: 'Vendor profile is already active' });
        }

        // Activate the vendor profile
        vendor.isActive = true;
        await vendor.save();

        // Optional: Update the corresponding user status if needed
        // await User.findOneAndUpdate({ email: req.email }, { isActive: true });

        res.status(200).json({ message: 'Vendor profile activated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error activating vendor profile: ' + error.message });
    }
});

module.exports = router;
