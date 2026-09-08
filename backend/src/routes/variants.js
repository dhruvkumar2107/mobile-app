const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getCollection, findById, insertOne, updateById, deleteById, filterByField, paginate } = require('../models/schema');
const { adminAuth } = require('../middleware/adminAuth');
const { auth, optionalAuth } = require('../middleware/auth');
const { broadcast } = require('../websocket');

const router = express.Router();

function addAuditLog(userId, action, entityType, entityId, changes) {
  insertOne('auditLogs', {
    id: uuidv4(),
    userId,
    action,
    entityType,
    entityId,
    changes,
    createdAt: new Date().toISOString(),
  });
}

function addPriceHistory(productId, variantId, oldPrice, newPrice, changedBy) {
  insertOne('priceHistory', {
    id: uuidv4(),
    productId,
    variantId,
    oldPrice,
    newPrice,
    changedBy,
    createdAt: new Date().toISOString(),
  });
}

function generateVariantCombinations(productId, attributes) {
  if (!attributes || attributes.length === 0) return [];
  const valueArrays = attributes.map((a) => a.values.map((v) => ({ attrName: a.name, attrValue: v.name, hex: v.hex || null, image: v.image || null })));
  const combinations = valueArrays.reduce((acc, curr) => {
    if (acc.length === 0) return curr.map((v) => [v]);
    const result = [];
    acc.forEach((combo) => curr.forEach((v) => result.push([...combo, v])));
    return result;
  }, []);
  return combinations.map((combo) => {
    const attrMap = {};
    combo.forEach((c) => { attrMap[c.attrName] = c.attrValue; });
    const skuSuffix = combo.map((c) => c.attrValue.replace(/\s+/g, '').substring(0, 4).toUpperCase()).join('-');
    return { id: uuidv4(), productId, attributes: attrMap, combo, skuSuffix };
  });
}

