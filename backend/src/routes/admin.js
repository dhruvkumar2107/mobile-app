const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcryptjs = require('bcryptjs');
const { getCollection, findById, findByField, insertOne, updateById, deleteById, paginate } = require('../models/schema');
const { adminAuth } = require('../middleware/adminAuth');

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

router.get('/dashboard', adminAuth, (req, res) => {
  try {
    const orders = getCollection('orders');
    const users = getCollection('users').filter((u) => u.role === 'customer');
    const products = getCollection('products').filter((p) => p.isActive);
    const totalRevenue = orders.filter((o) => o.paymentStatus === 'completed').reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const lowStockProducts = products.filter((p) => p.stock < 20).length;
    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders: orders.length,
        totalCustomers: users.length,
        totalProducts: products.length,
        pendingOrders,
        deliveredOrders,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/stats', adminAuth, (req, res) => {
  try {
    const orders = getCollection('orders');
    const users = getCollection('users').filter((u) => u.role === 'customer');
    const products = getCollection('products');
    const activeProducts = products.filter((p) => p.isActive);
    const payments = getCollection('payments');
    const returns = getCollection('returns') || [];

    const completedOrders = orders.filter((o) => o.paymentStatus === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalCustomers = users.length;
    const totalProducts = activeProducts.length;
    const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const pendingReturns = returns.filter((r) => r.status === 'pending').length;
    const lowStockProducts = activeProducts.filter((p) => p.stock < 20).length;
    const failedPayments = payments.filter((p) => p.status === 'failed').length;
    const completedPayments = payments.filter((p) => p.status === 'completed').length;
    const totalPayments = payments.length;
    const conversionRate = totalPayments > 0 ? Number(((completedPayments / totalPayments) * 100).toFixed(1)) : 0;
    const refunds = payments.filter((p) => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        conversionRate,
        aov: avgOrderValue,
        refunds,
        pendingOrders,
        pendingReturns,
        lowStockProducts,
        failedPayments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/revenue', adminAuth, (req, res) => {
  try {
    const orders = getCollection('orders');
    const completedOrders = orders.filter((o) => o.paymentStatus === 'completed');
    const dailyRevenue = {};
    completedOrders.forEach((o) => {
      const day = o.createdAt.slice(0, 10);
      if (!dailyRevenue[day]) dailyRevenue[day] = { revenue: 0, orders: 0 };
      dailyRevenue[day].revenue += o.total;
      dailyRevenue[day].orders += 1;
    });
    const monthlyRevenue = {};
    completedOrders.forEach((o) => {
      const month = o.createdAt.slice(0, 7);
      if (!monthlyRevenue[month]) monthlyRevenue[month] = { revenue: 0, orders: 0 };
      monthlyRevenue[month].revenue += o.total;
      monthlyRevenue[month].orders += 1;
    });
    res.json({
      success: true,
      data: {
        daily: Object.entries(dailyRevenue).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
        monthly: Object.entries(monthlyRevenue).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month)),
        totalRevenue: completedOrders.reduce((sum, o) => sum + o.total, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/orders', adminAuth, (req, res) => {
  try {
    const orders = getCollection('orders');
    const dailyOrders = {};
    orders.forEach((o) => {
      const day = o.createdAt.slice(0, 10);
      if (!dailyOrders[day]) dailyOrders[day] = { count: 0, revenue: 0 };
      dailyOrders[day].count += 1;
      dailyOrders[day].revenue += o.total;
    });
    const statusCounts = {};
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    res.json({
      success: true,
      data: {
        daily: Object.entries(dailyOrders).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
        statusBreakdown: statusCounts,
        totalOrders: orders.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/categories', adminAuth, (req, res) => {
  try {
    const products = getCollection('products').filter((p) => p.isActive);
    const orders = getCollection('orders');
    const categories = getCollection('categories');
    const categoryStats = {};
    categories.forEach((c) => {
      if (!c.parentId) {
        const childCats = categories.filter((child) => child.parentId === c.id).map((child) => child.id);
        const catIds = [c.id, ...childCats];
        const catProducts = products.filter((p) => catIds.includes(p.category));
        const catOrders = orders.filter((o) =>
          o.items.some((item) => {
            const prod = products.find((p) => p.id === item.productId);
            return prod && catIds.includes(prod.category);
          })
        );
        categoryStats[c.id] = {
          id: c.id,
          name: c.name,
          slug: c.slug,
          productCount: catProducts.length,
          orderCount: catOrders.length,
          revenue: catOrders.filter((o) => o.paymentStatus === 'completed').reduce((sum, o) => sum + o.total, 0),
        };
      }
    });
    res.json({ success: true, data: Object.values(categoryStats) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/recent-orders', adminAuth, (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const orders = getCollection('orders')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Number(limit))
      .map((o) => {
        const user = findById('users', o.userId);
        return { ...o, customerName: user?.name || 'Unknown', customerEmail: user?.email || 'Unknown' };
      });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/activity', adminAuth, (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const activities = [];
    const orders = getCollection('orders').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const notifications = getCollection('notifications').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const reviews = getCollection('reviews').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    orders.slice(0, 10).forEach((o) => {
      const user = findById('users', o.userId);
      activities.push({
        id: `act-o-${o.id}`,
        type: 'order',
        title: `Order #${o.id.slice(0, 8)} - ${o.status}`,
        description: `${user?.name || 'Customer'} placed an order for ₹${o.total}`,
        timestamp: o.createdAt,
      });
    });

    reviews.slice(0, 5).forEach((r) => {
      const user = findById('users', r.userId);
      const product = findById('products', r.productId);
      activities.push({
        id: `act-r-${r.id}`,
        type: 'review',
        title: `New review on ${product?.name || 'Product'}`,
        description: `${user?.name || 'User'} rated ${r.rating}/5`,
        timestamp: r.createdAt,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, data: activities.slice(0, Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/orders', adminAuth, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let orders = getCollection('orders');
    if (status) orders = orders.filter((o) => o.status === status);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = paginate(orders, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/orders/:id', adminAuth, (req, res) => {
  try {
    const order = findById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    const user = findById('users', order.userId);
    const payments = getCollection('payments').filter((p) => p.orderId === order.id);
    const returns = (getCollection('returns') || []).filter((r) => r.orderId === order.id);
    res.json({
      success: true,
      data: {
        ...order,
        customer: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone, tier: user.tier } : null,
        payments,
        returns,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/orders/:id/status', adminAuth, (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'return_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const order = findById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (!isValidTransition(order.status, status)) {
      return res.status(400).json({ success: false, error: `Cannot transition from '${order.status}' to '${status}'` });
    }
    const updates = { status, updatedAt: new Date().toISOString() };
    if (status === 'shipped') updates.trackingNumber = `LXE${Date.now()}`;
    if (status === 'delivered') updates.paymentStatus = 'completed';
    if (status === 'cancelled') {
      updates.paymentStatus = order.paymentStatus === 'completed' ? 'refunded' : 'cancelled';
      order.items.forEach((item) => {
        const productIndex = getCollection('products').findIndex((p) => p.id === item.productId);
        if (productIndex !== -1) {
          getCollection('products')[productIndex].stock += item.quantity;
        }
        const inv = findByField('inventory', 'productId', item.productId);
        if (inv) {
          const invIndex = getCollection('inventory').findIndex((i) => i.id === inv.id);
          if (invIndex !== -1) getCollection('inventory')[invIndex].stock += item.quantity;
        }
      });
    }
    if (note) updates.note = note;
    updateById('orders', req.params.id, updates);
    insertOne('notifications', {
      id: uuidv4(),
      userId: order.userId,
      type: 'order',
      title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      body: `Your order #${order.id.slice(0, 8)} has been ${status}.`,
      read: false,
      data: { orderId: order.id },
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true, data: { message: `Order status updated to ${status}` } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/customers', adminAuth, (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let users = getCollection('users').filter((u) => u.role === 'customer');
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = paginate(users.map((u) => ({ ...u, password: undefined })), page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/customers/:id', adminAuth, (req, res) => {
  try {
    const user = findById('users', req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Customer not found' });
    const { password: _, ...customer } = user;
    const orders = getCollection('orders').filter((o) => o.userId === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalSpent = orders.filter((o) => o.paymentStatus === 'completed').reduce((sum, o) => sum + o.total, 0);
    const addresses = getCollection('addresses').filter((a) => a.userId === user.id);
    const reviews = getCollection('reviews').filter((r) => r.userId === user.id);
    res.json({
      success: true,
      data: {
        ...customer,
        orders,
        totalSpent,
        orderCount: orders.length,
        addresses,
        reviews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/customers/:id/status', adminAuth, (req, res) => {
  try {
    const { isActive, tier, notes } = req.body;
    const user = findById('users', req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Customer not found' });
    const updates = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (tier) updates.tier = tier;
    if (notes !== undefined) updates.notes = notes;
    updateById('users', req.params.id, updates);
    const updated = findById('users', req.params.id);
    const { password: _, ...customer } = updated;
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/products', adminAuth, (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, brand } = req.query;
    let products = getCollection('products');
    if (search) {
      const q = search.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (category) products = products.filter((p) => p.category === category);
    if (brand) products = products.filter((p) => p.brand === brand);
    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = paginate(products, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/products/:id', adminAuth, (req, res) => {
  try {
    const product = findById('products', req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const reviews = getCollection('reviews').filter((r) => r.productId === product.id);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
    const inv = findByField('inventory', 'productId', product.id);
    res.json({
      success: true,
      data: {
        ...product,
        avgRating: Number(avgRating),
        totalReviews: reviews.length,
        inventory: inv || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/products', adminAuth, (req, res) => {
  try {
    const { name, description, brand, category, price, mrp, stock, sku, images, highlights, specifications, tags } = req.body;
    if (!name || !price || !category || !brand) {
      return res.status(400).json({ success: false, error: 'Name, price, category, and brand are required' });
    }
    const product = {
      id: uuidv4(),
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''),
      description: description || '',
      brand,
      category,
      images: images || [],
      price: Number(price),
      mrp: Number(mrp || price),
      discount: mrp ? Math.round(((mrp - price) / mrp) * 100) : 0,
      rating: 0,
      reviewCount: 0,
      stock: Number(stock || 0),
      sku: sku || `SKU-${Date.now()}`,
      seller: 'LUXE',
      specifications: specifications || {},
      highlights: highlights || [],
      tags: tags || [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    insertOne('products', product);
    insertOne('inventory', {
      id: `inv-${product.id}`,
      productId: product.id,
      sku: product.sku,
      stock: product.stock,
      reserved: 0,
      warehouse: 'Mumbai Central Warehouse',
      lastUpdated: new Date().toISOString(),
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/products/:id', adminAuth, (req, res) => {
  try {
    const product = findById('products', req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const updates = { ...req.body };
    if (updates.name) updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    if (updates.price !== undefined && updates.mrp !== undefined) {
      updates.discount = Math.round(((updates.mrp - updates.price) / updates.mrp) * 100);
    } else if (updates.price !== undefined) {
      updates.discount = Math.round(((product.mrp - updates.price) / product.mrp) * 100);
    } else if (updates.mrp !== undefined) {
      updates.discount = Math.round(((updates.mrp - product.price) / updates.mrp) * 100);
    }
    if (updates.stock !== undefined) {
      const inv = findByField('inventory', 'productId', req.params.id);
      if (inv) {
        const invIndex = getCollection('inventory').findIndex((i) => i.id === inv.id);
        if (invIndex !== -1) {
          getCollection('inventory')[invIndex].stock = Number(updates.stock);
          getCollection('inventory')[invIndex].lastUpdated = new Date().toISOString();
        }
      }
    }
    updateById('products', req.params.id, updates);
    res.json({ success: true, data: findById('products', req.params.id) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/products/:id', adminAuth, (req, res) => {
  try {
    const product = findById('products', req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    updateById('products', req.params.id, { isActive: false, deactivatedAt: new Date().toISOString() });
    res.json({ success: true, data: { message: 'Product deactivated', productId: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/inventory', adminAuth, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    let inventory = getCollection('inventory');
    inventory = inventory.map((inv) => {
      const product = findById('products', inv.productId);
      return { ...inv, productName: product?.name || 'Unknown', productSku: product?.sku || 'N/A' };
    });
    const result = paginate(inventory, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/inventory/:id', adminAuth, (req, res) => {
  try {
    const { stock, reserved, warehouse } = req.body;
    const inv = findById('inventory', req.params.id);
    if (!inv) return res.status(404).json({ success: false, error: 'Inventory item not found' });
    const updates = { lastUpdated: new Date().toISOString() };
    if (stock !== undefined) updates.stock = Number(stock);
    if (reserved !== undefined) updates.reserved = Number(reserved);
    if (warehouse) updates.warehouse = warehouse;
    updateById('inventory', req.params.id, updates);
    if (stock !== undefined) {
      const productIndex = getCollection('products').findIndex((p) => p.id === inv.productId);
      if (productIndex !== -1) getCollection('products')[productIndex].stock = Number(stock);
    }
    res.json({ success: true, data: findById('inventory', req.params.id) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/coupons', adminAuth, (req, res) => {
  try {
    const coupons = getCollection('coupons');
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/coupons', adminAuth, (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, usageLimit, startDate, endDate, applicableTo } = req.body;
    if (!code || !type || !value) {
      return res.status(400).json({ success: false, error: 'Code, type, and value are required' });
    }
    const existing = findByField('coupons', 'code', code.toUpperCase());
    if (existing) return res.status(409).json({ success: false, error: 'Coupon code already exists' });
    const coupon = {
      id: uuidv4(),
      code: code.toUpperCase(),
      type,
      value: Number(value),
      minOrder: Number(minOrder || 0),
      maxDiscount: Number(maxDiscount || 0),
      usageLimit: Number(usageLimit || 1000),
      usedCount: 0,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      isActive: true,
      applicableTo: applicableTo || 'all',
    };
    insertOne('coupons', coupon);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reviews', adminAuth, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    let reviews = getCollection('reviews');
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = paginate(reviews.map((r) => {
      const user = findById('users', r.userId);
      const product = findById('products', r.productId);
      return { ...r, userName: user?.name || 'Unknown', productName: product?.name || 'Unknown' };
    }), page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/reviews/:id/moderate', adminAuth, (req, res) => {
  try {
    const { action } = req.body;
    const review = findById('reviews', req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    if (action === 'approve') {
      updateById('reviews', req.params.id, { verified: true, hidden: false });
    } else if (action === 'hide') {
      updateById('reviews', req.params.id, { hidden: true });
    } else if (action === 'reject') {
      deleteById('reviews', req.params.id);
    } else {
      return res.status(400).json({ success: false, error: 'Action must be approve, hide, or reject' });
    }
    res.json({ success: true, data: { message: `Review ${action}d` } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reviews/:id/feature', adminAuth, (req, res) => {
  try {
    const review = findById('reviews', req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    const allReviews = getCollection('reviews');
    allReviews.forEach((r) => { r.featured = false; });
    updateById('reviews', req.params.id, { featured: true, featuredAt: new Date().toISOString() });
    res.json({ success: true, data: { message: 'Review featured successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/revenue', adminAuth, (req, res) => {
  try {
    const orders = getCollection('orders');
    const completedOrders = orders.filter((o) => o.paymentStatus === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = completedOrders.length;
    const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
    const monthlyRevenue = {};
    completedOrders.forEach((o) => {
      const month = o.createdAt.slice(0, 7);
      if (!monthlyRevenue[month]) monthlyRevenue[month] = { revenue: 0, orders: 0, avgOrderValue: 0 };
      monthlyRevenue[month].revenue += o.total;
      monthlyRevenue[month].orders += 1;
    });
    Object.values(monthlyRevenue).forEach((m) => { m.avgOrderValue = m.orders ? Math.round(m.revenue / m.orders) : 0; });
    const dailyRevenue = {};
    completedOrders.forEach((o) => {
      const day = o.createdAt.slice(0, 10);
      if (!dailyRevenue[day]) dailyRevenue[day] = { revenue: 0, orders: 0 };
      dailyRevenue[day].revenue += o.total;
      dailyRevenue[day].orders += 1;
    });
    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        monthly: Object.entries(monthlyRevenue).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month)),
        daily: Object.entries(dailyRevenue).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/categories', adminAuth, (req, res) => {
  try {
    const products = getCollection('products').filter((p) => p.isActive);
    const categories = getCollection('categories');
    const orders = getCollection('orders');
    const parentCategories = categories.filter((c) => !c.parentId);
    const categoryData = parentCategories.map((cat) => {
      const childCats = categories.filter((c) => c.parentId === cat.id).map((c) => c.id);
      const catIds = [cat.id, ...childCats];
      const catProducts = products.filter((p) => catIds.includes(p.category));
      const catRevenue = orders.filter((o) =>
        o.paymentStatus === 'completed' && o.items.some((item) => {
          const prod = products.find((p) => p.id === item.productId);
          return prod && catIds.includes(prod.category);
        })
      ).reduce((sum, o) => sum + o.total, 0);
      return {
        id: cat.id, name: cat.name, slug: cat.slug,
        productCount: catProducts.length,
        revenue: catRevenue,
        avgPrice: catProducts.length ? Math.round(catProducts.reduce((s, p) => s + p.price, 0) / catProducts.length) : 0,
      };
    });
    res.json({ success: true, data: categoryData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/top-products', adminAuth, (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = getCollection('products').filter((p) => p.isActive);
    const orders = getCollection('orders').filter((o) => o.paymentStatus === 'completed');
    const productSales = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productSales[item.productId]) productSales[item.productId] = { quantity: 0, revenue: 0 };
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .map(([productId, stats]) => {
        const product = findById('products', productId);
        return { ...product, ...stats };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, Number(limit));
    res.json({ success: true, data: topProducts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/customers', adminAuth, (req, res) => {
  try {
    const users = getCollection('users').filter((u) => u.role === 'customer');
    const orders = getCollection('orders');
    const customerOrders = {};
    orders.forEach((o) => {
      if (!customerOrders[o.userId]) customerOrders[o.userId] = { totalSpent: 0, orderCount: 0 };
      customerOrders[o.userId].totalSpent += o.total;
      customerOrders[o.userId].orderCount += 1;
    });
    const tierCounts = {};
    users.forEach((u) => { tierCounts[u.tier] = (tierCounts[u.tier] || 0) + 1; });
    const topSpenders = users
      .map((u) => ({ ...u, ...customerOrders[u.id], password: undefined }))
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 10);
    const repeatCustomers = users.filter((u) => (customerOrders[u.id]?.orderCount || 0) > 1).length;
    res.json({
      success: true,
      data: {
        totalCustomers: users.length,
        tierBreakdown: tierCounts,
        topSpenders,
        repeatCustomers,
        newCustomers: users.filter((u) => {
          const created = new Date(u.createdAt);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
          return created > thirtyDaysAgo;
        }).length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/funnel', adminAuth, (req, res) => {
  try {
    const orders = getCollection('orders');
    const payments = getCollection('payments');
    const completedOrders = orders.filter((o) => o.paymentStatus === 'completed');
    const totalVisitors = orders.length > 0 ? Math.max(orders.length * 10, 100) : 100;
    const productViews = Math.round(totalVisitors * 0.6);
    const addToCart = Math.round(productViews * 0.3);
    const checkoutStarted = Math.round(addToCart * 0.5);
    const paymentAttempted = payments.length || Math.round(checkoutStarted * 0.7);
    const orderCompleted = completedOrders.length || orders.length;
    const orderDelivered = orders.filter((o) => o.status === 'delivered').length;
    const steps = [
      { step: 'Visitors', count: totalVisitors, rate: 100 },
      { step: 'Product Views', count: productViews, rate: Number(((productViews / totalVisitors) * 100).toFixed(1)) },
      { step: 'Add to Cart', count: addToCart, rate: Number(((addToCart / productViews) * 100).toFixed(1)) },
      { step: 'Checkout Started', count: checkoutStarted, rate: Number(((checkoutStarted / addToCart) * 100).toFixed(1)) },
      { step: 'Payment Attempted', count: paymentAttempted, rate: checkoutStarted ? Number(((paymentAttempted / checkoutStarted) * 100).toFixed(1)) : 0 },
      { step: 'Order Completed', count: orderCompleted, rate: totalVisitors ? Number(((orderCompleted / totalVisitors) * 100).toFixed(1)) : 0 },
      { step: 'Order Delivered', count: orderDelivered, rate: totalVisitors ? Number(((orderDelivered / totalVisitors) * 100).toFixed(1)) : 0 },
    ];
    res.json({ success: true, data: { steps, overallConversion: totalVisitors ? Number(((orderCompleted / totalVisitors) * 100).toFixed(2)) : 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/returns', adminAuth, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let returns = getCollection('returns') || [];
    if (status) returns = returns.filter((r) => r.status === status);
    returns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const enriched = returns.map((r) => {
      const order = findById('orders', r.orderId);
      const user = order ? findById('users', order.userId) : null;
      return { ...r, customerName: user?.name || 'Unknown', orderId: r.orderId };
    });
    const result = paginate(enriched, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/returns/:id/status', adminAuth, (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validReturnStatuses = ['pending', 'approved', 'rejected', 'processing', 'completed'];
    if (!validReturnStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid return status' });
    }
    const returns = getCollection('returns') || [];
    const ret = returns.find((r) => r.id === req.params.id);
    if (!ret) return res.status(404).json({ success: false, error: 'Return not found' });
    const updates = { status, updatedAt: new Date().toISOString() };
    if (adminNote) updates.adminNote = adminNote;
    if (status === 'completed' || status === 'approved') {
      const order = findById('orders', ret.orderId);
      if (order) {
        order.items.forEach((item) => {
          if (ret.items && ret.items.some((ri) => ri.productId === item.productId)) {
            const productIndex = getCollection('products').findIndex((p) => p.id === item.productId);
            if (productIndex !== -1) getCollection('products')[productIndex].stock += item.quantity;
            const inv = findByField('inventory', 'productId', item.productId);
            if (inv) {
              const invIndex = getCollection('inventory').findIndex((i) => i.id === inv.id);
              if (invIndex !== -1) getCollection('inventory')[invIndex].stock += item.quantity;
            }
          }
        });
      }
    }
    const retIndex = returns.findIndex((r) => r.id === req.params.id);
    if (retIndex !== -1) returns[retIndex] = { ...returns[retIndex], ...updates };
    res.json({ success: true, data: { message: 'Return status updated' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/notifications', adminAuth, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    let notifications = getCollection('notifications')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = paginate(notifications, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/notifications/send', adminAuth, (req, res) => {
  try {
    const { userId, userIds, type, title, body, data } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'Title and body are required' });
    }
    const targets = userIds || (userId ? [userId] : getCollection('users').map((u) => u.id));
    const sent = targets.map((uid) => {
      const notification = {
        id: uuidv4(),
        userId: uid,
        type: type || 'system',
        title,
        body,
        read: false,
        data: data || {},
        createdAt: new Date().toISOString(),
      };
      insertOne('notifications', notification);
      return notification;
    });
    res.status(201).json({ success: true, data: { message: `Notification sent to ${sent.length} users`, count: sent.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/notifications/:id/read', adminAuth, (req, res) => {
  try {
    const notification = findById('notifications', req.params.id);
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    updateById('notifications', req.params.id, { read: true });
    res.json({ success: true, data: { message: 'Notification marked as read' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/settings', adminAuth, (req, res) => {
  try {
    const { findByField: findSetting } = require('../models/schema');
    let settings = findByField('settings', 'key', 'admin_settings');
    const defaultSettings = {
      key: 'admin_settings',
      storeName: 'LUXE',
      storeDescription: 'Premium E-Commerce Store',
      currency: 'INR',
      taxRate: 15,
      freeShippingThreshold: 999,
      shippingCharge: 99,
      minOrderAmount: 499,
      maxOrderAmount: 500000,
      paymentMethods: ['upi', 'card', 'netbanking', 'cod', 'wallet'],
      codEnabled: true,
      minimumCodAmount: 0,
      maximumCodAmount: 25000,
      returnWindowDays: 30,
      cancellationAllowed: ['pending', 'confirmed'],
      defaultLanguage: 'en',
      supportEmail: 'support@luxe.in',
      supportPhone: '+919876543200',
      socialMedia: {
        instagram: 'https://instagram.com/luxe',
        facebook: 'https://facebook.com/luxe',
        twitter: 'https://twitter.com/luxe',
      },
    };
    if (!settings) {
      insertOne('settings', { ...defaultSettings, id: 'admin_settings', updatedAt: new Date().toISOString() });
      settings = findByField('settings', 'key', 'admin_settings');
    }
    const { key, id, ...settingsData } = settings;
    res.json({ success: true, data: settingsData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/settings', adminAuth, (req, res) => {
  try {
    const { getCollection, findByField: findSetting } = require('../models/schema');
    let settings = findSetting('settings', 'key', 'admin_settings');
    if (!settings) {
      insertOne('settings', { key: 'admin_settings', id: 'admin_settings', ...req.body, updatedAt: new Date().toISOString() });
    } else {
      const settingsIndex = getCollection('settings').findIndex((s) => s.key === 'admin_settings');
      if (settingsIndex !== -1) {
        getCollection('settings')[settingsIndex] = { ...getCollection('settings')[settingsIndex], ...req.body, updatedAt: new Date().toISOString() };
      }
    }
    const updated = findSetting('settings', 'key', 'admin_settings');
    const { key, id, ...settingsData } = updated;
    res.json({ success: true, data: { message: 'Settings updated', settings: settingsData } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/campaigns', adminAuth, (req, res) => {
  try {
    const campaigns = getCollection('campaigns');
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/campaigns', adminAuth, (req, res) => {
  try {
    const { name, type, discount, products, categories, startDate, endDate, targetAudience } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Name and type are required' });
    }
    const campaign = {
      id: uuidv4(),
      name,
      type,
      discount: Number(discount || 0),
      products: products || [],
      categories: categories || [],
      targetAudience: targetAudience || 'All Customers',
      status: 'draft',
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      revenue: 0,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    insertOne('campaigns', campaign);
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/campaigns/:id', adminAuth, (req, res) => {
  try {
    const campaign = findById('campaigns', req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    updateById('campaigns', req.params.id, updates);
    res.json({ success: true, data: findById('campaigns', req.params.id) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/campaigns/:id', adminAuth, (req, res) => {
  try {
    const campaign = findById('campaigns', req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    deleteById('campaigns', req.params.id);
    res.json({ success: true, data: { message: 'Campaign deleted', id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
