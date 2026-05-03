const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');

// Submit a rating after delivery
router.post('/', auth, async (req, res) => {
    try {
        const { tripId, score, comment } = req.body;

        const trip = await Trip.findById(tripId).populate('load');
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status !== 'delivered') return res.status(400).json({ message: 'Can only rate delivered trips' });

        // Determine ratee
        let rateeId;
        if (req.user.role === 'truck_owner') {
            // Rate the company (load poster)
            rateeId = trip.load.poster;
        } else {
            // Company rates the carrier
            rateeId = trip.carrier;
        }

        const existing = await Rating.findOne({ trip: tripId, rater: req.user.id });
        if (existing) return res.status(400).json({ message: 'You have already rated this trip' });

        const rating = new Rating({
            trip: tripId,
            rater: req.user.id,
            ratee: rateeId,
            score,
            comment,
            raterRole: req.user.role
        });
        await rating.save();

        // Notify the ratee
        await Notification.create({
            recipient: rateeId,
            type: 'new_rating',
            message: `You received a ${score}★ rating for trip #${tripId.toString().slice(-6)}`,
            link: '/operations-history',
            meta: { tripId, score }
        });

        res.status(201).json(rating);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Already rated this trip' });
        res.status(500).json({ message: err.message });
    }
});

// Get ratings for current user (received)
router.get('/my-ratings', auth, async (req, res) => {
    try {
        const ratings = await Rating.find({ ratee: req.user.id })
            .populate('rater', 'fullName role')
            .populate('trip')
            .sort({ createdAt: -1 });

        const avg = ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
            : null;

        res.json({ ratings, averageScore: avg, totalRatings: ratings.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Check if user already rated a trip
router.get('/check/:tripId', auth, async (req, res) => {
    try {
        const existing = await Rating.findOne({ trip: req.params.tripId, rater: req.user.id });
        res.json({ hasRated: !!existing, rating: existing });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