router.get('/product/:productId', optionalAuth, (req, res) => {
  const { productId } = req.params;
  const product = findById('products', productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  const attributes = filterByField('variantAttributes', 'productId', productId);
  const variants = filterByField('variants', 'productId', productId).filter((v) => v.isActive !== false);
  const priceRules = filterByField('priceRules', 'productId', productId).filter((r) => r.isActive);
  const now = new Date().toISOString();
  const activeRules = priceRules.filter((r) => (!r.startDate || r.startDate <= now) && (!r.endDate || r.endDate >= now));
  const enrichedVariants = variants.map((v) => {
    let effectivePrice = product.price + (v.priceDelta || 0);
    if (v.priceOverride !== undefined && v.priceOverride !== null) effectivePrice = v.priceOverride;
    activeRules.forEach((rule) => {
      if (rule.type === 'percentage') effectivePrice = Math.round(effectivePrice * (1 - rule.value / 100));
      else if (rule.type === 'fixed') effectivePrice = Math.max(0, effectivePrice - rule.value);
      else if (rule.type === 'flash') effectivePrice = Math.round(effectivePrice * (1 - rule.value / 100));
    });
    return { ...v, effectivePrice, originalPrice: product.price + (v.priceDelta || 0) };
  });
  res.json({
    success: true,
    data: {
      productId,
      attributes: attributes.map((a) => ({ id: a.id, name: a.name, type: a.type, values: a.values })),
      variants: enrichedVariants,
      priceRules: activeRules,
    },
  });
});

router.post('/product/:productId/attributes', adminAuth, (req, res) => {
  const { productId } = req.params;
  const { attributes } = req.body;
  const product = findById('products', productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
    return res.status(400).json({ success: false, error: 'Attributes array required' });
  }
  const existing = filterByField('variantAttributes', 'productId', productId);
  existing.forEach((ea) => deleteById('variantAttributes', ea.id));
  const attrDocs = attributes.map((a) => ({
    id: uuidv4(),
    productId,
    name: a.name,
    type: a.type || 'text',
    values: (a.values || []).map((v) => ({
      name: typeof v === 'string' ? v : v.name,
      hex: typeof v === 'object' ? v.hex : undefined,
      image: typeof v === 'object' ? v.image : undefined,
    })),
  }));
  attrDocs.forEach((a) => insertOne('variantAttributes', a));
  addAuditLog(req.user.id, 'set_attributes', 'product', productId, { attributes: attrDocs });
  broadcast('products', 'attributes_updated', { productId, attributes: attrDocs });
  res.json({ success: true, data: attrDocs });
});

router.post('/product/:productId/generate-variants', adminAuth, (req, res) => {
  const { productId } = req.params;
  const { basePriceDelta, defaultStock } = req.body;
  const product = findById('products', productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  const attributes = filterByField('variantAttributes', 'productId', productId);
  if (attributes.length === 0) return res.status(400).json({ success: false, error: 'No attributes defined for this product' });
  const existingVariants = filterByField('variants', 'productId', productId);
  const existingKeys = new Set(existingVariants.map((v) => JSON.stringify(v.attributes)));
  const combos = generateVariantCombinations(productId, attributes);
  let created = 0;
  const newVariants = [];
  combos.forEach((combo) => {
    const attrKey = JSON.stringify(combo.attributes);
    if (existingKeys.has(attrKey)) return;
    const sku = `${product.sku}-${combo.skuSuffix}`;
    const variant = {
      id: uuidv4(),
      productId,
      sku,
      barcode: '',
      attributes: combo.attributes,
      priceDelta: basePriceDelta || 0,
      priceOverride: null,
      stock: defaultStock || 50,
      reserved: 0,
      images: [],
      specifications: {},
      availability: 'in_stock',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    insertOne('variants', variant);
    insertOne('inventory', {
      id: `inv-${variant.id}`,
      productId,
      variantId: variant.id,
      sku,
      stock: variant.stock,
      reserved: 0,
      warehouse: 'Mumbai Central Warehouse',
      lastUpdated: new Date().toISOString(),
    });
    newVariants.push(variant);
    created++;
  });
  addAuditLog(req.user.id, 'generate_variants', 'product', productId, { count: created });
  broadcast('products', 'variants_generated', { productId, count: created });
  res.json({ success: true, data: { created, variants: newVariants } });
});

router.get('/product/:productId/grid', adminAuth, (req, res) => {
  const { productId } = req.params;
  const product = findById('products', productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  const attributes = filterByField('variantAttributes', 'productId', productId);
  const variants = filterByField('variants', 'productId', productId);
  res.json({
    success: true,
    data: {
      product: { id: product.id, name: product.name, price: product.price, sku: product.sku },
      attributes: attributes.map((a) => ({ id: a.id, name: a.name, type: a.type, values: a.values })),
      variants,
      totalVariants: variants.length,
    },
  });
});

router.put('/bulk-update', adminAuth, (req, res) => {
  const { variantIds, updates } = req.body;
  if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
    return res.status(400).json({ success: false, error: 'variantIds array required' });
  }
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ success: false, error: 'updates object required' });
  }
  const allowed = ['stock', 'priceDelta', 'priceOverride', 'availability', 'isActive', 'images'];
  const safeUpdates = {};
  Object.keys(updates).forEach((k) => { if (allowed.includes(k)) safeUpdates[k] = updates[k]; });
  const updated = [];
  variantIds.forEach((vid) => {
    const variant = findById('variants', vid);
    if (!variant) return;
    const oldValues = {};
    Object.keys(safeUpdates).forEach((k) => { oldValues[k] = variant[k]; });
    const updatedVariant = updateById('variants', vid, { ...safeUpdates, updatedAt: new Date().toISOString() });
    if (updatedVariant) {
      if (safeUpdates.stock !== undefined) {
        const inv = findById('inventory', `inv-${vid}`);
        if (inv) updateById('inventory', `inv-${vid}`, { stock: safeUpdates.stock, lastUpdated: new Date().toISOString() });
        const product = findById('products', updatedVariant.productId);
        if (product) {
          const allVariants = filterByField('variants', 'productId', updatedVariant.productId);
          const totalStock = allVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
          updateById('products', updatedVariant.productId, { stock: totalStock });
        }
      }
      if (safeUpdates.priceDelta !== undefined || safeUpdates.priceOverride !== undefined) {
        const product = findById('products', updatedVariant.productId);
        if (product) addPriceHistory(updatedVariant.productId, vid, oldValues.priceDelta || oldValues.priceOverride, safeUpdates.priceDelta || safeUpdates.priceOverride, req.user.id);
      }
      updated.push(updatedVariant);
    }
  });
  addAuditLog(req.user.id, 'bulk_update_variants', 'variant', null, { variantIds, updates: safeUpdates, count: updated.length });
  if (updated.length > 0 && updated[0].productId) {
    broadcast('products', 'variants_updated', { productId: updated[0].productId, variants: updated });
  }
  res.json({ success: true, data: { updated: updated.length, variants: updated } });
});

