const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalUnits: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  monthlyRevenue: {
    type: Number,
    default: 0
  },
  transactions: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    isDiscounted: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Compound index for efficient queries
salesSchema.index({ seller: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Sales', salesSchema); 