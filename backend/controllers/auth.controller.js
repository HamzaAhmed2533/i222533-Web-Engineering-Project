const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const ErrorResponse = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../middleware/async');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;
  
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('Email already registered', 400));
    }
  
    // Create user with plain password (will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password: password.toString().trim() // Ensure clean password string
    });
  
    sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Clean the password input - remove any unwanted characters
  const cleanPassword = password.toString().replace(/[`'"]/g, '').trim();
  
  console.log('Login attempt for:', email);

  if (!email || !cleanPassword) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  console.log('Found user:', user ? 'Yes' : 'No');
  console.log('User data:', {
    email: user?.email,
    hasPassword: !!user?.password,
    passwordLength: user?.password?.length
  });
  
  if (!user) {
    console.log('No user found with email:', email);
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (user.googleId) {
    console.log('Google user attempting password login');
    return next(new ErrorResponse('Please use Google login', 400));
  }

  // Use cleaned password for comparison
  const isMatch = await user.matchPassword(cleanPassword);
  console.log('Password match result:', isMatch);
  
  if (!isMatch) {
    console.log('Password match failed for user:', email);
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Successfully logged out',
  });
});

// @desc    Google login
// @route   POST /api/auth/google-login
// @access  Public
exports.googleLogin = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { name, email, sub: googleId } = ticket.getPayload();

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
      password: 'google-auth', // Placeholder, not used
    });
  }

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-password');
  
  res.status(200).json({
    success: true,
    data: users
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};