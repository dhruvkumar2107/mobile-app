const express = require('express');
const router = express.Router();
const { findByField, updateById } = require('../models/schema');
const { auth } = require('../middleware/auth');
const { RATE_LIMITS } = require('../middleware/security');

router.get('/validate/:code', RATE_LIMITS.general, (req, res) => {
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
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
});

router.post('/apply', auth, RATE_LIMITS.general, (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }
    const coupon = findByField('coupons', 'code', code.toUpperCase());
    if (!coupon) return res.status(404).json({ success: false, error: 'Invalid coupon code' });
    if (!coupon.isActive) return res.status(400).json({ success: false, error: 'Coupon is not active' });
    const now = new Date();
    if (new Date(coupon.endDate) < now) return res.status(400).json({ success: false, error: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, error: 'Coupon usage limit reached' });

    const orderSubtotal = subtotal || 0;
    if (orderSubtotal < coupon.minOrder) {
      return res.status(400).json({ success: false, error: `Minimum order of ₹${coupon.minOrder} required` });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.min(Math.round(orderSubtotal * coupon.value / 100), coupon.maxDiscount || Infinity);
    } else {
      discount = Math.min(coupon.value, orderSubtotal);
    }

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
    res.status(500).json({ success: false, error: 'Failed to apply coupon' });
  }
});

module.exports = router;
