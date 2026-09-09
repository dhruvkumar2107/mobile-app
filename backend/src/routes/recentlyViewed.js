const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, findById } = require('../models/schema');

router.post('/', (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }
    const product = findById('products', productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const items = getCollection('recentlyViewed');
    const existingIndex = items.findIndex(
      (item) => item.userId === req.user.id && item.productId === productId
    );
    if (existingIndex !== -1) {
      items[existingIndex].viewedAt = new Date().toISOString();
      return res.json({ success: true, data: items[existingIndex] });
    }
    const entry = {
      id: uuidv4(),
      userId: req.user.id,
      productId,
      viewedAt: new Date().toISOString(),
    };
    items.push(entry);
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to track recently viewed' });
  }
});

router.get('/', (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const items = getCollection('recentlyViewed')
      .filter((item) => item.userId === req.user.id)
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, limit);
    const products = items
      .map((item) => {
        const product = findById('products', item.productId);
        if (!product) return null;
        return { ...product, viewedAt: item.viewedAt };
      })
      .filter(Boolean);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get recently viewed products' });
  }
});

module.exports = router;
