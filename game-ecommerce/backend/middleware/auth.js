const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorHandler');
const User = require('../models/user.model');

exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    
    // Check header for token
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader); // Debug line

    if (authHeader && authHeader.startsWith('Bearer')) {
        // Extract token
        token = authHeader.split(' ')[1];
        console.log('Extracted Token:', token); // Debug line
    }

    if (!token) {
        return next(new ErrorResponse('No token provided', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Debug line

        // Get user from database
        const user = await User.findById(decoded.id);
        console.log('Found user:', user ? 'Yes' : 'No'); // Debug line
        
        if (!user) {
            return next(new ErrorResponse('User not found', 404));
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return next(new ErrorResponse('Invalid token', 401));
    }
});

exports.isSeller = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.role === 'seller') {
        next();
    } else {
        return next(new ErrorResponse('Access denied. Seller only.', 403));
    }
});

exports.isAdmin = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return next(new ErrorResponse('Access denied. Admin only.', 403));
    }
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
