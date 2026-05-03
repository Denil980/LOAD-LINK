const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['truck_owner', 'company', 'admin'], required: true },
    fullName: { type: String, required: true },
    vehicleNo: { type: String },
    rcNo: { type: String },
    companyAddress: { type: String },
    verified: { type: Boolean, default: false },
    documents: {
        selfie: String,
        mParivahan: String,
        ownerCert: String
    },
    joinedDate: { type: String, default: () => new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }
}, { timestamps: true });


// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', UserSchema);
