const Order = require('../models/order.model');
const Product = require('../models/product.model');
const asyncHandler = require('../middleware/async');

const analyticsController = {
  getSellerAnalytics: asyncHandler(async (req, res) => {
    const sellerId = req.user._id;
    
    // Get all seller's products
    const products = await Product.find({ seller: sellerId });
    const productIds = products.map(p => p._id);

    // Get orders containing seller's products
    const orders = await Order.find({
      'items.product': { $in: productIds },
      status: { $ne: 'CANCELLED' }
    });

    // Calculate product performance
    const productPerformance = await Product.aggregate([
      {
        $match: { seller: sellerId }
      },
      {
        $project: {
          name: 1,
          unitsSold: { $ifNull: ['$sales.total', 0] },
          revenue: {
            $multiply: [
              { $ifNull: ['$sales.total', 0] },
              '$price'
            ]
          }
        }
      },
      {
        $sort: { unitsSold: -1 }
      },
      {
        $limit: 10 // Top 10 products
      }
    ]);

    // Calculate category distribution
    const categoryDistribution = await Product.aggregate([
      {
        $match: { seller: sellerId }
      },
      {
        $group: {
          _id: '$category',
          totalSales: { 
            $sum: { $ifNull: ['$sales.total', 0] }
          }
        }
      }
    ]);

    // Convert array to object
    const categoryData = categoryDistribution.reduce((acc, cat) => {
      acc[cat._id] = cat.totalSales;
      return acc;
    }, {});

    // Calculate monthly sales
    const monthlySales = await Order.aggregate([
      {
        $match: {
          'items.product': { $in: productIds },
          status: { $ne: 'CANCELLED' }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.product': { $in: productIds }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          units: { $sum: '$items.quantity' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format monthly sales
    const formattedMonthlySales = monthlySales.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      revenue: item.revenue,
      units: item.units
    }));

    // Calculate revenue stats
    const totalRevenue = formattedMonthlySales.reduce((sum, month) => sum + month.revenue, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate monthly growth
    const monthlyGrowth = formattedMonthlySales.length >= 2 
      ? ((formattedMonthlySales[formattedMonthlySales.length - 1].revenue - 
          formattedMonthlySales[formattedMonthlySales.length - 2].revenue) / 
          formattedMonthlySales[formattedMonthlySales.length - 2].revenue * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        monthlySales: formattedMonthlySales,
        productPerformance,
        categoryDistribution: categoryData,
        revenueStats: {
          totalRevenue,
          averageOrderValue,
          monthlyGrowth
        }
      }
    });
  })
};

module.exports = analyticsController; 