const express = require('express');
const router = express.Router();
const { getCollection, findById, findByField, updateById } = require('../models/schema');
const { adminAuth } = require('../middleware/adminAuth');

router.get('/', adminAuth, (req, res) => {
  try {
    const inventory = getCollection('inventory');
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
});

router.get('/:id', adminAuth, (req, res) => {
  try {
    const item = findById('inventory', req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Inventory item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch inventory item' });
  }
});

router.put('/:id', adminAuth, (req, res) => {
  try {
    const item = findById('inventory', req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Inventory item not found' });
    const { stock, reserved, warehouse } = req.body;
    const updates = {};
    if (stock !== undefined) updates.stock = Math.max(0, parseInt(stock) || 0);
    if (reserved !== undefined) updates.reserved = Math.max(0, parseInt(reserved) || 0);
    if (warehouse !== undefined) updates.warehouse = warehouse;
    updates.updatedAt = new Date().toISOString();
    updateById('inventory', req.params.id, updates);
    res.json({ success: true, data: { ...item, ...updates } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update inventory' });
  }
});

module.exports = router;
