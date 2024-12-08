const Order = require('../models/order.model');
const Product = require('../models/product.model');
const ErrorResponse = require('../utils/errorHandler');
const asyncHandler = require('../middleware/async');

// Export individual functions instead of an object
exports.getDashboardData = asyncHandler(async (req, res, next) => {
  try {
    console.log('Starting getDashboardData...');

    // Get featured/on sale products
    console.log('Fetching on sale products...');
    const onSaleProducts = await Product.find({
      status: 'active'
    })
    .limit(6)
    .select('name price images onSale type specifications');
    
    console.log(`Found ${onSaleProducts.length} on sale products`);

    // Get new releases (last 30 days)
    console.log('Fetching new releases...');
    const newReleases = await Product.find({
      status: 'active',
      type: { $in: ['digital_game', 'physical_game'] }
    })
    .sort({ 'specifications.releaseDate': -1 })
    .limit(6)
    .select('name price images onSale type specifications');

    console.log(`Found ${newReleases.length} new releases`);

    // Get best sellers
    console.log('Fetching best sellers...');
    const bestSellers = await Product.find({ 
      status: 'active'
    })
    .limit(6)
    .select('name price images onSale type specifications');

    console.log(`Found ${bestSellers.length} best sellers`);

    // Get featured games
    console.log('Fetching featured games...');
    const featuredGames = await Product.find({
      status: 'active',
      type: { $in: ['digital_game', 'physical_game'] }
    })
    .limit(6)
    .select('name price images onSale type specifications rating');

    console.log(`Found ${featuredGames.length} featured games`);

    // Get popular hardware
    console.log('Fetching popular hardware...');
    const popularHardware = await Product.find({
      status: 'active',
      type: { $in: ['console', 'peripheral'] }
    })
    .limit(6)
    .select('name price images onSale type specifications');

    console.log(`Found ${popularHardware.length} popular hardware items`);

    const responseData = {
      onSale: onSaleProducts,
      newReleases,
      bestSellers,
      featuredGames,
      popularHardware
    };

    console.log('Sending response...');
    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return next(new ErrorResponse('Error fetching dashboard data', 500));
  }
});

// Add other controller functions
exports.getRecentPurchases = asyncHandler(async (req, res, next) => {
  const purchases = await Order.find({ buyer: req.user._id })
    .sort({ orderDate: -1 })
    .limit(6)
    .populate({
      path: 'items.product',
      select: 'name price images onSale type'
    });

  res.status(200).json({
    success: true,
    data: purchases
  });
});

exports.getRecommendations = asyncHandler(async (req, res, next) => {
  const recommendations = await Product.find({
    status: 'active',
    type: { $in: ['digital_game', 'physical_game'] }
  })
  .limit(6)
  .select('name price images onSale type specifications');

  res.status(200).json({
    success: true,
    data: recommendations
  });
});

exports.getMyReviews = asyncHandler(async (req, res, next) => {
  const products = await Product.find({
    'ratings.user': req.user._id
  })
  .select('name ratings');

  const reviews = products.flatMap(product => 
    product.ratings
      .filter(rating => rating.user.toString() === req.user._id.toString())
      .map(rating => ({
        _id: rating._id,
        product: {
          _id: product._id,
          name: product.name
        },
        rating: rating.rating,
        review: rating.review,
        date: rating.date,
        platform: rating.platform
      }))
  );

  res.status(200).json({
    success: true,
    data: reviews
  });
});

exports.getLibrary = asyncHandler(async (req, res, next) => {
  try {
    // Get user's purchased games
    const orders = await Order.find({ 
      buyer: req.user._id,
      status: 'completed'
    })
    .populate({
      path: 'items.product',
      select: 'name images type specifications price onSale'
    });

    // Extract unique products from orders
    const libraryGames = orders.reduce((games, order) => {
      order.items.forEach(item => {
        if (item.product && !games.some(game => game._id.equals(item.product._id))) {
          games.push(item.product);
        }
      });
      return games;
    }, []);

    console.log(`Found ${libraryGames.length} games in library`);

    res.status(200).json({
      success: true,
      data: libraryGames
    });

  } catch (error) {
    console.error('Error fetching library:', error);
    return next(new ErrorResponse('Error fetching library', 500));
  }
});