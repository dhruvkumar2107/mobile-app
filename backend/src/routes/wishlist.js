const express = require('express');
const router = express.Router();
const { getCollection, findByField, insertOne, updateById } = require('../models/schema');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    let wishlist = findByField('wishlist', 'userId', req.user.id);
    if (!wishlist) {
      wishlist = { userId: req.user.id, items: [] };
      insertOne('wishlist', wishlist);
    }
    const enrichedItems = wishlist.items.map((item) => {
      const product = findByField('products', 'id', item.productId);
      return { ...item, product: product || null };
    }).filter((item) => item.product !== null);
    res.json({ success: true, data: { ...wishlist, items: enrichedItems, itemCount: enrichedItems.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/add', auth, (req, res) => {
  try {
    const { productId } = req.body;
    const product = findByField('products', 'id', productId);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    let wishlist = findByField('wishlist', 'userId', req.user.id);
    if (!wishlist) {
      wishlist = { userId: req.user.id, items: [] };
      insertOne('wishlist', wishlist);
    }
    const exists = wishlist.items.some((i) => i.productId === productId);
    if (exists) return res.status(409).json({ success: false, error: 'Product already in wishlist' });
    wishlist.items.push({ productId, addedAt: new Date().toISOString() });
    updateById('wishlist', wishlist.userId, { items: wishlist.items });
    res.json({ success: true, data: { message: 'Added to wishlist', itemCount: wishlist.items.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:productId', auth, (req, res) => {
  try {
    let wishlist = findByField('wishlist', 'userId', req.user.id);
    if (!wishlist) return res.status(404).json({ success: false, error: 'Wishlist not found' });
    wishlist.items = wishlist.items.filter((i) => i.productId !== req.params.productId);
    updateById('wishlist', wishlist.userId, { items: wishlist.items });
    res.json({ success: true, data: { message: 'Removed from wishlist', itemCount: wishlist.items.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
