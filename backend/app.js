const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const productRoutes = require('./routes/product.routes');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const sellerRoutes = require('./routes/seller.routes');

// Route imports
const buyerRoutes = require('./routes/buyer.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Load env vars
require('dotenv').config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File upload middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true
}));

// Add this before your routes
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Mount routers
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', productRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seller/analytics', analyticsRoutes);
app.use('/api/seller', sellerRoutes);
// Add other routes here...

// Error handler
app.use(errorHandler);

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