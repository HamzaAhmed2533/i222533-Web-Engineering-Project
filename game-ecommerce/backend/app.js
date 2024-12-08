const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Route imports
const productRoutes = require('./routes/product.routes');
const buyerRoutes = require('./routes/buyer.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');

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
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
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