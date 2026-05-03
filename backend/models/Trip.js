const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    load: { type: mongoose.Schema.Types.ObjectId, ref: 'Load', required: true },
    carrier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    truck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', required: true },
    status: { type: String, enum: ['scheduled', 'in-transit', 'delivered', 'cancelled'], default: 'scheduled' },
    pickupDate: { type: Date },
    deliveryDate: { type: Date },
    pricing: {
        total: Number,
        advance: Number,
        balance: Number
    },
    milestones: [{
        location: String,
        timestamp: { type: Date, default: Date.now },
        description: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);
