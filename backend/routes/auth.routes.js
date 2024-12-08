const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  googleLogin,
  getAllUsers,
} = require('../controllers/auth.controller');

const router = express.Router();

const { protect, isAdmin } = require('../middleware/auth');

router.get('/users', protect, isAdmin, getAllUsers);

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.get('/me', protect, getMe);
router.get('/logout', logout);

module.exports = router;