const Product = require('../models/product.model');
const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/errorHandler');
const asyncHandler = require('../middleware/async');
const sharp = require('sharp');
const Order = require('../models/order.model');

const productController = {
  // Create a new product
  createProduct: asyncHandler(async (req, res, next) => {
    try {
      let productData = req.body;
      console.log('Creating product with data:', productData);
      console.log('Files received:', req.files);

      // Parse specifications if it's a string
      if (typeof productData.specifications === 'string') {
        productData.specifications = JSON.parse(productData.specifications);
      }

      // Set default specifications based on product type
      if (productData.type === 'digital_game' || productData.type === 'physical_game') {
        productData.specifications = {
          platform: productData.specifications.platform || [],
          genre: productData.specifications.genre || [],
          releaseDate: productData.specifications.releaseDate || new Date(),
          brand: undefined,
          model: undefined
        };
      } else {
        productData.specifications = {
          platform: undefined,
          genre: undefined,
          releaseDate: undefined,
          brand: productData.specifications.brand || '',
          model: productData.specifications.model || ''
        };
      }

      // Handle image uploads
      const uploadedImages = [];
      if (req.files && req.files.images) {
        const images = Array.isArray(req.files.images) 
          ? req.files.images 
          : [req.files.images];

        console.log('Processing images:', images.length);

        for (const file of images) {
          try {
            const result = await handleImageUpload(file);
            uploadedImages.push(result);
            console.log('Image uploaded successfully:', result);
          } catch (error) {
            console.error('Failed to upload image:', error);
            // Continue with other images if one fails
          }
        }
      }

      const product = new Product({
        ...productData,
        seller: req.user._id,
        images: uploadedImages
      });

      await product.save();
      console.log('Product saved successfully:', product);

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Product creation error:', error);
      next(error);
    }
  }),

  // Get all products
  getProducts: asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      type,
      category,
      minPrice,
      maxPrice,
      search,
      seller
    } = req.query;

    const query = { status: 'active' };

    if (type) query.type = type;
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }
    if (seller) {
      query.seller = seller;
    }

    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('seller', 'name email');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  }),

  // Get single product
  getProduct: asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('ratings.user', 'name');

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Check if we need to reset monthly sales
    if (product.sales?.lastMonthUpdated) {
      const lastUpdate = new Date(product.sales.lastMonthUpdated);
      const currentDate = new Date();
      if (lastUpdate.getMonth() !== currentDate.getMonth() || 
          lastUpdate.getFullYear() !== currentDate.getFullYear()) {
        product.sales.lastMonth = 0;
        product.sales.lastMonthUpdated = currentDate;
        await product.save();
      }
    }

    // Recalculate rating average if needed
    if (product.ratings?.length > 0) {
      const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
      product.rating = {
        average: totalRating / product.ratings.length,
        count: product.ratings.length
      };
      await product.save();
    }

    res.status(200).json({
      success: true,
      data: product
    });
  }),

  // Update product
  updateProduct: asyncHandler(async (req, res, next) => {
    console.log('Update Product Request:', {
      id: req.params.id,
      body: req.body,
      files: req.files
    });

    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return next(new ErrorResponse('Product not found', 404));
      }

      // Check if user is the seller
      if (product.seller.toString() !== req.user._id.toString()) {
        return next(new ErrorResponse('Not authorized to update this product', 403));
      }

      // Parse specifications if it's a string
      if (typeof req.body.specifications === 'string') {
        req.body.specifications = JSON.parse(req.body.specifications);
      }

      // Handle image upload if there are new images
      if (req.files && req.files.images) {
        const images = Array.isArray(req.files.images) 
          ? req.files.images 
          : [req.files.images];

        const uploadedImages = [];
        for (const file of images) {
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'game-ecommerce/products'
          });
          uploadedImages.push({
            url: result.secure_url,
            public_id: result.public_id
          });
        }
        req.body.images = uploadedImages;
      }

      // Clean up any invalid data
      const updateData = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        type: req.body.type,
        category: req.body.category,
        specifications: req.body.specifications,
        stock: req.body.stock === 'null' ? null : req.body.stock,
        status: req.body.status
      };

      if (req.body.images) {
        updateData.images = req.body.images;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      console.log('Product updated successfully:', updatedProduct);

      res.status(200).json({
        success: true,
        data: updatedProduct
      });
    } catch (error) {
      console.error('Update product error:', error);
      next(error);
    }
  }),

  // Delete product
  deleteProduct: asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to delete this product', 403));
    }

    product.status = 'deleted';
    await product.save();

    res.status(200).json({
      success: true,
      data: null,
      message: 'Product deleted successfully'
    });
  }),

  // Get seller's products
  getSellerProducts: asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      type,
      category,
      minPrice,
      maxPrice,
      search,
      status = 'active'
    } = req.query;

    const query = { seller: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  }),

  getAllProducts: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const category = req.query.category;
    const type = req.query.type;
    
    let query = { status: 'active' };
    
    if (category) query.category = category;
    if (type) query.type = type;

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  }),

  getTopSellingProducts: asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const products = await Product.find({ status: 'active' })
      .sort({ 'sales.total': -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: products
    });
  }),

  getHighestRatedProducts: asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const products = await Product.find({ 
      status: 'active',
      'rating.count': { $gt: 0 } // Only products with ratings
    })
      .sort({ 'rating.average': -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: products
    });
  }),

  getPersonalizedRecommendations: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    // Get user's purchase history from Orders (not refunded)
    const orders = await Order.find({ 
      buyer: userId,
      'items.status': { $ne: 'refunded' }
    }).populate('items.product');

    if (!orders.length) {
      return res.status(200).json({
        success: true,
        data: {
          isPersonalized: false,
          message: "Make a purchase to get personalized recommendations!",
          products: []
        }
      });
    }

    // Extract products from orders and flatten the array
    const purchasedProducts = orders.flatMap(order => 
      order.items
        .filter(item => item.product && item.status !== 'refunded')
        .map(item => item.product)
    );

    // Get unique categories and types
    const purchasedCategories = [...new Set(purchasedProducts.map(p => p.category))];
    const purchasedTypes = [...new Set(purchasedProducts.map(p => p.type))];
    const purchasedIds = purchasedProducts.map(p => p._id);

    // Find recommendations
    const recommendations = await Product.find({
      status: 'active',
      $or: [
        { category: { $in: purchasedCategories } },
        { type: { $in: purchasedTypes } }
      ],
      _id: { $nin: purchasedIds } // Exclude already purchased products
    })
      .select('name description price images type category status onSale rating sales')
      .sort('-sales.total -rating.average')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        isPersonalized: true,
        message: "Recommendations based on your purchase history",
        categories: purchasedCategories,
        productTypes: purchasedTypes,
        products: recommendations
      }
    });
  }),

  searchProducts: asyncHandler(async (req, res) => {
    const { 
      query, 
      category, 
      type, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    let queryObj = { status: 'active' };

    // Search by name or description
    if (query) {
      queryObj.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Apply filters
    if (category) queryObj.category = category;
    if (type) queryObj.type = type;
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = parseFloat(minPrice);
      if (maxPrice) queryObj.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price':
        sortObj.price = order === 'desc' ? -1 : 1;
        break;
      case 'rating':
        sortObj['rating.average'] = order === 'desc' ? -1 : 1;
        break;
      case 'sales':
        sortObj['sales.total'] = order === 'desc' ? -1 : 1;
        break;
      default:
        sortObj.createdAt = order === 'desc' ? -1 : 1;
    }

    const products = await Product.find(queryObj)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Product.countDocuments(queryObj);

    res.status(200).json({
      success: true,
      data: {
        products,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  }),

  // Rate a product
  rateProduct: asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const { rating, review, platform } = req.body;
    
    console.log('Rating attempt:', {
      productId,
      userId: req.user._id,
      rating,
      review,
      platform
    });

    // Get product and check if it exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    // Verify purchase with less restrictive query
    const order = await Order.findOne({
      buyer: req.user._id,
      'items.product': productId,
      status: { $ne: 'CANCELLED' } // Only check if order is not cancelled
    });

    if (!order) {
      return next(new ErrorResponse('You can only rate products you have purchased', 403));
    }

    // Check for existing rating
    const existingRating = product.ratings?.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingRating) {
      return next(new ErrorResponse('You have already rated this product', 400));
    }

    // Create rating object
    const newRating = {
      user: req.user._id,
      rating,
      review: review || '',
      platform: platform || undefined,
      date: new Date()
    };

    // Initialize ratings array if it doesn't exist
    if (!product.ratings) {
      product.ratings = [];
    }

    // Add the new rating
    product.ratings.push(newRating);

    // Update average rating
    const totalRatings = product.ratings.length;
    const ratingSum = product.ratings.reduce((sum, r) => sum + r.rating, 0);
    
    if (!product.rating) {
      product.rating = {};
    }
    
    product.rating.average = ratingSum / totalRatings;
    product.rating.count = totalRatings;

    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });
  }),

  // Get product ratings
  getProductRatings: asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const product = await Product.findById(productId)
      .select('ratings')
      .populate('ratings.user', 'name');

    const ratings = product.ratings || [];
    const paginatedRatings = ratings
      .slice((page - 1) * limit, page * limit);

    res.status(200).json({
      success: true,
      data: {
        ratings: paginatedRatings,
        currentPage: page,
        totalPages: Math.ceil(ratings.length / limit),
        totalRatings: ratings.length
      }
    });
  }),

  // Get user's ratings
  getMyRatings: asyncHandler(async (req, res) => {
    const products = await Product.find({
      'ratings.user': req.user._id
    }).select('name images ratings');

    const myRatings = products.map(product => ({
      product: {
        _id: product._id,
        name: product.name,
        images: product.images
      },
      rating: product.ratings.find(r => r.user.toString() === req.user._id.toString())
    }));

    res.status(200).json({
      success: true,
      data: myRatings
    });
  }),

  // Update rating
  updateRating: asyncHandler(async (req, res, next) => {
    const { ratingId } = req.params;
    const { rating, review } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return next(new ErrorResponse('Please provide a valid rating between 1 and 5', 400));
    }

    const product = await Product.findOneAndUpdate(
      {
        'ratings._id': ratingId,
        'ratings.user': req.user._id
      },
      {
        $set: {
          'ratings.$.rating': rating,
          'ratings.$.review': review,
          'ratings.$.date': new Date()
        }
      },
      { new: true }
    );

    if (!product) {
      return next(new ErrorResponse('Rating not found or unauthorized', 404));
    }

    // Update average rating
    const ratings = product.ratings || [];
    const averageRating = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;

    product.rating.average = averageRating;
    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });
  }),

  // Delete rating
  deleteRating: asyncHandler(async (req, res, next) => {
    const { ratingId } = req.params;

    const product = await Product.findOneAndUpdate(
      {
        'ratings._id': ratingId,
        'ratings.user': req.user._id
      },
      {
        $pull: { ratings: { _id: ratingId } }
      },
      { new: true }
    );

    if (!product) {
      return next(new ErrorResponse('Rating not found or unauthorized', 404));
    }

    // Update average rating
    const ratings = product.ratings || [];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
      : 0;

    product.rating.average = averageRating;
    product.rating.count = ratings.length;
    await product.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  }),

  getOnSaleProducts: asyncHandler(async (req, res) => {
    const products = await Product.find({
      'onSale.isOnSale': true,
      status: 'active'
    })
    .limit(6)
    .select('name price images onSale type');

    res.status(200).json({
      success: true,
      data: products
    });
  }),

  getNewReleases: asyncHandler(async (req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await Product.find({
      'specifications.releaseDate': { $gte: thirtyDaysAgo },
      status: 'active',
      $or: [
        { type: 'digital_game' },
        { type: 'physical_game' }
      ]
    })
    .limit(6)
    .select('name price images onSale type');

    res.status(200).json({
      success: true,
      data: products
    });
  }),

  getBestSellers: asyncHandler(async (req, res) => {
    const products = await Product.find({ status: 'active' })
      .sort({ 'sales.total': -1 })
      .limit(6)
      .select('name price images onSale type');

    res.status(200).json({
      success: true,
      data: products
    });
  }),

  getAllProducts: asyncHandler(async (req, res, next) => {
    try {
        // Get all active products (not deleted)
        const products = await Product.find({ 
            status: { $ne: 'deleted' } 
        }).populate('seller', 'name email');

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get All Products Error:', error);
        return next(new ErrorResponse('Failed to fetch products', 500));
    }
  }),

  // Update product stock and sales
  updateProductStats: asyncHandler(async (productId, quantity, isRefund = false) => {
    console.log('Updating product stats:', { productId, quantity, isRefund });

    // Get the product first to check current state
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    console.log('Current product state:', {
      id: product._id,
      stock: product.stock,
      sales: product.sales
    });

    // Initialize sales if not present
    if (!product.sales) {
      product.sales = {
        total: 0,
        lastMonth: 0,
        lastMonthUpdated: new Date()
      };
    }

    // Calculate new values
    const multiplier = isRefund ? -1 : 1;
    const newTotal = (product.sales.total || 0) + (multiplier * quantity);
    const newLastMonth = (product.sales.lastMonth || 0) + (multiplier * quantity);
    const newStock = product.stock - (isRefund ? -quantity : quantity);

    // Update product with new values
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          stock: newStock,
          sales: {
            total: newTotal,
            lastMonth: newLastMonth,
            lastMonthUpdated: new Date()
          }
        }
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    console.log('Updated product state:', {
      id: updatedProduct._id,
      stock: updatedProduct.stock,
      sales: updatedProduct.sales
    });

    return updatedProduct;
  }),

  // Reset monthly sales (should be called by a cron job)
  resetMonthlySales: asyncHandler(async () => {
    const currentDate = new Date();
    
    await Product.updateMany(
      {},
      {
        $set: {
          'sales.lastMonth': 0,
          'sales.lastMonthUpdated': currentDate
        }
      }
    );
  })
};

module.exports = productController;