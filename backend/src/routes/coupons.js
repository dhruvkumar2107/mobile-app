const express = require('express');
const router = express.Router();
const { findByField, updateById } = require('../models/schema');
const { auth } = require('../middleware/auth');

router.get('/validate/:code', (req, res) => {
  try {
    const coupon = findByField('coupons', 'code', req.params.code.toUpperCase());
    if (!coupon) return res.status(404).json({ success: false, error: 'Coupon not found' });
    if (!coupon.isActive) return res.status(400).json({ success: false, error: 'Coupon is no longer active' });
    const now = new Date();
    if (new Date(coupon.endDate) < now) return res.status(400).json({ success: false, error: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, error: 'Coupon usage limit reached' });
    res.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount,
        applicableTo: coupon.applicableTo,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/apply', auth, (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = findByField('coupons', 'code', (code || '').toUpperCase());
    if (!coupon) return res.status(404).json({ success: false, error: 'Invalid coupon code' });
    if (!coupon.isActive) return res.status(400).json({ success: false, error: 'Coupon is not active' });
    const now = new Date();
    if (new Date(coupon.endDate) < now) return res.status(400).json({ success: false, error: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, error: 'Coupon usage limit reached' });
    if (subtotal && subtotal < coupon.minOrder) {
      return res.status(400).json({ success: false, error: `Minimum order of ₹${coupon.minOrder} required` });
    }
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.min(Math.round((subtotal || 0) * coupon.value / 100), coupon.maxDiscount || Infinity);
    } else {
      discount = Math.min(coupon.value, subtotal || 0);
    }
    updateById('coupons', coupon.id, { usedCount: coupon.usedCount + 1 });
    res.json({
      success: true,
      data: {
        code: coupon.code,
        discount,
        type: coupon.type,
        value: coupon.value,
        message: `Coupon applied! You save ₹${discount}`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
