const express = require('express');
const router = express.Router();
const { protect, isSeller } = require('../middleware/auth');
const { getSellerStats } = require('../controllers/seller.controller');

// Apply both protect and isSeller middleware to all routes
router.use(protect);
router.use(isSeller);

router.get('/stats', getSellerStats);

module.exports = router; 