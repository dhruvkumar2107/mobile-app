const express = require('express');
const router = express.Router();
const { getCollection } = require('../models/schema');

router.get('/revenue', (req, res) => {
  try {
    const orders = getCollection('orders');
    const totalRevenue = orders.filter((o) => o.paymentStatus === 'completed').reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
    const monthlyRevenue = {};
    orders.forEach((o) => {
      const month = o.createdAt.slice(0, 7);
      if (!monthlyRevenue[month]) monthlyRevenue[month] = { revenue: 0, orders: 0 };
      monthlyRevenue[month].revenue += o.total;
      monthlyRevenue[month].orders += 1;
    });
    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sales', (req, res) => {
  try {
    const orders = getCollection('orders');
    const statusCounts = {};
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const paymentMethodCounts = {};
    orders.forEach((o) => {
      paymentMethodCounts[o.paymentMethod] = (paymentMethodCounts[o.paymentMethod] || 0) + 1;
    });
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);
    res.json({
      success: true,
      data: {
        totalSales,
        totalDiscount,
        totalOrders: orders.length,
        statusBreakdown: statusCounts,
        paymentMethodBreakdown: paymentMethodCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/customers', (req, res) => {
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
    users.forEach((u) => {
      tierCounts[u.tier] = (tierCounts[u.tier] || 0) + 1;
    });
    const topSpenders = users
      .map((u) => ({ ...u, ...customerOrders[u.id], password: undefined }))
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 10);
    res.json({
      success: true,
      data: {
        totalCustomers: users.length,
        tierBreakdown: tierCounts,
        topSpenders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/products', (req, res) => {
  try {
    const products = getCollection('products').filter((p) => p.isActive);
    const reviews = getCollection('reviews');
    const productStats = products.map((p) => {
      const pReviews = reviews.filter((r) => r.productId === p.id);
      const avgRating = pReviews.length ? (pReviews.reduce((s, r) => s + r.rating, 0) / pReviews.length).toFixed(1) : 0;
      return { ...p, avgRating: Number(avgRating), totalReviews: pReviews.length };
    });
    const topRated = productStats.filter((p) => p.totalReviews > 0).sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);
    const lowStock = products.filter((p) => p.stock < 20).sort((a, b) => a.stock - b.stock);
    const categoryBreakdown = {};
    products.forEach((p) => {
      categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1;
    });
    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        topRated,
        lowStock,
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
