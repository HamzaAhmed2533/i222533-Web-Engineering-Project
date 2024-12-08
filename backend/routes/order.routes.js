const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');

// Order routes
router.post('/create', protect, orderController.createOrder);
router.get('/history', protect, orderController.getPurchaseHistory);
router.get('/details/:orderId', protect, orderController.getOrderDetails);
router.post('/refund/:orderId/:productId', protect, orderController.requestRefund);

module.exports = router; 