const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const ErrorResponse = require('../utils/errorHandler');
const asyncHandler = require('../middleware/async');
const Sales = require('../models/sales.model');
const Order = require('../models/order.model');


const cartController = {
  // Get user's cart
  getCart: asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price images type category status stock'
      });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
        totalAmount: 0
      });
    } else if (cart.items.length === 0) {
      cart.totalAmount = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  }),

  // Add product to cart
  addToCart: asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    // Check if product exists and is active
    const product = await Product.findOne({ _id: productId, status: 'active' });
    if (!product) {
      return next(new ErrorResponse('Product not found or inactive', 404));
    }

    // Only check stock for physical products
    if (product.type !== 'digital_game' && quantity > product.stock) {
      return next(new ErrorResponse(
        `Insufficient stock. Requested: ${quantity}, Available: ${product.stock}`,
        400
      ));
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
        totalAmount: 0
      });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      // For physical products, check stock
      if (product.type !== 'digital_game') {
        const newQuantity = existingItem.quantity + parseInt(quantity);
        if (newQuantity > product.stock) {
          return next(new ErrorResponse(
            `Cannot add ${quantity} more units. Current cart: ${existingItem.quantity}, Available stock: ${product.stock}`,
            400
          ));
        }
      }
      existingItem.quantity = existingItem.quantity + parseInt(quantity);
    } else {
      cart.items.push({
        product: productId,
        quantity: parseInt(quantity)
      });
    }

    // Calculate total amount with proper error handling
    let totalAmount = 0;
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const price = product.onSale && product.salePrice ? product.salePrice : product.price;
        const itemTotal = price * parseInt(item.quantity);
        if (!isNaN(itemTotal)) {
          totalAmount += itemTotal;
        }
      }
    }

    // Ensure totalAmount is a valid number
    cart.totalAmount = totalAmount || 0;

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price images type category status stock onSale salePrice'
    });

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      data: cart
    });
  }),

  // Remove product from cart
  removeFromCart: asyncHandler(async (req, res, next) => {
    const { productId } = req.params;

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { 
        $pull: { 
          items: { 
            product: productId 
          } 
        } 
      },
      { new: true }
    ).populate({
      path: 'items.product',
      select: 'name price images type category status'
    });

    if (!cart) {
      return next(new ErrorResponse('Cart not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      data: cart
    });
  }),

  // Update quantity
  updateQuantity: asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return next(new ErrorResponse('Invalid quantity', 400));
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', 404));
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      return next(new ErrorResponse('Product not found in cart', 404));
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price images type category status'
    });

    res.status(200).json({
      success: true,
      message: 'Quantity updated',
      data: cart
    });
  }),

  // Clear cart
  clearCart: asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { 
        items: [], 
        totalAmount: 0
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!cart) {
      return next(new ErrorResponse('Cart not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  }),

  // Checkout process
  checkout: asyncHandler(async (req, res, next) => {
    const { 
      paymentMethod,
      deliveryAddress,
      cardDetails
    } = req.body;

    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price images type category status stock seller sales'
      });

    if (!cart || cart.items.length === 0) {
      return next(new ErrorResponse('Cart is empty', 400));
    }

    // Check if cart has any physical products
    const hasPhysicalItems = cart.items.some(
      item => item.product.type !== 'digital_game'
    );

    // Validate payment method and delivery address
    if (hasPhysicalItems) {
      if (!['card', 'cash_on_delivery'].includes(paymentMethod)) {
        return next(new ErrorResponse('Invalid payment method for physical products', 400));
      }
      if (!deliveryAddress) {
        return next(new ErrorResponse('Delivery address required for physical items', 400));
      }
    } else {
      if (paymentMethod !== 'card') {
        return next(new ErrorResponse('Digital products can only be purchased with card payment', 400));
      }
    }

    // Check stock availability for physical items only
    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        return next(new ErrorResponse('One or more products not found', 404));
      }
      if (product.type !== 'digital_game' && product.stock < item.quantity) {
        return next(new ErrorResponse(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          400
        ));
      }
    }

    try {
      const paymentSuccessful = true; // Placeholder for payment processing

      if (paymentSuccessful) {
        // Transform cart items to order items with correct type format
        const orderItems = cart.items.map(item => {
          // Safely get the price with fallback
          let itemPrice = 0;
          if (item.product.onSale && typeof item.product.salePrice === 'number') {
            itemPrice = item.product.salePrice;
          } else if (typeof item.product.price === 'number') {
            itemPrice = item.product.price;
          }

          console.log('Product:', item.product.name, 'Raw Price:', item.product.price, 'Sale Price:', item.product.salePrice, 'Final Price:', itemPrice);

          return {
            product: item.product._id,
            quantity: item.quantity,
            price: itemPrice,
            type: item.product.type === 'digital_game' ? 'DIGITAL' : 'PHYSICAL'
          };
        });

        // Debug log the entire orderItems array
        console.log('OrderItems:', JSON.stringify(orderItems, null, 2));

        // Create the order with all required fields
        const order = await Order.create({
          buyer: req.user._id,
          items: orderItems,
          totalAmount: cart.totalAmount,
          paymentMethod: paymentMethod.toUpperCase(),
          shippingInfo: {
            fullName: deliveryAddress?.fullName,
            email: deliveryAddress?.email,
            address: deliveryAddress?.address,
            city: deliveryAddress?.city,
            postalCode: deliveryAddress?.postalCode,
            country: deliveryAddress?.country
          }
        });

        // Update inventory, sales data, and handle digital delivery
        const updates = cart.items.map(async (item) => {
          const product = item.product;
          
          // Update product stock for physical items
          if (product.type !== 'digital_game') {
            await Product.updateOne(
              { _id: product._id },
              { $inc: { stock: -item.quantity } }
            );
          }

          // Calculate the actual price safely
          const actualPrice = product.onSale && typeof product.salePrice === 'number' 
            ? product.salePrice 
            : (typeof product.price === 'number' ? product.price : 0);

          const total = item.quantity * actualPrice;
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth() + 1;

          // Create transaction object
          const transaction = {
            product: product._id,
            quantity: item.quantity,
            price: actualPrice,
            total: total,
            date: today,
            isDiscounted: Boolean(product.onSale)
          };

          // Update current month's sales
          await Sales.findOneAndUpdate(
            { 
              seller: product.seller,
              year: currentYear,
              month: currentMonth
            },
            {
              $inc: {
                totalSales: total,
                totalUnits: item.quantity,
                totalRevenue: total,
                monthlyRevenue: total
              },
              $push: {
                transactions: transaction
              }
            },
            { upsert: true, new: true }
          );

          // Update last month's data for comparison
          const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
          const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

          await Sales.findOneAndUpdate(
            {
              seller: product.seller,
              year: lastMonthYear,
              month: lastMonth
            },
            {
              $setOnInsert: {
                totalSales: 0,
                totalUnits: 0,
                totalRevenue: 0,
                monthlyRevenue: 0
              }
            },
            { upsert: true, new: true }
          );
        });

        await Promise.all(updates);

        // Clear cart
        await Cart.findOneAndUpdate(
          { user: req.user._id },
          { items: [], totalAmount: 0 },
          { new: true }
        );

        res.status(200).json({
          success: true,
          message: 'Checkout successful',
          data: {
            order,
            digitalItems: cart.items
              .filter(item => item.product.type === 'digital_game')
              .map(item => ({
                name: item.product.name,
                downloadLink: item.product.downloadLink
              }))
          }
        });
      } else {
        return next(new ErrorResponse('Payment processing failed', 400));
      }
    } catch (error) {
      console.error('Checkout error details:', error);
      return next(new ErrorResponse(error.message || 'Checkout process failed', 500));
    }
  })
};

module.exports = cartController; 