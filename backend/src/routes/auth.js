const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { findByField, filterByField, insertOne, findById, getCollection } = require('../models/schema');
const { auth } = require('../middleware/auth');
const { RATE_LIMITS } = require('../middleware/security');

router.post('/register', RATE_LIMITS.register, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim().isMobilePhone('en-IN').withMessage('Invalid phone number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { email, name, password, phone } = req.body;
    const existing = findByField('users', 'email', email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    const hashedPassword = await bcryptjs.hash(password, 12);
    const user = {
      id: uuidv4(),
      email: email.toLowerCase(),
      name: name.trim(),
      phone: (phone || '').trim(),
      password: hashedPassword,
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      createdAt: new Date().toISOString(),
      loyaltyPoints: 0,
      tier: 'Bronze',
    };
    insertOne('users', user);
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ success: true, data: { user: userWithoutPassword, token } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

router.post('/login', RATE_LIMITS.login, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { email, password } = req.body;
    const user = findByField('users', 'email', email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: { user: userWithoutPassword, token } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { email } = req.body;
    const user = findByField('users', 'email', email.toLowerCase());
    if (!user) {
      return res.json({ success: true, data: { message: 'If an account exists with that email, a reset link has been sent.' } });
    }
    const resetToken = jwt.sign({ id: user.id, purpose: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    insertOne('passwordResets', {
      id: uuidv4(),
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      used: false,
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true, data: { message: 'If an account exists with that email, a reset link has been sent.' } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
});

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const resetRecord = findByField('passwordResets', 'token', token);
    if (!resetRecord || resetRecord.used) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }
    const hashedPassword = await bcryptjs.hash(password, 12);
    const user = findById('users', decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const userIndex = getCollection('users').findIndex((u) => u.id === decoded.id);
    if (userIndex !== -1) {
      getCollection('users')[userIndex].password = hashedPassword;
    }
    const resetIndex = getCollection('passwordResets').findIndex((r) => r.id === resetRecord.id);
    if (resetIndex !== -1) {
      getCollection('passwordResets')[resetIndex].used = true;
    }
    res.json({ success: true, data: { message: 'Password reset successful. You can now login.' } });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

router.get('/me', auth, (req, res) => {
  try {
    const user = findByField('users', 'id', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

router.get('/profile', auth, (req, res) => {
  try {
    const user = findByField('users', 'id', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = user;
    const orders = getCollection('orders').filter((o) => o.userId === req.user.id);
    const addresses = getCollection('addresses').filter((a) => a.userId === req.user.id);
    const wishlist = findByField('wishlist', 'userId', req.user.id);
    const notifications = getCollection('notifications').filter((n) => n.userId === req.user.id);
    const unreadNotifications = notifications.filter((n) => !n.read).length;
    res.json({
      success: true,
      data: {
        ...userWithoutPassword,
        orderCount: orders.length,
        addressCount: addresses.length,
        wishlistItemCount: wishlist ? wishlist.items.length : 0,
        unreadNotifications,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

module.exports = router;
