const express = require('express');
const router = express.Router();
const { getCollection, findById, updateById } = require('../models/schema');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    const notifications = getCollection('notifications')
      .filter((n) => n.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = notifications.filter((n) => !n.read).length;
    const start = (pageNum - 1) * limitNum;
    const paginatedNotifications = notifications.slice(start, start + limitNum);

    res.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        unreadCount,
        pagination: {
          total: notifications.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(notifications.length / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
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
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

router.put('/read-all', auth, (req, res) => {
  try {
    const notifications = getCollection('notifications').filter((n) => n.userId === req.user.id && !n.read);
    notifications.forEach((n) => updateById('notifications', n.id, { read: true }));
    res.json({ success: true, data: { message: 'All notifications marked as read', count: notifications.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
});

module.exports = router;
