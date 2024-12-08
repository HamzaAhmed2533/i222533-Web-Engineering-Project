const Product = require('../models/product.model');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorHandler');
const Sales = require('../models/sales.model');
const mongoose = require('mongoose');

// @desc    Get seller dashboard stats
// @route   GET /api/seller/stats
// @access  Private/Seller
exports.getSellerStats = asyncHandler(async (req, res, next) => {
    try {
        const sellerId = new mongoose.Types.ObjectId(req.user._id);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get total products (excluding deleted)
    const totalProducts = await Product.countDocuments({ 
        seller: sellerId,
        status: { $ne: 'deleted' }
    });

        // Get current month's sales data
        const currentMonthSales = await Sales.findOne({
            seller: sellerId,
            year: currentYear,
            month: currentMonth
        });

        // Get last month's sales data
        const lastMonthSales = await Sales.findOne({
            seller: sellerId,
            year: lastMonthYear,
            month: lastMonth
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
            totalSales: currentMonthSales?.totalSales || 0,
            totalRevenue: currentMonthSales?.totalRevenue || 0,
            lastMonthSales: lastMonthSales?.totalSales || 0,
            lastMonthRevenue: lastMonthSales?.totalRevenue || 0,
            productTypes: productTypes.reduce((acc, type) => {
                acc[type._id] = type.count;
                return acc;
            }, {})
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Seller Stats Error:', error);
        return next(new ErrorResponse('Failed to fetch seller statistics', 500));
    }
}); 