const express = require('express');
const router = express.Router();
const { getCollection, findByField, filterByField } = require('../models/schema');

router.get('/', (req, res) => {
  try {
    const categories = getCollection('categories')
      .filter((c) => !c.parentId)
      .sort((a, b) => a.order - b.order)
      .map((cat) => ({
        ...cat,
        subcategories: getCollection('categories')
          .filter((c) => c.parentId === cat.id)
          .sort((a, b) => a.order - b.order),
      }));
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:slug', (req, res) => {
  try {
    const category = findByField('categories', 'slug', req.params.slug) || findByField('categories', 'id', req.params.slug);
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    const subcategories = getCollection('categories').filter((c) => c.parentId === category.id);
    const catIds = [category.id, ...subcategories.map((c) => c.id)];
    const products = getCollection('products').filter((p) => catIds.includes(p.category) && p.isActive);
    res.json({ success: true, data: { category, subcategories, products, totalProducts: products.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
