const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Load = require('../models/Load');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');

// Admin-only middleware
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
};

// GET platform overview stats
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        const [totalUsers, totalLoads, totalTrips, pendingVerifications] = await Promise.all([
            User.countDocuments(),
            Load.countDocuments(),
            Trip.countDocuments(),
            User.countDocuments({ verified: false })
        ]);
        res.json({ totalUsers, totalLoads, totalTrips, pendingVerifications });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all users
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const { role, verified, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (verified !== undefined) filter.verified = verified === 'true';

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await User.countDocuments(filter);
        res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// APPROVE a user (set verified = true)
router.put('/users/:id/approve', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { verified: true }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        await Notification.create({
            recipient: user._id,
            type: 'load_accepted', // reusing type for system alert
            message: 'Your account has been verified by the LoadLink team. You now have full access.',
            link: '/dashboard'
        });

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REJECT / suspend a user
router.put('/users/:id/reject', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { verified: false }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all loads (admin view)
router.get('/loads', auth, isAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = status ? { status } : {};
        const loads = await Load.find(filter)
            .populate('poster', 'fullName phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Load.countDocuments(filter);
        res.json({ loads, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all trips (admin view)
router.get('/trips', auth, isAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = status ? { status } : {};
        const trips = await Trip.find(filter)
            .populate('load')
            .populate('carrier', 'fullName phone')
            .populate('truck', 'vehicleNo type')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Trip.countDocuments(filter);
        res.json({ trips, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
