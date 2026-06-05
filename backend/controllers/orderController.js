const mongoose = require('mongoose');
const { Order, User, Product, WalletTransaction } = require('../models/models');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Create Order / Generate Payment ID
const createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { orderItems, shippingAddress, paymentMethod, pointsToRedeem } = req.body;
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: 'No items in order.' });
    }

    let subtotal = 0;
    
    // Process prices
    if (!isDbConnected()) {
      console.log('[Database Offline] Simulating order creation under sandbox.');
      subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    } else {
      for (const item of orderItems) {
        const prod = await Product.findById(item.product);
        if (!prod) {
          return res.status(404).json({ error: `Product ${item.name} not found.` });
        }
        if (prod.stock < item.qty) {
          return res.status(400).json({ error: `Insufficient stock for ${item.name}.` });
        }
        subtotal += prod.price * item.qty;
      }
    }

    // Free shipping threshold calculations
    const shippingPrice = subtotal >= 1000 ? 0 : 100;

    // Loyalty points calculations
    let pointsClaimed = 0;
    const isRoleAdmin = req.user.id === 'mock_admin_999';
    const userWalletPoints = isDbConnected() ? req.user.walletPoints : (isRoleAdmin ? 1000 : 350);

    if (pointsToRedeem && pointsToRedeem > 0) {
      const maxAllowed = Math.min(userWalletPoints, subtotal);
      pointsClaimed = Math.min(pointsToRedeem, maxAllowed);
    }

    // Points earn rate details based on loyalty tiers
    const userTier = isDbConnected() ? req.user.membershipTier : (isRoleAdmin ? 'Platinum' : 'Silver');
    let earnRate = 2; // Silver default (2%)
    if (userTier === 'Gold') earnRate = 5; // Gold (5%)
    else if (userTier === 'Platinum') earnRate = 10; // Platinum (10%)

    const netCashPaid = Math.max(0, subtotal - pointsClaimed);
    const pointsEarned = Math.round(netCashPaid * (earnRate / 100));

    const totalInrPrice = netCashPaid + shippingPrice;

    // Generate simulated checkout order reference
    const simulatedOrderId = 'luxe_order_' + Math.random().toString(36).substr(2, 9);

    if (!isDbConnected()) {
      const mockOrder = {
        _id: 'mock_ord_ref_' + Math.random().toString(36).substr(2, 9),
        user: req.user.id,
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice: subtotal,
        shippingPrice,
        totalPrice: totalInrPrice,
        pointsRedeemed: pointsClaimed,
        pointsEarned: pointsEarned,
        paymentResult: {
          id: simulatedOrderId,
          status: 'Created'
        },
        isPaid: false,
        isDelivered: false,
        createdAt: new Date()
      };
      return res.status(201).json({
        order: mockOrder,
        pointsClaimed,
        pointsEarned,
        earnRate
      });
    }

    const newOrder = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: subtotal,
      shippingPrice,
      totalPrice: totalInrPrice,
      pointsRedeemed: pointsClaimed,
      pointsEarned: pointsEarned,
      paymentResult: {
        id: simulatedOrderId,
        status: 'Created'
      }
    });

    await newOrder.save();

    res.status(201).json({
      order: newOrder,
      pointsClaimed,
      pointsEarned,
      earnRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Payment Success Verification
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required.' });
    }

    if (!isDbConnected()) {
      console.log('[Database Offline] Simulating payment confirmations under sandbox.');
      // Emulate success response instantly!
      return res.json({
        message: 'Payment completed successfully (Sandbox Mock)!',
        order: {
          _id: orderId,
          isPaid: true,
          paidAt: new Date(),
          pointsEarned: 180,
          pointsRedeemed: 0,
          paymentResult: { status: 'Paid' }
        },
        user: {
          walletPoints: 530,
          membershipTier: 'Silver',
          streakDays: 3,
          badges: ['Offline Champion', 'Streak Master', 'Vip Buyer']
        }
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.isPaid) {
      return res.status(400).json({ error: 'Order is already marked as paid.' });
    }

    // Deduct stock for all inventory items
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty }
      });
    }

    // Update Order payment properties
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult.status = 'Paid';
    await order.save();

    // Update User Wallet & loyalty status
    const user = await User.findById(order.user);
    
    // Redeem Points
    if (order.pointsRedeemed > 0) {
      user.walletPoints = Math.max(0, user.walletPoints - order.pointsRedeemed);
      user.pointsRedeemed += order.pointsRedeemed;

      await WalletTransaction.create({
        user: user._id,
        amount: -order.pointsRedeemed,
        type: 'debit',
        description: `Loyalty points redeemed at Checkout for Order #${order._id}`
      });
    }

    // Earn Points
    if (order.pointsEarned > 0) {
      user.walletPoints += order.pointsEarned;
      user.lifetimePointsEarned += order.pointsEarned;

      await WalletTransaction.create({
        user: user._id,
        amount: order.pointsEarned,
        type: 'credit',
        description: `Luxe Points earned from purchase on Order #${order._id}`
      });
    }

    // Award +200 points if this is the user's first completed purchase
    const previousPaidOrders = await Order.countDocuments({ user: user._id, isPaid: true, _id: { $ne: order._id } });
    if (previousPaidOrders === 0) {
      user.walletPoints = (user.walletPoints || 0) + 200;
      user.lifetimePointsEarned = (user.lifetimePointsEarned || 0) + 200;

      await WalletTransaction.create({
        user: user._id,
        amount: 200,
        type: 'credit',
        description: 'LUXE First Purchase Loyalty Bonus (+200 pts)'
      });
    }

    // Update Streaks
    const oneDay = 24 * 60 * 60 * 1000;
    const now = new Date();
    if (user.lastPurchaseDate) {
      const timeDiff = now - new Date(user.lastPurchaseDate);
      if (timeDiff <= oneDay * 2) {
        user.streakDays += 1;
      } else {
        user.streakDays = 1; // streak reset
      }
    } else {
      user.streakDays = 1;
    }
    user.lastPurchaseDate = now;

    // Streak milestone badge
    if (user.streakDays >= 3 && !user.badges.includes('Streak Master')) {
      user.badges.push('Streak Master');
    }
    if (!user.badges.includes('Vip Buyer')) {
      user.badges.push('Vip Buyer');
    }

    // Auto-update tier based on lifetime point balances
    user.updateMembershipTier();
    await user.save();

    res.json({
      message: 'Payment completed successfully!',
      order,
      user: {
        walletPoints: user.walletPoints,
        membershipTier: user.membershipTier,
        streakDays: user.streakDays,
        badges: user.badges
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch User's Orders
const getMyOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!isDbConnected()) {
      console.log('[Database Offline] Serving mock invoices lists.');
      return res.json([
        {
          _id: 'ord_mock_102',
          itemsPrice: 2499,
          shippingPrice: 0,
          totalPrice: 2499,
          paymentMethod: 'UPI',
          isPaid: true,
          paidAt: new Date(),
          createdAt: new Date(),
          orderItems: [{ name: 'AeroStratus Daily Runners', qty: 1, price: 2499 }]
        }
      ]);
    }

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getMyOrders
};
