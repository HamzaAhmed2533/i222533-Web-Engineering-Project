const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['digital_game', 'physical_game', 'console', 'pc', 'peripheral']
  },
  category: {
    type: String,
    required: true,
    enum: ['game', 'hardware']
  },
  images: [{
    url: String,
    public_id: String
  }],
  stock: {
    type: Number,
    min: 0,
    default: 0
  },
  specifications: {
    platform: {
      type: [String],
      default: undefined
    },
    genre: {
      type: [String],
      default: undefined
    },
    releaseDate: {
      type: Date,
      default: undefined
    },
    brand: {
      type: String,
      default: undefined
    },
    model: {
      type: String,
      default: undefined
    }
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String
    },
    platform: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  sales: {
    total: {
      type: Number,
      default: 0
    },
    lastMonth: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  onSale: {
    isOnSale: {
      type: Boolean,
      default: false
    },
    salePrice: {
      type: Number,
      min: 0
    },
    saleEndDate: Date
  }
}, {
  timestamps: true
});

// Custom validation middleware
productSchema.pre('save', function(next) {
  // Only run validation if specifications or type are being modified
  if (!this.isModified('specifications') && !this.isModified('type') && !this.isNew) {
    return next();
  }

  if (this.type === 'digital_game' || this.type === 'physical_game') {
    if (!this.specifications.platform || !this.specifications.platform.length) {
      return next(new Error('Platform is required for games'));
    }
    if (!this.specifications.genre || !this.specifications.genre.length) {
      return next(new Error('Genre is required for games'));
    }
    if (!this.specifications.releaseDate) {
      return next(new Error('Release date is required for games'));
    }
  } else if (['console', 'pc', 'peripheral'].includes(this.type)) {
    if (!this.specifications.brand) {
      return next(new Error('Brand is required for hardware'));
    }
    if (!this.specifications.model) {
      return next(new Error('Model is required for hardware'));
    }
  }

  if (this.type !== 'digital_game' && !this.stock) {
    return next(new Error('Stock is required for physical products'));
  }

  next();
});

// Custom validation for updates
productSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  // Skip validation if we're only updating ratings
  if (update.$push && update.$push.ratings) {
    return next();
  }

  const type = update.type || (await this.model.findOne(this.getQuery())).type;

  if (type === 'digital_game' || type === 'physical_game') {
    const specs = update.specifications || {};
    if (!specs.platform || !specs.platform.length) {
      return next(new Error('Platform is required for games'));
    }
    if (!specs.genre || !specs.genre.length) {
      return next(new Error('Genre is required for games'));
    }
    if (!specs.releaseDate) {
      return next(new Error('Release date is required for games'));
    }
  } else if (['console', 'pc', 'peripheral'].includes(type)) {
    const specs = update.specifications || {};
    if (!specs.brand) {
      return next(new Error('Brand is required for hardware'));
    }
    if (!specs.model) {
      return next(new Error('Model is required for hardware'));
    }
  }

  if (type !== 'digital_game' && update.stock === undefined) {
    return next(new Error('Stock is required for physical products'));
  }

  next();
});

productSchema.index({ 
  name: 'text', 
  description: 'text',
  'specifications.brand': 'text',
  'specifications.model': 'text'
});

module.exports = mongoose.model('Product', productSchema);