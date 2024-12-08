const Product = require('../../models/product.model');
const mongoose = require('mongoose');

const fixProductSales = async () => {
  try {
    // Update all products that don't have a sales object
    await Product.updateMany(
      { 
        $or: [
          { sales: { $exists: false } },
          { sales: null },
          { 'sales.total': { $exists: false } },
          { 'sales.lastMonth': { $exists: false } }
        ]
      },
      {
        $set: {
          sales: {
            total: 0,
            lastMonth: 0,
            lastMonthUpdated: new Date()
          }
        }
      }
    );

    console.log('Product sales fields fixed successfully');
  } catch (error) {
    console.error('Error fixing product sales:', error);
  }
};

// Run this once to fix existing products
// fixProductSales();

module.exports = fixProductSales; 