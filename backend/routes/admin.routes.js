const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes and authorize only admin
router.use(protect);
router.use(authorize('admin'));

// Admin routes
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/refunds', adminController.getRefutedRefunds);
router.post('/refunds/:id/approve', adminController.approveRefund);
router.post('/refunds/:id/reject', adminController.rejectRefund);
router.get('/user-analytics', adminController.getUserAnalytics);
router.get('/product-analytics', adminController.getProductAnalytics);
router.get('/refund-reports', adminController.getRefundReports);
router.get('/export-csv', adminController.exportAnalyticsToCSV);

module.exports = router;