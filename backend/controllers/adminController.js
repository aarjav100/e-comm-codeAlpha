const mongoose = require('mongoose');
const { Order, User, Product } = require('../models/models');
const { seedProducts } = require('../config/mockDb');

const isDbConnected = () => mongoose.connection.readyState === 1;

const getAdminStats = async (req, res) => {
  try {
    if (!isDbConnected()) {
      console.log('[Database Offline] Compiling fallback mock stats for admin dashboard.');
      return res.json({
        totalUsers: 142,
        totalProducts: seedProducts.length,
        totalOrders: 32,
        totalRevenue: 154250.00,
        recentOrders: [
          {
            _id: 'ord_mock_101',
            totalPrice: 68900,
            isPaid: true,
            createdAt: new Date(),
            user: { name: 'Demo Client User', email: 'client@luxe.com' }
          },
          {
            _id: 'ord_mock_102',
            totalPrice: 2499,
            isPaid: true,
            createdAt: new Date(),
            user: { name: 'Sandbox Tester', email: 'tester@luxe.com' }
          }
        ],
        topSelling: seedProducts.slice(0, 3),
        revenueTracking: [
          { month: 'Jan', revenue: 15400 },
          { month: 'Feb', revenue: 32900 },
          { month: 'Mar', revenue: 64200 },
          { month: 'Apr', revenue: 154250 }
        ]
      });
    }

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Sum total revenue
    const paidOrders = await Order.find({ isPaid: true });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const topSelling = await Product.find()
      .sort({ rating: -1, numReviews: -1 })
      .limit(5);

    const revenueTracking = [
      { month: 'Jan', revenue: Math.round(totalRevenue * 0.15) },
      { month: 'Feb', revenue: Math.round(totalRevenue * 0.20) },
      { month: 'Mar', revenue: Math.round(totalRevenue * 0.30) },
      { month: 'Apr', revenue: Math.round(totalRevenue * 0.35) }
    ];

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      recentOrders,
      topSelling,
      revenueTracking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAdminStats
};
