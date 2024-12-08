const Wishlist = require('../models/wishlist.model');
const Product = require('../models/product.model');
const ErrorResponse = require('../utils/errorHandler');
const asyncHandler = require('../middleware/async');

const wishlistController = {
  // Get user's wishlist
  getWishlist: asyncHandler(async (req, res) => {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products.product',
        select: 'name price images status onSale type category'
      });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: []
      });
    }

    res.status(200).json({
      success: true,
      data: wishlist
    });
  }),

  // Add product to wishlist
  addToWishlist: asyncHandler(async (req, res, next) => {
    const { productId } = req.params;

    // Check if product exists and is active
    const product = await Product.findOne({ _id: productId, status: 'active' });
    if (!product) {
      return next(new ErrorResponse('Product not found or inactive', 404));
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: []
      });
    }

    // Check if product already in wishlist
    if (wishlist.products.some(item => item.product.toString() === productId)) {
      return next(new ErrorResponse('Product already in wishlist', 400));
    }

    // Add product to wishlist
    wishlist.products.push({
      product: productId,
      addedAt: Date.now(),
      notifyOnSale: true
    });

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlist
    });
  }),

  // Remove product from wishlist
  removeFromWishlist: asyncHandler(async (req, res, next) => {
    const { productId } = req.params;

    // Find the wishlist and update it by pulling the product
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { 
        $pull: { 
          products: { 
            product: productId 
          } 
        } 
      },
      { new: true } // Return the updated document
    ).populate({
      path: 'products.product',
      select: 'name price images status onSale type category'
    });

    if (!wishlist) {
      return next(new ErrorResponse('Wishlist not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: wishlist
    });
  }),

  // Toggle notification for product
  toggleNotification: asyncHandler(async (req, res, next) => {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return next(new ErrorResponse('Wishlist not found', 404));
    }

    const productItem = wishlist.products.find(
      item => item.product.toString() === productId
    );

    if (!productItem) {
      return next(new ErrorResponse('Product not found in wishlist', 404));
    }

    // Toggle notification
    productItem.notifyOnSale = !productItem.notifyOnSale;
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: `Notifications ${productItem.notifyOnSale ? 'enabled' : 'disabled'} for product`,
      data: wishlist
    });
  })
};

module.exports = wishlistController; 