const express = require('express');
const router = express.Router();
const Load = require('../models/Load');
const Trip = require('../models/Trip');
const Truck = require('../models/Truck');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');

// Post a new load (Create)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'company') return res.status(403).json({ message: 'Only businesses can post loads' });
        const newLoad = new Load({ ...req.body, poster: req.user.id });
        const load = await newLoad.save();
        res.json(load);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all loads with filtering & pagination
router.get('/', async (req, res) => {
    try {
        const { pickup, drop, minWeight, maxWeight, page = 1, limit = 20 } = req.query;
        let query = { status: 'open' };
        if (pickup) query.pickup = { $regex: pickup, $options: 'i' };
        if (drop) query.drop = { $regex: drop, $options: 'i' };
        if (minWeight || maxWeight) {
            query.weight = {};
            if (minWeight) query.weight.$gte = Number(minWeight);
            if (maxWeight) query.weight.$lte = Number(maxWeight);
        }
        const total = await Load.countDocuments(query);
        const loads = await Load.find(query)
            .populate('poster', 'fullName phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * Number(limit))
            .limit(Number(limit));
        res.json({ loads, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get loads posted by the logged-in business with trip info
router.get('/my-postings', auth, async (req, res) => {
    try {
        if (req.user.role !== 'company') return res.status(403).json({ message: 'Access denied' });
        const loads = await Load.find({ poster: req.user.id }).sort({ createdAt: -1 });
        const enrichedLoads = await Promise.all(loads.map(async (load) => {
            const trip = await Trip.findOne({ load: load._id })
                .populate('carrier', 'fullName phone')
                .populate('truck', 'vehicleNo type capacity');
            return { ...load.toObject(), assignedTrip: trip };
        }));
        res.json(enrichedLoads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single load (full detail)
router.get('/:id', async (req, res) => {
    try {
        const load = await Load.findById(req.params.id).populate('poster', 'fullName phone companyAddress verified');
        if (!load) return res.status(404).json({ message: 'Load not found' });
        res.json(load);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update load
router.put('/:id', auth, async (req, res) => {
    try {
        let load = await Load.findById(req.params.id);
        if (!load) return res.status(404).json({ message: 'Load not found' });
        if (load.poster.toString() !== req.user.id) return res.status(401).json({ message: 'User not authorized' });
        load = await Load.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(load);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Cancel a load (company only) — frees any assigned trip/truck
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        if (req.user.role !== 'company') return res.status(403).json({ message: 'Only companies can cancel loads' });
        const load = await Load.findById(req.params.id);
        if (!load) return res.status(404).json({ message: 'Load not found' });
        if (load.poster.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        if (load.status === 'delivered') return res.status(400).json({ message: 'Cannot cancel a delivered load' });

        // If there's an active trip, cancel it and release the truck
        const existingTrip = await Trip.findOne({ load: load._id, status: { $ne: 'cancelled' } }).populate('truck');
        if (existingTrip) {
            if (existingTrip.truck) {
                existingTrip.truck.status = 'available';
                await existingTrip.truck.save();
            }
            existingTrip.status = 'cancelled';
            await existingTrip.save();

            // Notify truck owner
            await Notification.create({
                recipient: existingTrip.carrier,
                type: 'load_cancelled',
                message: `The load from ${load.pickup} → ${load.drop} was cancelled by the company.`,
                link: '/dashboard',
                meta: { loadId: load._id }
            });
        }

        load.status = 'cancelled';
        await load.save();
        res.json({ message: 'Load cancelled', load });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete load
router.delete('/:id', auth, async (req, res) => {
    try {
        const load = await Load.findById(req.params.id);
        if (!load) return res.status(404).json({ message: 'Load not found' });
        if (load.poster.toString() !== req.user.id) return res.status(401).json({ message: 'User not authorized' });
        await Load.findByIdAndDelete(req.params.id);
        res.json({ message: 'Load removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
