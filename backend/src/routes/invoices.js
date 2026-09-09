const express = require('express');
const router = express.Router();
const { getCollection, findById, findByField } = require('../models/schema');
const { adminAuth } = require('../middleware/adminAuth');
const { auth } = require('../middleware/auth');

function generateInvoice(order) {
  const user = findById('users', order.userId);
  const year = new Date(order.createdAt).getFullYear();
  const orderIndex = getCollection('orders').findIndex((o) => o.id === order.id);
  const invoiceNumber = `INV-${year}-${String(orderIndex + 1).padStart(4, '0')}`;

  const store = {
    name: 'LUXE Electronics',
    address: '123, Tech Park, Andheri East, Mumbai, Maharashtra 400069',
    phone: '+919876543200',
    email: 'support@luxe.in',
  };

  const customer = {
    name: user?.name || 'Unknown',
    email: user?.email || 'Unknown',
    phone: user?.phone || 'N/A',
  };

  const items = order.items.map((item) => {
    const product = findByField('products', 'id', item.productId);
    const itemTotal = item.price * item.quantity;
    const itemDiscount = order.discount && order.items.length
      ? Math.round((itemTotal / order.subtotal) * order.discount)
      : 0;
    const itemTax = Math.round((itemTotal - itemDiscount) * 0.15);
    return {
      name: item.name,
      sku: product?.sku || 'N/A',
      quantity: item.quantity,
      unitPrice: item.price,
      discount: itemDiscount,
      tax: itemTax,
      total: itemTotal - itemDiscount + itemTax,
    };
  });

  return {
    invoiceNumber,
    invoiceDate: order.createdAt,
    store,
    customer,
    order: { id: order.id, date: order.createdAt },
    items,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
  };
}

router.get('/orders/:id/invoice', adminAuth, (req, res) => {
  try {
    const order = findById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    const invoice = generateInvoice(order);
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/invoice', auth, (req, res) => {
  try {
    const order = findById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    const invoice = generateInvoice(order);
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
