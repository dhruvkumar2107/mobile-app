const express = require('express');
const router = express.Router();
const { getCollection, findByField, insertOne, updateById, deleteById } = require('../models/schema');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    let cart = findByField('cart', 'userId', req.user.id);
    if (!cart) {
      cart = { userId: req.user.id, items: [] };
      insertOne('cart', cart);
    }
    const enrichedItems = cart.items.map((item) => {
      const product = findByField('products', 'id', item.productId);
      return { ...item, product: product || null };
    });
    const subtotal = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ success: true, data: { ...cart, items: enrichedItems, subtotal, itemCount: cart.items.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get cart' });
  }
});

router.post('/add', auth, (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid product ID is required' });
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return res.status(400).json({ success: false, error: 'Quantity must be between 1 and 100' });
    }
    const product = findByField('products', 'id', productId);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    if (!product.isActive) return res.status(400).json({ success: false, error: 'Product is not available' });
    if (product.stock < qty) return res.status(400).json({ success: false, error: 'Insufficient stock' });
    let cart = findByField('cart', 'userId', req.user.id);
    if (!cart) {
      cart = { userId: req.user.id, items: [] };
      insertOne('cart', cart);
    }
    if (cart.items.length >= 50) {
      return res.status(400).json({ success: false, error: 'Cart cannot contain more than 50 items' });
    }
    const existingItemIndex = cart.items.findIndex((i) => i.productId === productId);
    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity += qty;
    } else {
      cart.items.push({ productId, quantity: qty, price: product.price, image: product.images[0] || '' });
    }
    updateById('cart', cart.userId, { items: cart.items });
    res.json({ success: true, data: { message: 'Item added to cart', itemCount: cart.items.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add to cart' });
  }
});

router.put('/update', auth, (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid product ID is required' });
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0 || qty > 100) {
      return res.status(400).json({ success: false, error: 'Quantity must be between 0 and 100' });
    }
    let cart = findByField('cart', 'userId', req.user.id);
    if (!cart) return res.status(404).json({ success: false, error: 'Cart not found' });
    const itemIndex = cart.items.findIndex((i) => i.productId === productId);
    if (itemIndex === -1) return res.status(404).json({ success: false, error: 'Item not in cart' });
    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = findByField('products', 'id', productId);
      if (product && product.stock < qty) {
        return res.status(400).json({ success: false, error: 'Insufficient stock' });
      }
      cart.items[itemIndex].quantity = qty;
    }
    updateById('cart', cart.userId, { items: cart.items });
    res.json({ success: true, data: { message: 'Cart updated', itemCount: cart.items.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update cart' });
  }
});

router.delete('/:productId', auth, (req, res) => {
  try {
    if (!req.params.productId || typeof req.params.productId !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid product ID is required' });
    }
    let cart = findByField('cart', 'userId', req.user.id);
    if (!cart) return res.status(404).json({ success: false, error: 'Cart not found' });
    cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
    updateById('cart', cart.userId, { items: cart.items });
    res.json({ success: true, data: { message: 'Item removed from cart', itemCount: cart.items.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove from cart' });
  }
});

module.exports = router;
