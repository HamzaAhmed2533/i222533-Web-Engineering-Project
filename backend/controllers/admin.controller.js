const asyncHandler = require('express-async-handler');
const User = require('../models/user.model'); // Ensure this path is correct
const RefundRequest = require('../models/refundRequest.model'); // Ensure this path is correct
const { generateCSV } = require('../utils/csvGenerator');

// Get all users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json({ success: true, data: users });
});

// Delete user
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, message: 'User deleted successfully' });
});

// Get refuted refunds
exports.getRefutedRefunds = asyncHandler(async (req, res) => {
  const refunds = await RefundRequest.find({ status: 'disputed' });
  res.status(200).json({ success: true, data: refunds });
});

// Approve refund
exports.approveRefund = asyncHandler(async (req, res) => {
  const refund = await RefundRequest.findById(req.params.id);
  if (!refund) {
    return res.status(404).json({ success: false, message: 'Refund not found' });
  }
  refund.status = 'admin_accepted';
  await refund.save();
  res.status(200).json({ success: true, message: 'Refund approved' });
});

// Reject refund
exports.rejectRefund = asyncHandler(async (req, res) => {
  const refund = await RefundRequest.findById(req.params.id);
  if (!refund) {
    return res.status(404).json({ success: false, message: 'Refund not found' });
  }
  refund.status = 'admin_rejected';
  await refund.save();
  res.status(200).json({ success: true, message: 'Refund rejected' });
});

// Get user analytics
exports.getUserAnalytics = asyncHandler(async (req, res) => {
  // Implement user analytics logic here
  const analytics = {}; // Replace with actual analytics data
  res.status(200).json({ success: true, data: analytics });
});

// Get product analytics
exports.getProductAnalytics = asyncHandler(async (req, res) => {
  // Implement product analytics logic here
  const analytics = {}; // Replace with actual analytics data
  res.status(200).json({ success: true, data: analytics });
});

// Get refund reports
exports.getRefundReports = asyncHandler(async (req, res) => {
  // Implement refund report generation logic here
  const reports = {}; // Replace with actual reports data
  res.status(200).json({ success: true, data: reports });
});

// Export analytics to CSV
exports.exportAnalyticsToCSV = asyncHandler(async (req, res) => {
  const csvData = await generateCSV();
  res.header('Content-Type', 'text/csv');
  res.attachment('analytics.csv');
  res.send(csvData);
});