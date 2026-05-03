const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['load_accepted', 'trip_delivered', 'load_cancelled', 'trip_cancelled', 'new_rating'], required: true },
    message: { type: String, required: true },
    link: { type: String }, // e.g. '/dashboard'
    isRead: { type: Boolean, default: false },
    meta: { type: Object } // extra data (tripId, loadId, etc.)
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
