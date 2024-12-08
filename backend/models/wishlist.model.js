const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notifyOnSale: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Ensure one product per user
wishlistSchema.index({ user: 1, 'products.product': 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema); 