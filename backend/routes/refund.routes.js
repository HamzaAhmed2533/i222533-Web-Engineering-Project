const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refund.controller');
const { protect, authorize } = require('../middleware/auth');

// Buyer routes
router.post('/request/:orderId/:productId', protect, authorize('buyer'), refundController.createRefundRequest);
router.get('/my-requests', protect, authorize('buyer'), refundController.getBuyerRefundRequests);
router.post('/dispute/:requestId', protect, authorize('buyer'), refundController.disputeRefund);

// Seller routes
router.get('/seller-requests', protect, authorize('seller'), refundController.getSellerRefundRequests);
router.post('/respond/:requestId', protect, authorize('seller'), refundController.respondToRefund);

module.exports = router; 