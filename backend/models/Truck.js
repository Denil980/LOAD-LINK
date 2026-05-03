const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleNo: { type: String, required: true, unique: true },
    type: { type: String, required: true }, // e.g., Container, Flatbed, LCV
    capacity: { type: Number, required: true }, // In Tons
    rcNo: { type: String, required: true },
    status: { type: String, enum: ['available', 'on-trip', 'maintenance'], default: 'available' },
    currentLocation: {
        city: String,
        state: String,
        coordinates: { lat: Number, lng: Number }
    },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Truck', TruckSchema);
