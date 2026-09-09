const express = require('express');
const router = express.Router();
const adminRouter = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, findById, insertOne, updateById, deleteById, paginate } = require('../models/schema');

router.get('/banners', (req, res) => {
  try {
    const banners = getCollection('cmsBanners')
      .filter((b) => b.isActive)
      .sort((a, b) => a.order - b.order);
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get banners' });
  }
});

router.get('/homepage', (req, res) => {
  try {
    const banners = getCollection('cmsBanners')
      .filter((b) => b.isActive)
      .sort((a, b) => a.order - b.order);

    const allProducts = getCollection('products').filter((p) => p.isActive);

    const featuredProducts = allProducts
      .filter((p) => p.featured === true)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);

    const bestSellers = [...allProducts]
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 8);

    const newArrivals = [...allProducts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

    const trendingProducts = [...allProducts]
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 8);

    res.json({
      success: true,
      data: {
        banners,
        featuredProducts,
        bestSellers,
        newArrivals,
        trendingProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get homepage data' });
  }
});

adminRouter.get('/', (req, res) => {
  try {
    const banners = getCollection('cmsBanners').sort((a, b) => a.order - b.order);
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get banners' });
  }
});

adminRouter.post('/', (req, res) => {
  try {
    const { title, subtitle, image, link, type, isActive, order } = req.body;
    if (!title || !image) {
      return res.status(400).json({ success: false, error: 'Title and image are required' });
    }
    const validTypes = ['hero', 'promo', 'category'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Type must be hero, promo, or category' });
    }
    const banner = {
      id: uuidv4(),
      title: title.trim(),
      subtitle: (subtitle || '').trim(),
      image,
      link: link || null,
      type: type || 'hero',
      isActive: isActive !== false,
      order: order || 0,
      createdAt: new Date().toISOString(),
    };
    insertOne('cmsBanners', banner);
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create banner' });
  }
});

adminRouter.put('/:id', (req, res) => {
  try {
    const banner = findById('cmsBanners', req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    const { title, subtitle, image, link, type, isActive, order } = req.body;
    const validTypes = ['hero', 'promo', 'category'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Type must be hero, promo, or category' });
    }
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (subtitle !== undefined) updates.subtitle = subtitle.trim();
    if (image !== undefined) updates.image = image;
    if (link !== undefined) updates.link = link;
    if (type !== undefined) updates.type = type;
    if (isActive !== undefined) updates.isActive = isActive;
    if (order !== undefined) updates.order = order;
    const updated = updateById('cmsBanners', req.params.id, updates);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update banner' });
  }
});

adminRouter.delete('/:id', (req, res) => {
  try {
    const banner = findById('cmsBanners', req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    deleteById('cmsBanners', req.params.id);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete banner' });
  }
});

module.exports = { cmsRoutes: router, bannerAdminRoutes: adminRouter };
