const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardData,
  getLibrary,
  getRecentPurchases,
  getRecommendations,
  getMyReviews
} = require('../controllers/buyer.controller');

// Public route
router.get('/dashboard', getDashboardData);

// Protected routes
router.get('/library', protect, getLibrary);
router.get('/recent-purchases', protect, getRecentPurchases);
router.get('/recommendations', protect, getRecommendations);
router.get('/my-reviews', protect, getMyReviews);

module.exports = router; 