const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Route files
const auth = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const sellerRoutes = require('./routes/seller.routes');
const buyerRoutes = require('./routes/buyer.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const refundRoutes = require('./routes/refund.routes');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File upload middleware
app.use(fileUpload({
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Game E-commerce API' });
});

app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

// Mount routers
app.use('/api/auth', auth);
app.use('/api/products', productRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/refunds', refundRoutes);

// Error handler (should be last piece of middleware)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = app;