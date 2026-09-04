const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, findById, findByField, paginate } = require('../models/schema');
const { optionalAuth, auth } = require('../middleware/auth');
const { RATE_LIMITS } = require('../middleware/security');

router.get('/', optionalAuth, (req, res) => {
  try {
    let products = getCollection('products').filter((p) => p.isActive);
    const { category, brand, minPrice, maxPrice, minRating, sort, search, tag, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    if (category) {
      const cats = getCollection('categories');
      const cat = cats.find((c) => c.slug === category || c.id === category);
      if (cat) {
        const childCats = cats.filter((c) => c.parentId === cat.id).map((c) => c.id);
        const catIds = [cat.id, ...childCats];
        products = products.filter((p) => catIds.includes(p.category));
      }
    }
    if (brand) {
      const b = getCollection('brands').find((b) => b.slug === brand || b.id === brand);
      if (b) products = products.filter((p) => p.brand === b.id);
    }
    if (minPrice) products = products.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) products = products.filter((p) => p.price <= Number(maxPrice));
    if (minRating) products = products.filter((p) => Number(p.rating) >= Number(minRating));
    if (tag) products = products.filter((p) => p.tags && p.tags.includes(tag));
    if (search) {
      const q = search.toLowerCase();
      products = products.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q))) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }
    if (sort) {
      switch (sort) {
        case 'price_asc': products.sort((a, b) => a.price - b.price); break;
        case 'price_desc': products.sort((a, b) => b.price - a.price); break;
        case 'rating': products.sort((a, b) => b.rating - a.rating); break;
        case 'newest': products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
        case 'popular': products.sort((a, b) => b.reviewCount - a.reviewCount); break;
        case 'discount': products.sort((a, b) => ((b.mrp - b.price) / b.mrp) - ((a.mrp - a.price) / a.mrp)); break;
        default: products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    } else {
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    const result = paginate(products, pageNum, limitNum);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = findById('products', req.params.id);
    if (!product) {
      const slugProduct = findByField('products', 'slug', req.params.id);
      if (!slugProduct) return res.status(404).json({ success: false, error: 'Product not found' });
      return res.json({ success: true, data: slugProduct });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get product' });
  }
});

router.get('/:id/related', (req, res) => {
  try {
    const product = findById('products', req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    let related = getCollection('products').filter(
      (p) => p.id !== product.id && p.isActive && (p.category === product.category || p.brand === product.brand)
    );
    related.sort((a, b) => {
      const aMatch = (a.category === product.category ? 1 : 0) + (a.brand === product.brand ? 1 : 0);
      const bMatch = (b.category === product.category ? 1 : 0) + (b.brand === product.brand ? 1 : 0);
      return bMatch - aMatch;
    });
    res.json({ success: true, data: related.slice(0, 12) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get related products' });
  }
});

router.post('/:id/review', auth, RATE_LIMITS.review, (req, res) => {
  try {
    const product = findById('products', req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const { rating, title, body } = req.body;
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
      return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5' });
    }
    const existingReview = getCollection('reviews').find(
      (r) => r.userId === req.user.id && r.productId === product.id
    );
    if (existingReview) {
      return res.status(409).json({ success: false, error: 'You have already reviewed this product' });
    }
    const orders = getCollection('orders').filter(
      (o) => o.userId === req.user.id && o.items.some((i) => i.productId === product.id) && o.status === 'delivered'
    );
    const review = {
      id: uuidv4(),
      userId: req.user.id,
      productId: product.id,
      rating: Number(rating),
      title: (title || '').trim().slice(0, 200),
      body: (body || '').trim().slice(0, 2000),
      images: [],
      helpful: 0,
      verified: orders.length > 0,
      featured: false,
      hidden: false,
      createdAt: new Date().toISOString(),
    };
    const reviews = getCollection('reviews');
    reviews.push(review);
    const productReviews = reviews.filter((r) => r.productId === product.id);
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    const productIndex = getCollection('products').findIndex((p) => p.id === product.id);
    if (productIndex !== -1) {
      getCollection('products')[productIndex].rating = Number(avgRating.toFixed(1));
      getCollection('products')[productIndex].reviewCount = productReviews.length;
    }
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
});

module.exports = router;
