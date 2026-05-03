const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Signup (with optional document upload)
router.post('/signup', upload.fields([
    { name: 'selfie', maxCount: 1 },
    { name: 'mParivahan', maxCount: 1 },
    { name: 'ownerCert', maxCount: 1 }
]), async (req, res) => {
    try {
        const { phone, password, role, fullName, vehicleNo, rcNo, companyAddress } = req.body;

        let user = await User.findOne({ phone });
        if (user) return res.status(400).json({ message: 'An account with this phone number already exists' });

        // Collect uploaded document paths
        const documents = {};
        if (req.files?.selfie) documents.selfie = req.files.selfie[0].path || `/uploads/${req.files.selfie[0].filename}`;
        if (req.files?.mParivahan) documents.mParivahan = req.files.mParivahan[0].path || `/uploads/${req.files.mParivahan[0].filename}`;
        if (req.files?.ownerCert) documents.ownerCert = req.files.ownerCert[0].path || `/uploads/${req.files.ownerCert[0].filename}`;

        user = new User({ phone, password, role, fullName, vehicleNo, rcNo, companyAddress, documents });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: { _id: user._id, phone: user.phone, role: user.role, fullName: user.fullName, verified: user.verified }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { phone, password, role } = req.body;
        const user = await User.findOne({ phone });
        if (!user) return res.status(400).json({ message: 'No account found with this phone number' });
        if (user.role !== role) return res.status(400).json({ message: `This account is registered as a "${user.role === 'truck_owner' ? 'Truck Owner' : 'Business'}". Please select the correct role.` });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect password. Please try again.' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { _id: user._id, phone: user.phone, role: user.role, fullName: user.fullName, verified: user.verified }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
