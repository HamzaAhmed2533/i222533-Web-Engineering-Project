const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/', wishlistController.getWishlist);
router.post('/add/:productId', wishlistController.addToWishlist);
router.delete('/remove/:productId', wishlistController.removeFromWishlist);
router.patch('/notify/:productId', wishlistController.toggleNotification);

module.exports = router; 