const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, findById, findByField, insertOne, updateById, deleteById } = require('../models/schema');
const { auth } = require('../middleware/auth');

router.get('/addresses', auth, (req, res) => {
  try {
    const addresses = getCollection('addresses').filter((a) => a.userId === req.user.id);
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch addresses' });
  }
});

router.post('/addresses', auth, (req, res) => {
  try {
    const { name, phone, line1, line2, city, state, pincode, country, isDefault } = req.body;
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
      name: name.trim(),
      phone: phone.trim(),
      line1: line1.trim(),
      line2: (line2 || '').trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: String(pincode).trim(),
      country: country || 'India',
      isDefault: isDefault || false,
      createdAt: new Date().toISOString(),
    };
    insertOne('addresses', address);
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create address' });
  }
});

router.put('/addresses/:id', auth, (req, res) => {
  try {
    const address = findById('addresses', req.params.id);
    if (!address) return res.status(404).json({ success: false, error: 'Address not found' });
    if (address.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });

    const { name, phone, line1, line2, city, state, pincode, country, isDefault } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (line1 !== undefined) updates.line1 = line1.trim();
    if (line2 !== undefined) updates.line2 = line2.trim();
    if (city !== undefined) updates.city = city.trim();
    if (state !== undefined) updates.state = state.trim();
    if (pincode !== undefined) updates.pincode = String(pincode).trim();
    if (country !== undefined) updates.country = country;
    if (isDefault !== undefined) {
      updates.isDefault = isDefault;
      if (isDefault) {
        const existing = getCollection('addresses').filter((a) => a.userId === req.user.id && a.isDefault && a.id !== req.params.id);
        existing.forEach((a) => updateById('addresses', a.id, { isDefault: false }));
      }
    }
    updates.updatedAt = new Date().toISOString();

    updateById('addresses', req.params.id, updates);
    res.json({ success: true, data: { ...address, ...updates } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update address' });
  }
});

router.delete('/addresses/:id', auth, (req, res) => {
  try {
    const address = findById('addresses', req.params.id);
    if (!address) return res.status(404).json({ success: false, error: 'Address not found' });
    if (address.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    deleteById('addresses', req.params.id);
    res.json({ success: true, data: { message: 'Address deleted' } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
});

module.exports = router;
