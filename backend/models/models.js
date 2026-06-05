const mongoose = require('mongoose');
const { Schema } = mongoose;

// ==========================================
// 1. USER SCHEMA
// ==========================================
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  googleId: { type: String, default: null },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  
  // Luxe Wallet System
  walletPoints: { type: Number, default: 100 }, // registrations start with 100 bonus points!
  lifetimePointsEarned: { type: Number, default: 100 },
  pointsRedeemed: { type: Number, default: 0 },
  
  // Loyalty Tiers
  membershipTier: { type: String, default: 'Silver', enum: ['Silver', 'Gold', 'Platinum'] },
  
  // Referral Rewards
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referralsCount: { type: Number, default: 0 },
  
  // Gamification & Streaks
  streakDays: { type: Number, default: 0 },
  lastPurchaseDate: { type: Date, default: null },
  lastLoginDate: { type: Date, default: null },
  badges: { type: [String], default: ['First Welcome Reward'] },
  
  // Checkout Address Management
  addresses: [{
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zipcode: { type: String, required: true },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate unique referral codes
userSchema.pre('validate', function (next) {
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Dynamic tier calculation helper based on lifetime points
userSchema.methods.updateMembershipTier = function () {
  const points = this.lifetimePointsEarned || 0;
  if (points >= 5000) {
    this.membershipTier = 'Platinum';
  } else if (points >= 1000) {
    this.membershipTier = 'Gold';
  } else {
    this.membershipTier = 'Silver';
  }
};


// ==========================================
// 2. PRODUCT SCHEMA
// ==========================================
const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, // acts as the sale price
  originalPrice: { type: Number, required: true },
  discountPercentage: { type: Number, default: 0 },
  category: { type: String, required: true },
  brand: { type: String, default: 'LUXE' },
  sku: { type: String, unique: true, sparse: true },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
  stock: { type: Number, required: true, default: 10 },
  rating: { type: Number, default: 5 },
  numReviews: { type: Number, default: 0 },
  deliveryEstimate: { type: String, default: '3-5 business days' },
  aiSummary: { type: String, default: '' },
  specifications: [{
    name: { type: String, required: true },
    value: { type: String, required: true }
  }],
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});


// ==========================================
// 3. REVIEW SCHEMA
// ==========================================
const reviewSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: { type: [String], default: [] }, // Product images inside reviews
  videos: { type: [String], default: [] }, // Product videos inside reviews
  helpfulVotes: { type: Number, default: 0 },
  unhelpfulVotes: { type: Number, default: 0 },
  votedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Prevents duplicate voting
  verifiedPurchase: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});


// ==========================================
// 4. ORDER SCHEMA
// ==========================================
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String }
});

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [orderItemSchema],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    zipcode: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentMethod: { type: String, required: true, enum: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'] },
  paymentResult: {
    id: String, // Razorpay Order ID or Payment ID
    status: String,
    email_address: String
  },
  itemsPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  
  // Rewards Points Integration
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: { type: Date },
  
  // Tracking & States
  trackingState: { type: String, default: 'Confirmed', enum: ['Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'] },
  invoicePath: { type: String, default: '' },
  isCancelled: { type: Boolean, default: false },
  isReturned: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});


// ==========================================
// 5. WALLET TRANSACTION SCHEMA
// ==========================================
const walletTransactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // Positive for crediting, negative for debiting
  type: { type: String, required: true, enum: ['credit', 'debit'] },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


// ==========================================
// 6. NOTIFICATION SCHEMA
// ==========================================
const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info', enum: ['info', 'order', 'flash_sale', 'price_drop', 'reward'] },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});


// Compile and Export Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);
const Order = mongoose.model('Order', orderSchema);
const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  User,
  Product,
  Review,
  Order,
  WalletTransaction,
  Notification
};
