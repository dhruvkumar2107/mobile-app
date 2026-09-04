const express = require('express');
const router = express.Router();
const { getCollection } = require('../models/schema');

router.get('/', (req, res) => {
  try {
    const inventory = getCollection('inventory');
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
