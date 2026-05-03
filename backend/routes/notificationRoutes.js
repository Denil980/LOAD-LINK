const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');

// GET all notifications for current user
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark one as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
