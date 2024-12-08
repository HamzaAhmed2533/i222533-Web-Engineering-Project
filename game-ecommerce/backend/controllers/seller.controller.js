const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Sales = require('../models/sales.model');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorHandler');

exports.getSellerStats = asyncHandler(async (req, res, next) => {
    try {
        const sellerId = new mongoose.Types.ObjectId(req.user._id);
        
        // Debug log
        console.log('Fetching stats for seller:', sellerId);

        // Get total products (excluding deleted)
        const totalProducts = await Product.countDocuments({ 
            seller: sellerId,
            status: { $ne: 'deleted' }
        });

        console.log('Total products:', totalProducts);

        // Get all sales data for this seller - simplified query first
        const salesData = await Sales.find({ seller: sellerId });
        
        console.log('Sales data found:', salesData);

        // Calculate totals manually instead of using aggregation
        let totalUnitsSold = 0;
        let totalMoneyEarned = 0;

        salesData.forEach(sale => {
            totalUnitsSold += sale.totalUnits || 0;
            totalMoneyEarned += sale.totalRevenue || 0;
        });

        // Get product type distribution
        const productTypes = await Product.aggregate([
            {
                $match: {
                    seller: sellerId,
                    status: { $ne: 'deleted' }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = {
            totalProducts,
            totalRevenue: totalUnitsSold || 0,                 // Number of units sold
            totalSales: totalMoneyEarned?.toFixed(2) || 0,    // Money earned
            currentMonthSales: 0,  // We'll add these back once basic stats work
            currentMonthRevenue: 0,
            lastMonthSales: 0,
            lastMonthRevenue: 0,
            productTypes: productTypes.reduce((acc, type) => {
                acc[type._id] = type.count;
                return acc;
            }, {})
        };

        console.log('Final stats:', stats);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Seller Stats Error:', error);
        return next(new ErrorResponse('Failed to fetch seller statistics', 500));
    }
});

exports.getSellerAnalytics = asyncHandler(async (req, res, next) => {
    try {
        const sellerId = new mongoose.Types.ObjectId(req.user._id);
        
        // Return placeholder data for now
        res.status(200).json({
            success: true,
            data: {
                monthlySales: [],
                productPerformance: [],
                categoryDistribution: {},
                revenueStats: {
                    totalRevenue: 0,
                    averageOrderValue: 0,
                    monthlyGrowth: 0
                }
            }
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        return next(new ErrorResponse('Failed to fetch analytics data', 500));
    }
});