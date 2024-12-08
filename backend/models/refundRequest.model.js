const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'auto_accepted', 'auto_rejected', 'seller_accepted', 'seller_rejected', 'disputed', 'admin_accepted', 'admin_rejected'],
    default: 'pending'
  },
  sellerResponse: {
    reason: String,
    date: Date
  },
  disputeDetails: {
    reason: String,
    date: Date,
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending'
    }
  },
  refundAmount: {
    type: Number,
    required: true
  },
  productType: {
    type: String,
    enum: ['digital_game', 'physical_game', 'console', 'pc', 'peripheral'],
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  refundRequestDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RefundRequest', refundRequestSchema); 