const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Load = require('../models/Load');
const Truck = require('../models/Truck');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');

// Accept a Load (Create Trip)
router.post('/accept', auth, async (req, res) => {
    try {
        if (req.user.role !== 'truck_owner') return res.status(403).json({ message: 'Only truck owners can accept loads' });

        const { loadId, truckId } = req.body;

        const load = await Load.findById(loadId);
        if (!load || load.status !== 'open') return res.status(400).json({ message: 'Load is no longer available' });

        const truck = await Truck.findById(truckId);
        if (!truck || truck.status !== 'available') return res.status(400).json({ message: 'Truck is not available' });

        const trip = new Trip({ load: loadId, carrier: req.user.id, truck: truckId });

        load.status = 'assigned';
        truck.status = 'on-trip';

        await load.save();
        await truck.save();
        await trip.save();

        // Notify the company (load poster)
        await Notification.create({
            recipient: load.poster,
            type: 'load_accepted',
            message: `Your load from ${load.pickup} → ${load.drop} has been accepted by a verified carrier.`,
            link: '/dashboard',
            meta: { tripId: trip._id, loadId }
        });

        res.json(trip);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user's trips (Carrier or Business) with pagination
router.get('/my-history', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        let query = {};

        if (req.user.role === 'truck_owner') {
            query.carrier = req.user.id;
        } else {
            const myLoads = await Load.find({ poster: req.user.id }).select('_id');
            query.load = { $in: myLoads };
        }
        if (status) query.status = status;

        const total = await Trip.countDocuments(query);
        const trips = await Trip.find(query)
            .populate('load')
            .populate('truck')
            .populate('carrier', 'fullName phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * Number(limit))
            .limit(Number(limit));

        res.json({ trips, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update trip status (In-transit, Delivered)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status, milestone } = req.body;
        const trip = await Trip.findById(req.params.id).populate('load').populate('truck');

        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.carrier.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

        trip.status = status;
        if (milestone) trip.milestones.push(milestone);

        if (status === 'delivered') {
            trip.load.status = 'delivered';
            trip.truck.status = 'available';
            await trip.load.save();
            await trip.truck.save();

            // Notify company of delivery
            await Notification.create({
                recipient: trip.load.poster,
                type: 'trip_delivered',
                message: `Your shipment ${trip.load.pickup} → ${trip.load.drop} has been delivered!`,
                link: '/operations-history',
                meta: { tripId: trip._id }
            });
        } else if (status === 'in-transit') {
            trip.load.status = 'in-transit';
            await trip.load.save();
        }

        await trip.save();
        res.json(trip);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Cancel a trip (truck owner)
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id).populate('load').populate('truck');
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.carrier.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });
        if (trip.status === 'in-transit') return res.status(400).json({ message: 'Cannot cancel an in-transit trip' });

        trip.status = 'cancelled';
        trip.load.status = 'open'; // re-open the load
        trip.truck.status = 'available'; // free the truck

        await trip.load.save();
        await trip.truck.save();
        await trip.save();

        // Notify company
        await Notification.create({
            recipient: trip.load.poster,
            type: 'trip_cancelled',
            message: `The carrier cancelled the trip for ${trip.load.pickup} → ${trip.load.drop}. Load is now available again.`,
            link: '/dashboard',
            meta: { tripId: trip._id }
        });

        res.json({ message: 'Trip cancelled', trip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update payment tracking
router.put('/:id/payment', auth, async (req, res) => {
    try {
        const { advance, balance } = req.body;
        const trip = await Trip.findById(req.params.id).populate('load');
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        
        // Only company that posted the load can update payments
        if (trip.load.poster.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update payments' });
        }

        trip.pricing = {
            total: trip.load.price,
            advance: Number(advance) || 0,
            balance: Number(balance) || 0
        };

        await trip.save();
        res.json({ message: 'Payment updated', trip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
