const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// Public routes for buyers
router.get('/', productController.getProducts);
router.get('/all', productController.getAllProducts);
router.get('/:id', productController.getProduct);

router.get('/top-selling', productController.getTopSellingProducts);
router.get('/highest-rated', productController.getHighestRatedProducts);
router.get('/recommendations', protect, productController.getPersonalizedRecommendations);
router.get('/on-sale', productController.getOnSaleProducts);
router.get('/new-releases', productController.getNewReleases);
router.get('/best-sellers', productController.getBestSellers);
router.get('/search', productController.searchProducts);

// Protected buyer routes
router.get('/recommendations', protect, productController.getPersonalizedRecommendations);
router.post('/:productId/rate', protect, authorize('buyer'), productController.rateProduct);
router.get('/:productId/ratings', productController.getProductRatings);
router.get('/my/ratings', protect, authorize('buyer'), productController.getMyRatings);
router.patch('/ratings/:ratingId', protect, authorize('buyer'), productController.updateRating);
router.delete('/ratings/:ratingId', protect, authorize('buyer'), productController.deleteRating);

// Protected seller routes
router.get('/seller/my-products', protect, productController.getSellerProducts);

// Create product route - needs both authentication and seller authorization
router.post('/', protect, authorize('seller'), productController.createProduct);

module.exports = router;