const express = require('express');
const router = express.Router();
const { getCollection, findById, updateById } = require('../models/schema');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    const notifications = getCollection('notifications')
      .filter((n) => n.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/read', auth, (req, res) => {
  try {
    const notification = findById('notifications', req.params.id);
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    if (notification.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    updateById('notifications', req.params.id, { read: true });
    res.json({ success: true, data: { message: 'Notification marked as read' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
