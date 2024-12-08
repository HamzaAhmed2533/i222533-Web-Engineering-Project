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

      // Handle image uploads with optimization
      const uploadedImages = [];
      if (req.files && req.files.images) {
        const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        
        for (const file of images) {
          // Optimize image before upload
          const optimizedImageBuffer = await sharp(file.tempFilePath)
            .resize(1200, 1200, { // Max dimensions
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
            .toBuffer();

          // Upload optimized image to Cloudinary
          const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`, {
            folder: 'game-ecommerce/products',
            resource_type: 'auto'
          });
          
          uploadedImages.push({
            url: result.secure_url,
            public_id: result.public_id
          });
        }
      }

      const product = new Product({
        ...productData,
        seller: req.user._id,
        images: uploadedImages
      });

      await product.save();
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

    res.status(200).json({
      success: true,
      data: product
    });
  }),

  // Update product
  updateProduct: asyncHandler(async (req, res, next) => {
    try {
      let productData = req.body;
      
      // Parse specifications if it's a string
      if (typeof productData.specifications === 'string') {
        productData.specifications = JSON.parse(productData.specifications);
      }

      // Set specifications based on product type
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

      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorResponse('Product not found', 404));
      }

      if (product.seller.toString() !== req.user._id.toString()) {
        return next(new ErrorResponse('Not authorized to update this product', 403));
      }

      // Handle image uploads with optimization
      if (req.files && req.files.images) {
        // Delete old images from Cloudinary
        for (const image of product.images) {
          if (image.public_id) {
            await cloudinary.uploader.destroy(image.public_id);
          }
        }

        const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        const uploadedImages = [];
        
        for (const file of images) {
          // Optimize image before upload
          const optimizedImageBuffer = await sharp(file.tempFilePath)
            .resize(1200, 1200, { // Max dimensions
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
            .toBuffer();

          // Upload optimized image to Cloudinary
          const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`, {
            folder: 'game-ecommerce/products',
            resource_type: 'auto'
          });
          
          uploadedImages.push({
            url: result.secure_url,
            public_id: result.public_id
          });
        }
        productData.images = uploadedImages;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        productData,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        data: updatedProduct
      });
    } catch (error) {
      console.error('Product update error:', error);
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

    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return next(new ErrorResponse('Please provide a valid rating between 1 and 5', 400));
    }

    // Get product and check if it exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    // Check if platform is provided for games
    if ((product.type === 'digital_game' || product.type === 'physical_game') && !platform) {
      return next(new ErrorResponse('Platform is required for games', 400));
    }

    // Verify purchase
    const order = await Order.findOne({
      buyer: req.user._id,
      'items.product': productId,
      'items.status': 'completed'
    });

    if (!order) {
      return next(new ErrorResponse('You can only rate products you have purchased', 403));
    }

    // Check for existing rating
    const existingRating = await Product.findOne({
      _id: productId,
      'ratings.user': req.user._id
    });

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

    // Get current ratings and calculate new average
    const currentRatings = product.ratings || [];
    const newRatings = [...currentRatings, newRating];
    const totalRatings = newRatings.length;
    const ratingSum = newRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = ratingSum / totalRatings;

    // Update product using two separate fields
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      {
        $push: { ratings: newRating },
        rating: {
          average: averageRating,
          count: totalRatings
        }
      },
      { 
        new: true,
        runValidators: false
      }
    );

    res.status(200).json({
      success: true,
      data: updatedProduct
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
  })
};

module.exports = productController;