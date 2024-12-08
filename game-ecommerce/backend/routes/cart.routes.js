const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth');

// Cart routes
router.get('/', protect, cartController.getCart);
router.post('/add/:productId', protect, cartController.addToCart);
router.delete('/remove/:productId', protect, cartController.removeFromCart);
router.put('/update/:productId', protect, cartController.updateQuantity);
router.delete('/clear', protect, cartController.clearCart);
router.post('/checkout', protect, cartController.checkout);

module.exports = router; 


/*
router.use(protect);

router.get('/', cartController.getCart);
router.post('/add/:productId', cartController.addToCart);
router.delete('/remove/:productId', cartController.removeFromCart);
router.patch('/update/:productId', cartController.updateQuantity);
router.post('/checkout', cartController.checkout);
router.delete('/clear', cartController.clearCart);
router.post('/add', protect, addToCart);
*/