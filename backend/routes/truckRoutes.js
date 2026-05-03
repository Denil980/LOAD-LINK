const express = require('express');
const router = express.Router();
const Truck = require('../models/Truck');
const auth = require('../middleware/authMiddleware');

// Add a truck
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'truck_owner') return res.status(403).json({ message: 'Only truck owners can add vehicles' });
        
        const newTruck = new Truck({
            ...req.body,
            owner: req.user.id
        });
        const truck = await newTruck.save();
        res.json(truck);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get owner's trucks
router.get('/my-fleet', auth, async (req, res) => {
    try {
        const trucks = await Truck.find({ owner: req.user.id });
        res.json(trucks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update truck GPS location
router.put('/:id/location', auth, async (req, res) => {
    try {
        const { lat, lng, city, state } = req.body;
        const truck = await Truck.findById(req.params.id);
        if (!truck) return res.status(404).json({ message: 'Truck not found' });
        if (truck.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        truck.currentLocation = { city, state, coordinates: { lat, lng } };
        await truck.save();
        res.json({ message: 'Location updated', currentLocation: truck.currentLocation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a truck
router.delete('/:id', auth, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);
        if (!truck) return res.status(404).json({ message: 'Truck not found' });
        if (truck.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        await Truck.findByIdAndDelete(req.params.id);
        res.json({ message: 'Vehicle removed from fleet' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
