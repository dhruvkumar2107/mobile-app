const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, findById, findByField, insertOne, updateById, paginate } = require('../models/schema');
const { auth } = require('../middleware/auth');
const { RATE_LIMITS } = require('../middleware/security');

const VALID_ORDER_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'shipped', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'delivered'],
};

function isValidTransition(from, to) {
  return VALID_ORDER_STATUSES[from] && VALID_ORDER_STATUSES[from].includes(to);
}

router.post('/create', auth, RATE_LIMITS.orderCreate, (req, res) => {
  try {
    const { shippingAddressId, billingAddressId, paymentMethod, couponCode } = req.body;
    if (!shippingAddressId) {
      return res.status(400).json({ success: false, error: 'Shipping address is required' });
    }
    const cart = findByField('cart', 'userId', req.user.id);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }
    const shippingAddress = findById('addresses', shippingAddressId);
    if (!shippingAddress) return res.status(400).json({ success: false, error: 'Shipping address not found' });
    if (shippingAddress.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });

    let subtotal = 0;
    let stockErrors = [];
    const orderItems = [];
    const stockDeductions = [];

    for (const item of cart.items) {
      const product = findByField('products', 'id', item.productId);
      if (!product) { stockErrors.push(`Product ${item.productId} not found`); continue; }
      if (!product.isActive) { stockErrors.push(`${product.name} is no longer available`); continue; }
      if (product.stock < item.quantity) { stockErrors.push(`${product.name} has only ${product.stock} in stock`); continue; }
      subtotal += product.price * item.quantity;
      orderItems.push({ productId: product.id, name: product.name, quantity: item.quantity, price: product.price, image: product.images[0] || '' });
      stockDeductions.push({ productId: product.id, quantity: item.quantity });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid items in cart', details: stockErrors });
    }

    for (const deduction of stockDeductions) {
      const product = findByField('products', 'id', deduction.productId);
      if (!product || product.stock < deduction.quantity) {
        return res.status(400).json({ success: false, error: `Insufficient stock for ${product?.name || 'a product'}` });
      }
    }

    let discount = 0;
    if (couponCode) {
      const coupon = findByField('coupons', 'code', couponCode.toUpperCase());
      if (coupon && coupon.isActive) {
        const now = new Date();
        const endDate = new Date(coupon.endDate);
        if (endDate >= now && coupon.usedCount < coupon.usageLimit && subtotal >= coupon.minOrder) {
          if (coupon.type === 'percentage') {
            discount = Math.min(Math.round(subtotal * coupon.value / 100), coupon.maxDiscount || Infinity);
          } else {
            discount = Math.min(coupon.value, subtotal);
          }
          updateById('coupons', coupon.id, { usedCount: coupon.usedCount + 1 });
        }
      }
    }

    const tax = Math.round((subtotal - discount) * 0.15);
    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal - discount + tax + shipping;

    for (const deduction of stockDeductions) {
      const productIndex = getCollection('products').findIndex((p) => p.id === deduction.productId);
      if (productIndex !== -1) {
        getCollection('products')[productIndex].stock -= deduction.quantity;
      }
      const inv = findByField('inventory', 'productId', deduction.productId);
      if (inv) {
        const invIndex = getCollection('inventory').findIndex((i) => i.id === inv.id);
        if (invIndex !== -1) getCollection('inventory')[invIndex].stock -= deduction.quantity;
      }
    }

    const order = {
      id: uuidv4(),
      userId: req.user.id,
      items: orderItems,
      shippingAddress: { line1: shippingAddress.line1, line2: shippingAddress.line2, city: shippingAddress.city, state: shippingAddress.state, pincode: shippingAddress.pincode },
      billingAddress: billingAddressId ? findById('addresses', billingAddressId) || shippingAddress : shippingAddress,
      subtotal, discount, shipping, tax, total,
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      paymentMethod: paymentMethod || 'upi',
      trackingNumber: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    insertOne('orders', order);
    cart.items = [];
    updateById('cart', req.user.id, { items: [] });
    insertOne('payments', {
      id: uuidv4(),
      orderId: order.id,
      amount: total,
      method: paymentMethod || 'upi',
      gateway: 'razorpay',
      status: paymentMethod === 'cod' ? 'pending' : 'processing',
      transactionId: null,
      createdAt: new Date().toISOString(),
    });
    insertOne('notifications', {
      id: uuidv4(),
      userId: req.user.id,
      type: 'order',
      title: 'Order Confirmed',
      body: `Your order #${order.id.slice(0, 8)} has been confirmed.`,
      read: false,
      data: { orderId: order.id },
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

router.get('/', auth, (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    let orders = getCollection('orders').filter((o) => o.userId === req.user.id);
    if (status) orders = orders.filter((o) => o.status === status);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = paginate(orders, pageNum, limitNum);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const order = findById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get order' });
  }
});

router.get('/:id/track', auth, (req, res) => {
  try {
    const order = findById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    const allStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const statusHistory = [
      { status: 'pending', date: order.createdAt, location: 'Order Placed' },
    ];
    const currentIdx = allStatuses.indexOf(order.status);
    for (let i = 1; i <= currentIdx && i < allStatuses.length; i++) {
      const locations = {
        confirmed: 'LUXE Warehouse, Mumbai',
        processing: 'LUXE Warehouse, Mumbai',
        packed: 'LUXE Warehouse, Mumbai',
        shipped: 'In Transit',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
      };
      statusHistory.push({ status: allStatuses[i], date: order.updatedAt, location: locations[allStatuses[i]] || 'Unknown' });
    }
    res.json({ success: true, data: { order, tracking: statusHistory, validNextTransitions: VALID_ORDER_STATUSES[order.status] || [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to track order' });
  }
});

router.post('/:id/cancel', auth, (req, res) => {
  try {
    const order = findById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    if (!isValidTransition(order.status, 'cancelled')) {
      return res.status(400).json({ success: false, error: 'Order cannot be cancelled at this stage' });
    }
    updateById('orders', order.id, { status: 'cancelled', updatedAt: new Date().toISOString() });
    order.items.forEach((item) => {
      const productIndex = getCollection('products').findIndex((p) => p.id === item.productId);
      if (productIndex !== -1) getCollection('products')[productIndex].stock += item.quantity;
      const inv = findByField('inventory', 'productId', item.productId);
      if (inv) {
        const invIndex = getCollection('inventory').findIndex((i) => i.id === inv.id);
        if (invIndex !== -1) getCollection('inventory')[invIndex].stock += item.quantity;
      }
    });
    insertOne('notifications', {
      id: uuidv4(),
      userId: req.user.id,
      type: 'order',
      title: 'Order Cancelled',
      body: `Your order #${order.id.slice(0, 8)} has been cancelled.`,
      read: false,
      data: { orderId: order.id },
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true, data: { message: 'Order cancelled successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
});

router.post('/:id/return', auth, (req, res) => {
  try {
    const order = findById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    if (!isValidTransition(order.status, 'return_requested')) {
      return res.status(400).json({ success: false, error: 'Order is not eligible for return' });
    }
    const { reason, items: returnItems } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Return reason is required (minimum 5 characters)' });
    }
    const returnRecord = {
      id: uuidv4(),
      orderId: order.id,
      userId: req.user.id,
      reason: reason.trim(),
      items: returnItems || order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const returns = getCollection('returns');
    returns.push(returnRecord);
    updateById('orders', order.id, { status: 'return_requested', updatedAt: new Date().toISOString() });
    insertOne('notifications', {
      id: uuidv4(),
      userId: req.user.id,
      type: 'order',
      title: 'Return Requested',
      body: `Your return request for order #${order.id.slice(0, 8)} has been submitted.`,
      read: false,
      data: { orderId: order.id, returnId: returnRecord.id },
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ success: true, data: returnRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process return' });
  }
});

router.get('/:id/returns', auth, (req, res) => {
  try {
    const order = findById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    const returns = (getCollection('returns') || []).filter((r) => r.orderId === order.id);
    res.json({ success: true, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get returns' });
  }
});

module.exports = router;
