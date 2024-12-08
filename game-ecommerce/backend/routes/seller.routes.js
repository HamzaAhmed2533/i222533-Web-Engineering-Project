const express = require('express');
const router = express.Router();
const { protect, isSeller } = require('../middleware/auth');
const { getSellerStats, getSellerAnalytics } = require('../controllers/seller.controller');
const { getSellerProducts } = require('../controllers/product.controller');

// Apply middleware
router.use(protect);
router.use(isSeller);

// Stats routes
router.get('/stats', getSellerStats);
router.get('/analytics', getSellerAnalytics);

// Products routes
router.get('/products', getSellerProducts);

module.exports = router;