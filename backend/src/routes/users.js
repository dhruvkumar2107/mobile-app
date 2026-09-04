const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, findById, findByField, insertOne, updateById } = require('../models/schema');
const { auth } = require('../middleware/auth');

router.get('/addresses', auth, (req, res) => {
  try {
    const addresses = getCollection('addresses').filter((a) => a.userId === req.user.id);
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/addresses', auth, (req, res) => {
  try {
    const { name, phone, line1, line2, city, state, pincode, country = 'India', isDefault } = req.body;
    if (!name || !phone || !line1 || !city || !state || !pincode) {
      return res.status(400).json({ success: false, error: 'All required fields must be provided' });
    }
    if (isDefault) {
      const existing = getCollection('addresses').filter((a) => a.userId === req.user.id && a.isDefault);
      existing.forEach((a) => updateById('addresses', a.id, { isDefault: false }));
    }
    const address = {
      id: uuidv4(),
      userId: req.user.id,
      name, phone, line1, line2: line2 || '', city, state, pincode, country, isDefault: isDefault || false,
    };
    insertOne('addresses', address);
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/addresses/:id', auth, (req, res) => {
  try {
    const address = findById('addresses', req.params.id);
    if (!address) return res.status(404).json({ success: false, error: 'Address not found' });
    if (address.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    const { deleteById: del } = require('../models/schema');
    del('addresses', req.params.id);
    res.json({ success: true, data: { message: 'Address deleted' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
