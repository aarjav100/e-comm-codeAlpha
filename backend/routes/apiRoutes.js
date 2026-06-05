const express = require('express');
const router = express.Router();

// Middleware Guards
const { authenticateToken, requireAuth, requireAdmin } = require('../middleware/auth');

// Controllers
const { registerUser, loginUser, googleLoginUser, getMe, logoutUser } = require('../controllers/authController');
const { getProducts, getProductById, createProduct, getAiSearch, getAiCompare, getAiBudgetCart, deleteProduct } = require('../controllers/productController');
const { getCartMetadata } = require('../controllers/cartController');
const { getWalletStats, getWalletLedger, getAiCashbackOptimizer } = require('../controllers/walletController');
const { getGamificationStats, postSpinWheel } = require('../controllers/gamificationController');
const { createOrder, verifyPayment, getMyOrders } = require('../controllers/orderController');
const { createReview, getReviews, voteHelpful, getAiReviewSummary } = require('../controllers/reviewsController');
const { getAdminStats } = require('../controllers/adminController');
const { getSellerStats, updateOrderTracking, cancelOrder } = require('../controllers/sellerController');

// In-memory simple store for cart & wishlist fallback (per-run session)
let mockWishlist = [];
let mockCart = [];

// ==========================================
// 1. AUTHENTICATION ROUTING & ALIASES
// ==========================================
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/google', googleLoginUser);
router.get('/auth/me', authenticateToken, getMe);
router.post('/auth/logout', logoutUser);

// Top level aliases
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// ==========================================
// 2. PRODUCTS & SPEC COMPARISONS ROUTING
// ==========================================
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', authenticateToken, requireAdmin, createProduct);
router.post('/products/search/ai', getAiSearch);
router.post('/products/compare/ai', getAiCompare);
router.post('/products/budget/ai', getAiBudgetCart);
router.delete('/products/:id', authenticateToken, requireAdmin, deleteProduct);

// AI & Voice search alias
router.post('/ai/search', getAiSearch);
router.post('/voice-search', getAiSearch);

// ==========================================
// 3. CART SYSTEM ROUTING & CRUD
// ==========================================
router.post('/cart/metadata', getCartMetadata);

router.post('/cart', (req, res) => {
  const { product, qty = 1 } = req.body;
  if (!product) return res.status(400).json({ error: 'Product is required.' });
  const existing = mockCart.find(i => i.product === (product.id || product._id || product));
  if (existing) {
    existing.qty += qty;
  } else {
    mockCart.push({
      product: product.id || product._id || product,
      name: product.name || 'Premium Item',
      price: product.price || 1000,
      image: product.image || '',
      qty
    });
  }
  res.json({ message: 'Added to cart successfully', cart: mockCart });
});

router.put('/cart/:id', (req, res) => {
  const { qty } = req.body;
  const item = mockCart.find(i => i.product === req.params.id);
  if (item) {
    item.qty = qty;
    res.json({ message: 'Updated quantity successfully', cart: mockCart });
  } else {
    res.status(404).json({ error: 'Cart item not found.' });
  }
});

router.delete('/cart/:id', (req, res) => {
  mockCart = mockCart.filter(i => i.product !== req.params.id);
  res.json({ message: 'Removed from cart successfully', cart: mockCart });
});

// ==========================================
// 4. WISHLIST SYSTEM ROUTING
// ==========================================
router.get('/wishlist', (req, res) => {
  res.json(mockWishlist);
});

router.post('/wishlist', (req, res) => {
  const { product } = req.body;
  if (!product) return res.status(400).json({ error: 'Product detail required.' });
  const existingIndex = mockWishlist.findIndex(p => p._id === product._id || p.id === product.id);
  if (existingIndex >= 0) {
    mockWishlist.splice(existingIndex, 1);
  } else {
    mockWishlist.push(product);
  }
  res.json({ message: 'Wishlist status toggled', wishlist: mockWishlist });
});

// ==========================================
// 5. REWARDS WALLET SYSTEM ROUTING
// ==========================================
router.get('/wallet/stats', authenticateToken, requireAuth, getWalletStats);
router.get('/wallet/ledger', authenticateToken, requireAuth, getWalletLedger);
router.post('/wallet/optimizer/ai', authenticateToken, requireAuth, getAiCashbackOptimizer);

// ==========================================
// 6. GAMIFICATION ACHIEVEMENTS & WHEELS ROUTING
// ==========================================
router.get('/gamification/stats', authenticateToken, requireAuth, getGamificationStats);
router.post('/gamification/spin', authenticateToken, requireAuth, postSpinWheel);

// ==========================================
// 7. ORDERING SYSTEM ROUTING
// ==========================================
router.post('/orders', authenticateToken, requireAuth, createOrder);
router.post('/orders/verify', authenticateToken, requireAuth, verifyPayment);
router.get('/orders/my', authenticateToken, requireAuth, getMyOrders);

// ==========================================
// 8. REVIEW SYSTEM & AI PROS/CONS SUMMARIES ROUTING
// ==========================================
router.get('/products/:id/reviews', getReviews);
router.post('/products/:id/reviews', authenticateToken, requireAuth, createReview);
router.post('/products/:id/reviews/summary', getAiReviewSummary);
router.post('/reviews/:id/helpful', authenticateToken, requireAuth, voteHelpful);

// Top level reviews endpoint
router.get('/reviews', (req, res) => {
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ error: 'ProductId query parameter is required.' });
  req.params.id = productId;
  getReviews(req, res);
});

router.post('/reviews', authenticateToken, requireAuth, (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'ProductId is required in request body.' });
  req.params.id = productId;
  createReview(req, res);
});

// ==========================================
// 9. ADMINISTRATIVE REPORTING ROUTING
// ==========================================
router.get('/admin/stats', authenticateToken, requireAdmin, getAdminStats);

// ==========================================
// 10. SELLER MARKETPLACE ROUTING
// ==========================================
router.get('/seller/stats', authenticateToken, requireAuth, getSellerStats);
router.post('/seller/tracking', authenticateToken, requireAuth, updateOrderTracking);
router.post('/seller/cancel', authenticateToken, requireAuth, cancelOrder);

module.exports = router;
