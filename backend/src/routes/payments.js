const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { findById, findByField, insertOne, updateById, getCollection } = require('../models/schema');
const { auth } = require('../middleware/auth');
const { RATE_LIMITS } = require('../middleware/security');

router.post('/create-order', auth, RATE_LIMITS.payment, (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid order ID is required' });
    }
    const order = findById('orders', orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, error: 'Payment already completed' });
    }
    const existingPayment = getCollection('payments').find((p) => p.orderId === orderId && p.status === 'processing');
    if (existingPayment) {
      return res.json({ success: true, data: { payment: existingPayment, message: 'Pending payment found' } });
    }
    const payment = {
      id: uuidv4(),
      orderId: order.id,
      amount: order.total,
      method: order.paymentMethod,
      gateway: 'razorpay',
      status: 'processing',
      transactionId: `txn_${uuidv4().slice(0, 12)}`,
      createdAt: new Date().toISOString(),
    };
    insertOne('payments', payment);
    res.status(201).json({ success: true, data: { payment, message: 'Payment order created' } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
});

router.post('/verify', auth, RATE_LIMITS.payment, (req, res) => {
  try {
    const { paymentId, success } = req.body;
    if (!paymentId || typeof paymentId !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid payment ID is required' });
    }
    const payment = findById('payments', paymentId);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    const order = findById('orders', payment.orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    if (payment.status === 'completed' || payment.status === 'failed') {
      return res.status(400).json({ success: false, error: `Payment already ${payment.status}` });
    }
    if (payment.amount !== order.total) {
      return res.status(400).json({ success: false, error: 'Payment amount mismatch' });
    }
    if (success === false) {
      updateById('payments', payment.id, {
        status: 'failed',
        failedAt: new Date().toISOString(),
      });
      return res.json({ success: true, data: { message: 'Payment marked as failed' } });
    }
    updateById('payments', payment.id, {
      status: 'completed',
      verifiedAt: new Date().toISOString(),
    });
    updateById('orders', order.id, {
      paymentStatus: 'completed',
      status: order.status === 'pending' ? 'confirmed' : order.status,
      updatedAt: new Date().toISOString(),
    });
    insertOne('notifications', {
      id: uuidv4(),
      userId: req.user.id,
      type: 'payment',
      title: 'Payment Successful',
      body: `Payment of ₹${order.total} confirmed for order #${order.id.slice(0, 8)}.`,
      read: false,
      data: { orderId: order.id, paymentId: payment.id },
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true, data: { payment, message: 'Payment verified successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
});

router.post('/process', auth, RATE_LIMITS.payment, (req, res) => {
  try {
    const { orderId, method } = req.body;
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid order ID is required' });
    }
    const validMethods = ['upi', 'card', 'netbanking', 'cod', 'wallet'];
    if (method && !validMethods.includes(method)) {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }
    const order = findById('orders', orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    const transactionId = `txn_${uuidv4().slice(0, 12)}`;
    const payment = {
      id: uuidv4(),
      orderId: order.id,
      amount: order.total,
      method: method || order.paymentMethod,
      gateway: 'razorpay',
      status: method === 'cod' ? 'pending' : 'completed',
      transactionId,
      createdAt: new Date().toISOString(),
    };
    insertOne('payments', payment);
    if (method !== 'cod') {
      updateById('orders', order.id, {
        paymentStatus: 'completed',
        status: order.status === 'pending' ? 'confirmed' : order.status,
        updatedAt: new Date().toISOString(),
      });
    }
    insertOne('notifications', {
      id: uuidv4(),
      userId: req.user.id,
      type: 'payment',
      title: 'Payment Received',
      body: `Payment of ₹${order.total} received for order #${order.id.slice(0, 8)}.`,
      read: false,
      data: { orderId: order.id, paymentId: payment.id },
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true, data: { payment, message: 'Payment processed successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process payment' });
  }
});

router.get('/:id/status', auth, (req, res) => {
  try {
    const payment = findById('payments', req.params.id);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get payment status' });
  }
});

module.exports = router;