router.put('/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  const variant = findById('variants', id);
  if (!variant) return res.status(404).json({ success: false, error: 'Variant not found' });
  const allowed = ['stock', 'priceDelta', 'priceOverride', 'availability', 'isActive', 'images', 'specifications', 'barcode', 'sku'];
  const safeUpdates = {};
  Object.keys(req.body).forEach((k) => { if (allowed.includes(k)) safeUpdates[k] = req.body[k]; });
  const oldPrice = variant.priceDelta;
  const updated = updateById('variants', id, { ...safeUpdates, updatedAt: new Date().toISOString() });
  if (safeUpdates.stock !== undefined) {
    const inv = findById('inventory', `inv-${id}`);
    if (inv) updateById('inventory', `inv-${id}`, { stock: safeUpdates.stock, lastUpdated: new Date().toISOString() });
    const allVariants = filterByField('variants', 'productId', variant.productId);
    const totalStock = allVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
    updateById('products', variant.productId, { stock: totalStock });
  }
  if (safeUpdates.priceDelta !== undefined || safeUpdates.priceOverride !== undefined) {
    addPriceHistory(variant.productId, id, oldPrice, safeUpdates.priceDelta || safeUpdates.priceOverride, req.user.id);
  }
  addAuditLog(req.user.id, 'update_variant', 'variant', id, { changes: safeUpdates });
  broadcast('products', 'variant_updated', { productId: variant.productId, variant: updated });
  res.json({ success: true, data: updated });
});

router.post('/:id/notify-when-available', auth, (req, res) => {
  const { id } = req.params;
  const variant = findById('variants', id);
  if (!variant) return res.status(404).json({ success: false, error: 'Variant not found' });
  const existing = getCollection('variantWishlist').find((w) => w.userId === req.user.id && w.variantId === id);
  if (existing) {
    existing.notifyOnAvailable = true;
    return res.json({ success: true, message: 'You will be notified when this variant is available' });
  }
  insertOne('variantWishlist', {
    id: uuidv4(),
    userId: req.user.id,
    productId: variant.productId,
    variantId: id,
    notifyOnAvailable: true,
    createdAt: new Date().toISOString(),
  });
  res.json({ success: true, message: 'You will be notified when this variant is available' });
});

router.get('/compare', optionalAuth, (req, res) => {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ success: false, error: 'ids query parameter required' });
  const idList = ids.split(',');
  const variants = idList.map((id) => findById('variants', id)).filter(Boolean);
  if (variants.length === 0) return res.status(404).json({ success: false, error: 'No variants found' });
  const product = findById('products', variants[0].productId);
  const enriched = variants.map((v) => ({
    ...v,
    effectivePrice: product.price + (v.priceDelta || 0),
    originalPrice: product.price + (v.priceDelta || 0),
  }));
  res.json({ success: true, data: enriched });
});

router.get('/price-history/:productId', optionalAuth, (req, res) => {
  const { productId } = req.params;
  const variantId = req.query.variantId || null;
  let history = filterByField('priceHistory', 'productId', productId);
  if (variantId) history = history.filter((h) => h.variantId === variantId);
  history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: history.slice(0, 30) });
});

module.exports = router;
