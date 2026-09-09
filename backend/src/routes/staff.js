const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, findById, insertOne, updateById, deleteById, paginate } = require('../models/schema');
const { adminAuth } = require('../middleware/adminAuth');

const ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: [
      'manage_staff', 'manage_products', 'manage_categories', 'manage_variants',
      'manage_orders', 'view_orders', 'update_order_status',
      'manage_inventory', 'view_inventory',
      'manage_customers', 'view_customers',
      'manage_reviews', 'manage_campaigns', 'manage_coupons', 'manage_banners',
      'manage_payments', 'manage_refunds',
      'view_analytics', 'manage_settings', 'manage_notifications',
    ],
  },
  ADMIN: {
    name: 'Admin',
    description: 'Administrative access without staff management',
    permissions: [
      'manage_products', 'manage_categories', 'manage_variants',
      'manage_orders', 'view_orders', 'update_order_status',
      'manage_inventory', 'view_inventory',
      'manage_customers', 'view_customers',
      'manage_reviews', 'manage_campaigns', 'manage_coupons', 'manage_banners',
      'manage_payments', 'manage_refunds',
      'view_analytics', 'manage_settings', 'manage_notifications',
    ],
  },
  ORDER_MANAGER: {
    name: 'Order Manager',
    description: 'Manages orders and order fulfillment',
    permissions: ['manage_orders', 'view_orders', 'update_order_status'],
  },
  PRODUCT_MANAGER: {
    name: 'Product Manager',
    description: 'Manages products, categories, and variants',
    permissions: ['manage_products', 'manage_categories', 'manage_variants'],
  },
  INVENTORY_MANAGER: {
    name: 'Inventory Manager',
    description: 'Manages stock and inventory',
    permissions: ['manage_inventory', 'view_inventory'],
  },
  CUSTOMER_SUPPORT: {
    name: 'Customer Support',
    description: 'Handles customer inquiries and reviews',
    permissions: ['manage_orders', 'view_customers', 'manage_reviews'],
  },
  MARKETING_MANAGER: {
    name: 'Marketing Manager',
    description: 'Manages campaigns, coupons, and banners',
    permissions: ['manage_campaigns', 'manage_coupons', 'manage_banners'],
  },
  FINANCE_MANAGER: {
    name: 'Finance Manager',
    description: 'Views analytics and manages payments/refunds',
    permissions: ['view_analytics', 'manage_payments', 'manage_refunds'],
  },
};

router.get('/roles', adminAuth, (req, res) => {
  try {
    const roles = Object.entries(ROLES).map(([key, value]) => ({
      id: key,
      ...value,
    }));
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', adminAuth, (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    let staff = getCollection('staff');
    if (role) staff = staff.filter((s) => s.role === role);
    if (search) {
      const q = search.toLowerCase();
      staff = staff.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    staff.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = paginate(staff, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', adminAuth, (req, res) => {
  try {
    const member = findById('staff', req.params.id);
    if (!member) return res.status(404).json({ success: false, error: 'Staff member not found' });
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', adminAuth, (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, and role are required' });
    }
    if (!ROLES[role]) {
      return res.status(400).json({ success: false, error: `Invalid role. Valid roles: ${Object.keys(ROLES).join(', ')}` });
    }
    const existing = getCollection('staff').find((s) => s.email === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, error: 'A staff member with this email already exists' });
    }
    const member = {
      id: uuidv4(),
      userId: `staff-${uuidv4().slice(0, 8)}`,
      name,
      email: email.toLowerCase(),
      role,
      permissions: ROLES[role].permissions,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    insertOne('staff', member);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', adminAuth, (req, res) => {
  try {
    const member = findById('staff', req.params.id);
    if (!member) return res.status(404).json({ success: false, error: 'Staff member not found' });
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    if (updates.role && ROLES[updates.role]) {
      updates.permissions = ROLES[updates.role].permissions;
    }
    delete updates.id;
    updateById('staff', req.params.id, updates);
    res.json({ success: true, data: findById('staff', req.params.id) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', adminAuth, (req, res) => {
  try {
    const member = findById('staff', req.params.id);
    if (!member) return res.status(404).json({ success: false, error: 'Staff member not found' });
    deleteById('staff', req.params.id);
    res.json({ success: true, data: { message: 'Staff member removed', id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
