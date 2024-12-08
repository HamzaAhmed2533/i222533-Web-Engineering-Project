const Order = require('../models/order.model');
const Product = require('../models/product.model');
const ErrorResponse = require('../utils/errorHandler');
const asyncHandler = require('../middleware/async');

const orderController = {
  // Get purchase history with pagination and sorting
  getPurchaseHistory: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || 'orderDate';
    const order = req.query.order || 'desc';

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const orders = await Order.find({ buyer: req.user._id })
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'items.product',
        select: 'name images type category'
      })
      .populate({
        path: 'items.seller',
        select: 'name email'
      });

    const total = await Order.countDocuments({ buyer: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total
      }
    });
  }),

  // Get detailed order information
  getOrderDetails: asyncHandler(async (req, res, next) => {
    const order = await Order.findOne({
      _id: req.params.orderId,
      buyer: req.user._id
    }).populate({
      path: 'items.product',
      select: 'name description images price type category'
    }).populate({
      path: 'items.seller',
      select: 'name email'
    });

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    res.status(200).json({
      success: true,
      data: order
    });
  }),

  // Request refund for a product in an order
  requestRefund: asyncHandler(async (req, res, next) => {
    const { orderId, productId } = req.params;
    
    const order = await Order.findOne({
      _id: orderId,
      buyer: req.user._id
    });

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    const orderItem = order.items.find(
      item => item.product.toString() === productId
    );

    if (!orderItem) {
      return next(new ErrorResponse('Product not found in order', 404));
    }

    if (orderItem.status !== 'completed') {
      return next(new ErrorResponse('Refund already requested or processed', 400));
    }

    // Update the item status to refund_requested
    orderItem.status = 'refund_requested';
    await order.save();

    // Here you would typically create a refund request record
    // and notify the seller (to be implemented later)

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: order
    });
  }),

  // Create a new order
  createOrder: asyncHandler(async (req, res, next) => {
    const { items } = req.body;
    const userId = req.user._id;

    // Validate items
    if (!items || !items.length) {
      return next(new ErrorResponse('No items provided', 400));
    }

    // Get product details and calculate total
    let total = 0;
    const orderItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findOne({ _id: item.product, status: 'active' });
      if (!product) {
        throw new ErrorResponse(`Product ${item.product} not found or unavailable`, 404);
      }

      const price = product.onSale ? product.salePrice : product.price;
      total += price * item.quantity;

      return {
        product: product._id,
        quantity: item.quantity,
        price,
        type: product.type
      };
    }));

    // Create order
    const order = await Order.create({
      buyer: userId,
      items: orderItems,
      total,
      status: 'pending'
    });

    // Update product sales data
    await Promise.all(orderItems.map(async (item) => {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          'sales.total': item.quantity,
          'sales.revenue': item.price * item.quantity
        }
      });
    }));

    res.status(201).json({
      success: true,
      data: order
    });
  })
};

module.exports = orderController; 