const RefundRequest = require('../models/refundRequest.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const ErrorResponse = require('../utils/errorHandler');
const asyncHandler = require('../middleware/async');

const refundController = {
  // Create refund request
  createRefundRequest: asyncHandler(async (req, res, next) => {
    const { orderId, productId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return next(new ErrorResponse('Refund reason is required', 400));
    }

    // Find order and validate ownership
    const order = await Order.findOne({
      _id: orderId,
      buyer: req.user._id
    }).populate('items.product');

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    // Find the specific product in the order
    const orderItem = order.items.find(
      item => item.product._id.toString() === productId
    );

    if (!orderItem) {
      return next(new ErrorResponse('Product not found in order', 404));
    }

    if (orderItem.status !== 'completed') {
      return next(new ErrorResponse('This item is not eligible for refund', 400));
    }

    const product = orderItem.product;
    const purchaseDate = order.orderDate;
    const currentTime = new Date();
    const timeDifference = currentTime - purchaseDate;

    // Check refund time eligibility
    if (product.type === 'digital_game') {
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      if (timeDifference > sixHoursInMs) {
        orderItem.status = 'refund_rejected';
        await order.save();
        return next(new ErrorResponse('Refund time limit exceeded for digital game (6 hours)', 400));
      }
    } else {
      const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
      if (timeDifference > oneWeekInMs) {
        orderItem.status = 'refund_rejected';
        await order.save();
        return next(new ErrorResponse('Refund time limit exceeded for physical product (1 week)', 400));
      }
    }

    // Create refund request
    const refundRequest = await RefundRequest.create({
      order: orderId,
      product: productId,
      buyer: req.user._id,
      seller: orderItem.seller,
      reason,
      refundAmount: orderItem.price * orderItem.quantity,
      productType: product.type,
      purchaseDate
    });

    // Auto-accept for digital games
    if (product.type === 'digital_game') {
      refundRequest.status = 'auto_accepted';
      orderItem.status = 'refunded';
      await Promise.all([refundRequest.save(), order.save()]);

      // Here you would typically process the actual refund
      // and update any necessary inventory/sales records

      return res.status(200).json({
        success: true,
        message: 'Digital game refund automatically approved',
        data: refundRequest
      });
    }

    // For physical products
    orderItem.status = 'refund_requested';
    await Promise.all([order.save(), refundRequest.save()]);

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: refundRequest
    });
  }),

  // Get buyer's refund requests
  getBuyerRefundRequests: asyncHandler(async (req, res) => {
    const requests = await RefundRequest.find({ buyer: req.user._id })
      .populate('product', 'name images')
      .populate('seller', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: requests
    });
  }),

  // Get seller's refund requests
  getSellerRefundRequests: asyncHandler(async (req, res) => {
    const requests = await RefundRequest.find({ 
      seller: req.user._id,
      status: 'pending'
    })
      .populate('product', 'name images')
      .populate('buyer', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: requests
    });
  }),

  // Seller response to refund
  respondToRefund: asyncHandler(async (req, res, next) => {
    const { requestId } = req.params;
    const { action, reason } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return next(new ErrorResponse('Invalid action', 400));
    }

    if (action === 'reject' && !reason) {
      return next(new ErrorResponse('Reason required for rejection', 400));
    }

    const refundRequest = await RefundRequest.findOne({
      _id: requestId,
      seller: req.user._id,
      status: 'pending'
    });

    if (!refundRequest) {
      return next(new ErrorResponse('Refund request not found', 404));
    }

    const order = await Order.findById(refundRequest.order);
    const orderItem = order.items.find(
      item => item.product.toString() === refundRequest.product.toString()
    );

    if (action === 'accept') {
      refundRequest.status = 'seller_accepted';
      orderItem.status = 'refunded';
      // Here you would process the actual refund
    } else {
      refundRequest.status = 'seller_rejected';
      refundRequest.sellerResponse = {
        reason,
        date: new Date()
      };
      orderItem.status = 'completed';
    }

    await Promise.all([refundRequest.save(), order.save()]);

    res.status(200).json({
      success: true,
      message: `Refund ${action}ed successfully`,
      data: refundRequest
    });
  }),

  // Buyer disputes refund rejection
  disputeRefund: asyncHandler(async (req, res, next) => {
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return next(new ErrorResponse('Dispute reason is required', 400));
    }

    const refundRequest = await RefundRequest.findOne({
      _id: requestId,
      buyer: req.user._id,
      status: 'seller_rejected'
    });

    if (!refundRequest) {
      return next(new ErrorResponse('Refund request not found or not eligible for dispute', 404));
    }

    refundRequest.status = 'disputed';
    refundRequest.disputeDetails = {
      reason,
      date: new Date(),
      status: 'pending'
    };

    await refundRequest.save();

    res.status(200).json({
      success: true,
      message: 'Dispute submitted successfully',
      data: refundRequest
    });
  })
};

module.exports = refundController; 