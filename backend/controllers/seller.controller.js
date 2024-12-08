const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Sales = require('../models/sales.model');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorHandler');

exports.getSellerStats = asyncHandler(async (req, res, next) => {
    try {
        const sellerId = new mongoose.Types.ObjectId(req.user._id);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // Calculate last month's date
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        console.log('Fetching stats for seller:', {
            sellerId,
            currentMonth,
            currentYear,
            lastMonth,
            lastMonthYear
        });

        // Get total products (excluding deleted)
        const totalProducts = await Product.countDocuments({ 
            seller: sellerId,
            status: { $ne: 'deleted' }
        });

        // Get current month's sales
        const currentMonthSales = await Sales.findOne({
            seller: sellerId,
            year: currentYear,
            month: currentMonth
        });

        // Get last month's sales
        const lastMonthSales = await Sales.findOne({
            seller: sellerId,
            year: lastMonthYear,
            month: lastMonth
        });

        // Get all-time sales totals
        const allTimeSales = await Sales.aggregate([
            {
                $match: { seller: sellerId }
            },
            {
                $group: {
                    _id: null,
                    totalUnits: { $sum: '$totalUnits' },
                    totalRevenue: { $sum: '$totalRevenue' }
                }
            }
        ]);

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

        // Get best selling products
        const bestSellers = await Product.find({
            seller: sellerId,
            status: { $ne: 'deleted' }
        })
        .sort({ 'sales.total': -1 })
        .limit(5)
        .select('name type sales');

        const stats = {
            totalProducts,
            totalRevenue: allTimeSales[0]?.totalRevenue?.toFixed(2) || 0,
            totalSales: allTimeSales[0]?.totalUnits || 0,
            currentMonthSales: currentMonthSales?.totalUnits || 0,
            currentMonthRevenue: currentMonthSales?.totalRevenue?.toFixed(2) || 0,
            lastMonthSales: lastMonthSales?.totalUnits || 0,
            lastMonthRevenue: lastMonthSales?.totalRevenue?.toFixed(2) || 0,
            productTypes: productTypes.reduce((acc, type) => {
                acc[type._id] = type.count;
                return acc;
            }, {}),
            bestSellers: bestSellers.map(product => ({
                name: product.name,
                type: product.type,
                totalSales: product.sales?.total || 0
            }))
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
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // Get monthly sales for the current year
        const monthlySales = await Sales.aggregate([
            {
                $match: {
                    seller: sellerId,
                    year: currentYear
                }
            },
            {
                $sort: { month: 1 }
            },
            {
                $project: {
                    month: '$month',
                    revenue: '$totalRevenue',
                    units: '$totalUnits'
                }
            }
        ]);

        // Get product performance
        const productPerformance = await Product.aggregate([
            {
                $match: {
                    seller: sellerId,
                    status: { $ne: 'deleted' }
                }
            },
            {
                $sort: { 'sales.total': -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    name: 1,
                    type: 1,
                    totalSales: '$sales.total',
                    revenue: { $multiply: ['$price', '$sales.total'] }
                }
            }
        ]);

        // Get category distribution
        const categoryDistribution = await Product.aggregate([
            {
                $match: {
                    seller: sellerId,
                    status: { $ne: 'deleted' }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $multiply: ['$price', '$sales.total']
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                monthlySales,
                productPerformance,
                categoryDistribution,
                revenueStats: {
                    totalRevenue: monthlySales.reduce((sum, month) => sum + (month.revenue || 0), 0),
                    averageOrderValue: monthlySales.reduce((sum, month) => sum + (month.revenue || 0), 0) / 
                                     monthlySales.reduce((sum, month) => sum + (month.units || 0), 0) || 0,
                    monthlyGrowth: monthlySales.length > 1 ? 
                        ((monthlySales[monthlySales.length - 1]?.revenue || 0) - 
                         (monthlySales[monthlySales.length - 2]?.revenue || 0)) /
                         (monthlySales[monthlySales.length - 2]?.revenue || 1) * 100 : 0
                }
            }
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        return next(new ErrorResponse('Failed to fetch analytics data', 500));
    }
});