const express = require('express');
const router = express.Router();
const { getCollection, findByField, insertOne } = require('../models/schema');
const { optionalAuth } = require('../middleware/auth');

const trendingSearches = [
  'Wireless earbuds', 'Leather jacket', 'Smartwatch', 'Running shoes', 'Face serum',
  'Laptop', 'Anarkali suit', 'Dining table', 'Perfume', 'Yoga mat',
];

router.get('/', (req, res) => {
  try {
    const { q, page = 1, limit = 20, minPrice, maxPrice, minRating, sort, category } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Search query is required' });
    const query = q.toLowerCase();
    let results = getCollection('products').filter((p) =>
      p.isActive && (
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(query))) ||
        (p.brand && getCollection('brands').find((b) => b.id === p.brand)?.name.toLowerCase().includes(query))
      )
    );

    if (category) {
      const cats = getCollection('categories');
      const cat = cats.find((c) => c.slug === category || c.id === category);
      if (cat) {
        const childCats = cats.filter((c) => c.parentId === cat.id).map((c) => c.id);
        const catIds = [cat.id, ...childCats];
        results = results.filter((p) => catIds.includes(p.category));
      }
    }
    if (minPrice) results = results.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) results = results.filter((p) => p.price <= Number(maxPrice));
    if (minRating) results = results.filter((p) => Number(p.rating) >= Number(minRating));

    results.sort((a, b) => {
      const aName = a.name.toLowerCase().includes(query) ? 2 : 0;
      const bName = b.name.toLowerCase().includes(query) ? 2 : 0;
      const aTags = (a.tags || []).some((t) => t.toLowerCase().includes(query)) ? 1 : 0;
      const bTags = (b.tags || []).some((t) => t.toLowerCase().includes(query)) ? 1 : 0;
      const relevance = (bName + bTags) - (aName + aTags);
      if (relevance !== 0) return relevance;
      switch (sort) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'popular': return b.reviewCount - a.reviewCount;
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    const start = (Number(page) - 1) * Number(limit);
    const paged = results.slice(start, start + Number(limit));

    const priceRange = results.length ? {
      min: Math.min(...results.map((p) => p.price)),
      max: Math.max(...results.map((p) => p.price)),
    } : { min: 0, max: 0 };

    res.json({
      success: true,
      data: {
        query: q,
        results: paged,
        total: results.length,
        page: Number(page),
        totalPages: Math.ceil(results.length / Number(limit)),
        priceRange,
        filters: { minPrice, maxPrice, minRating, sort, category },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/trending', (req, res) => {
  try {
    res.json({ success: true, data: trendingSearches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/suggestions', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const query = q.toLowerCase();
    const suggestions = new Set();
    getCollection('products').forEach((p) => {
      if (p.name.toLowerCase().includes(query)) suggestions.add(p.name);
      (p.tags || []).forEach((t) => { if (t.toLowerCase().includes(query)) suggestions.add(t); });
    });
    getCollection('categories').forEach((c) => {
      if (c.name.toLowerCase().includes(query)) suggestions.add(c.name);
    });
    res.json({ success: true, data: [...suggestions].slice(0, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
