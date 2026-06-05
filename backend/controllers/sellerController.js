const mongoose = require('mongoose');
const { Product, Order, User } = require('../models/models');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Fetch seller dashboard metrics (Sales, catalog listings, inventory alerts)
const getSellerStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!isDbConnected()) {
      console.log('[Database Offline] Serving mock seller stats dashboard.');
      return res.json({
        totalRevenue: 2499,
        totalSalesCount: 1,
        listingsCount: 8,
        lowStockAlertsCount: 2,
        lowStockItems: [
          { name: 'Zenith X1 Gaming Laptop V1', stock: 4 },
          { name: 'Chronos Minimalist Watch V2', stock: 2 }
        ],
        salesLedger: [
          { _id: 'ord_mock_102', customerName: 'Sandbox Tester', totalPrice: 2499, status: 'Paid', date: new Date() }
        ]
      });
    }

    // Retrieve active seller products
    const sellerProducts = await Product.find({ brand: req.user.role === 'admin' ? 'LUXE' : req.user.name });
    const listingsCount = sellerProducts.length;

    // Filter low stock items (stock < 5)
    const lowStockItems = sellerProducts.filter(p => p.stock < 5).map(p => ({
      name: p.name,
      stock: p.stock
    }));
    const lowStockAlertsCount = lowStockItems.length;

    // Calculate seller order statistics
    const paidOrders = await Order.find({ isPaid: true });
    
    // Sum revenue for products belonging to this seller
    let totalRevenue = 0;
    let totalSalesCount = 0;
    const salesLedger = [];

    const sellerBrand = req.user.role === 'admin' ? 'LUXE' : req.user.name;

    for (const order of paidOrders) {
      let containsSellerItem = false;
      let orderSubtotal = 0;

      for (const item of order.orderItems) {
        const prod = await Product.findById(item.product);
        if (prod && prod.brand === sellerBrand) {
          containsSellerItem = true;
          orderSubtotal += item.price * item.qty;
          totalSalesCount += item.qty;
        }
      }

      if (containsSellerItem) {
        totalRevenue += orderSubtotal;
        
        const customer = await User.findById(order.user).select('name');
        salesLedger.push({
          _id: order._id,
          customerName: customer ? customer.name : 'Loyal Client',
          totalPrice: orderSubtotal,
          status: order.isPaid ? 'Paid' : 'Unpaid',
          date: order.createdAt
        });
      }
    }

    res.json({
      totalRevenue,
      totalSalesCount,
      listingsCount,
      lowStockAlertsCount,
      lowStockItems,
      salesLedger
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Seller marketplace action: update tracking status of order items
const updateOrderTracking = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { orderId, state } = req.body;
    if (!orderId || !state) {
      return res.status(400).json({ error: 'Order ID and tracking state are required.' });
    }

    const validStates = ['Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'];
    if (!validStates.includes(state)) {
      return res.status(400).json({ error: 'Invalid tracking state value.' });
    }

    if (!isDbConnected()) {
      console.log('[Database Offline] Simulating order tracking state updates under sandbox.');
      return res.json({
        message: `Order status successfully transitioned to ${state}!`,
        order: {
          _id: orderId,
          trackingState: state,
          isDelivered: state === 'Delivered',
          deliveredAt: state === 'Delivered' ? new Date() : null
        }
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    order.trackingState = state;
    if (state === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    await order.save();

    res.json({
      message: `Order status successfully updated to: ${state}`,
      order
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Seller marketplace action: cancel order
const cancelOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    if (!isDbConnected()) {
      console.log('[Database Offline] Simulating order cancellation under sandbox.');
      return res.json({
        message: 'Order successfully cancelled!',
        order: {
          _id: orderId,
          isCancelled: true,
          trackingState: 'Cancelled'
        }
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    order.isCancelled = true;
    order.trackingState = 'Cancelled';
    await order.save();

    res.json({
      message: 'Order status successfully updated to: Cancelled',
      order
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSellerStats,
  updateOrderTracking,
  cancelOrder
};
