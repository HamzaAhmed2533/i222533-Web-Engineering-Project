const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSellerAnalytics } = require('../controllers/analytics.controller');

router.get('/', protect, authorize('seller'), getSellerAnalytics);

module.exports = router; 