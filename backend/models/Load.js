const mongoose = require('mongoose');

const LoadSchema = new mongoose.Schema({
    poster: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickup: { type: String, required: true },
    drop: { type: String, required: true },
    material: { type: String, required: true },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },
    type: { type: String, default: 'Full Truck' }, // e.g., Full Truck, LCV, etc.
    status: { type: String, enum: ['open', 'assigned', 'in-transit', 'delivered'], default: 'open' },
    urgency: { type: String, enum: ['Normal', 'Hot'], default: 'Normal' },
    distance: { type: String }, // Optional estimation
    materialType: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Load', LoadSchema);
