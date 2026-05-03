const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ratee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
    raterRole: { type: String, enum: ['truck_owner', 'company'] }
}, { timestamps: true });

// Prevent double rating for same trip by same person
RatingSchema.index({ trip: 1, rater: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
