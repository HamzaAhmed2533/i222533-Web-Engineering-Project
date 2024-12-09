const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// Specific routes first
router.get('/all', productController.getAllProducts);
router.get('/top-selling', productController.getTopSellingProducts);
router.get('/highest-rated', productController.getHighestRatedProducts);
router.get('/on-sale', productController.getOnSaleProducts);
router.get('/new-releases', productController.getNewReleases);
router.get('/best-sellers', productController.getBestSellers);
router.get('/search', productController.searchProducts);
router.get('/seller/my-products', protect, productController.getSellerProducts);

// Protected buyer routes with specific paths
router.get('/recommendations', protect, productController.getPersonalizedRecommendations);
router.get('/my/ratings', protect, authorize('buyer'), productController.getMyRatings);

// Rating routes
router.post('/ratings/:productId', protect, authorize('buyer'), productController.rateProduct);
router.get('/ratings/:productId', productController.getProductRatings);
router.patch('/ratings/:ratingId', protect, authorize('buyer'), productController.updateRating);
router.delete('/ratings/:ratingId', protect, authorize('buyer'), productController.deleteRating);

// Base product routes
router.get('/', productController.getProducts);
router.post('/', protect, authorize('seller'), productController.createProduct);

// Product ID routes (must be last)
router.route('/:id')
  .get(productController.getProduct)
  .put(protect, authorize('seller'), productController.updateProduct)
  .delete(protect, authorize('seller'), productController.deleteProduct);

module.exports = router;