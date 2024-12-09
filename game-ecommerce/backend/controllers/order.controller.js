const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Sales = require('../models/sales.model');
const ErrorResponse = require('../utils/errorHandler');
const asyncHandler = require('../middleware/async');
const productController = require('../controllers/product.controller');

const orderController = {
  // Get purchase history with pagination and sorting
  getPurchaseHistory: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || '-createdAt';

    const orders = await Order.find({ buyer: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name images price seller',
        populate: {
          path: 'seller',
          select: 'name email'
        }
      })
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments({ buyer: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
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

    await productController.updateProductStats(productId, orderItem.quantity, true);

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: order
    });
  }),

  // Create a new order
  createOrder: asyncHandler(async (req, res, next) => {
    const { items, paymentMethod, shippingInfo } = req.body;
    const userId = req.user._id;

    console.log('Creating order:', { items });

    // Validate items
    if (!items || !items.length) {
      return next(new ErrorResponse('No items provided', 400));
    }

    // Group items by seller for sales tracking
    const itemsBySeller = {};
    
    // Get product details and calculate total
    let totalAmount = 0;
    const orderItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findOne({ _id: item.product, status: 'active' })
        .populate('seller', '_id');
      
      if (!product) {
        throw new ErrorResponse(`Product ${item.product} not found or unavailable`, 404);
      }

      const price = product.onSale?.isOnSale ? product.onSale.salePrice : product.price;
      totalAmount += price * item.quantity;

      // Group by seller
      if (!itemsBySeller[product.seller._id]) {
        itemsBySeller[product.seller._id] = [];
      }
      itemsBySeller[product.seller._id].push({
        product: product._id,
        quantity: item.quantity,
        price,
        total: price * item.quantity,
        isDiscounted: product.onSale?.isOnSale || false
      });

      return {
        product: product._id,
        quantity: item.quantity,
        price,
        type: product.type === 'digital_game' ? 'DIGITAL' : 'PHYSICAL'
      };
    }));

    // Create order
    const order = await Order.create({
      buyer: userId,
      items: orderItems,
      totalAmount,
      paymentMethod,
      shippingInfo,
      status: 'PENDING'
    });

    console.log('Order created:', order._id);

    // Update sales data for each seller
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    await Promise.all(Object.entries(itemsBySeller).map(async ([sellerId, sellerItems]) => {
      // Find or create sales record
      let salesRecord = await Sales.findOne({
        seller: sellerId,
        year: currentYear,
        month: currentMonth
      });

      if (!salesRecord) {
        salesRecord = new Sales({
          seller: sellerId,
          year: currentYear,
          month: currentMonth,
          totalSales: 0,
          totalUnits: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          transactions: []
        });
      }

      // Update sales totals
      const sellerTotal = sellerItems.reduce((sum, item) => sum + item.total, 0);
      const sellerUnits = sellerItems.reduce((sum, item) => sum + item.quantity, 0);

      salesRecord.totalSales += sellerItems.length;
      salesRecord.totalUnits += sellerUnits;
      salesRecord.totalRevenue += sellerTotal;
      salesRecord.monthlyRevenue += sellerTotal;
      salesRecord.transactions.push(...sellerItems.map(item => ({
        ...item,
        date: currentDate
      })));

      await salesRecord.save();

      // Update product stats using the controller method
      await Promise.all(sellerItems.map(async (item) => {
        console.log(`Updating stats for product ${item.product} with quantity ${item.quantity}`);
        await productController.updateProductStats(item.product, item.quantity);
      }));
    }));

    res.status(201).json({
      success: true,
      data: order
    });
  })
};

module.exports = orderController; 