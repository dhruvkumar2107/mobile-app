const express = require('express');
const router = express.Router();
const { getCollection, findById, paginate } = require('../models/schema');

router.get('/product/:productId', (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

    let reviews = getCollection('reviews').filter((r) => r.productId === req.params.productId && !r.hidden);

    switch (sort) {
      case 'highest': reviews.sort((a, b) => b.rating - a.rating); break;
      case 'lowest': reviews.sort((a, b) => a.rating - b.rating); break;
      case 'helpful': reviews.sort((a, b) => b.helpful - a.helpful); break;
      default: reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const result = paginate(reviews, pageNum, limitNum);
    const allReviews = getCollection('reviews').filter((r) => r.productId === req.params.productId && !r.hidden);
    const avgRating = allReviews.length ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1) : 0;
    const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: allReviews.filter((rev) => rev.rating === r).length,
      percentage: allReviews.length ? Math.round((allReviews.filter((rev) => rev.rating === r).length / allReviews.length) * 100) : 0,
    }));

    res.json({
      success: true,
      data: {
        reviews: result.items,
        pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
        summary: { avgRating: Number(avgRating), totalReviews: allReviews.length, ratingDistribution },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
