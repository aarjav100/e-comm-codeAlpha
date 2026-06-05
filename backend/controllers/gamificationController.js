const mongoose = require('mongoose');
const { User, WalletTransaction } = require('../models/models');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Fetch user achievements, streaks, and milestones
const getGamificationStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Sign in to access your dashboard.' });
    }

    const milestones = [
      { id: 1, title: 'Welcome Rookie', desc: 'Join LUXE and make your first registration.', target: 100, current: req.user.lifetimePointsEarned, achieved: true },
      { id: 2, title: 'Bronze Collector', desc: 'Earn a lifetime total of 1000 points.', target: 1000, current: req.user.lifetimePointsEarned, achieved: req.user.lifetimePointsEarned >= 1000 },
      { id: 3, title: 'Gold Champion', desc: 'Reach Gold tier by collecting 5000 lifetime points.', target: 5000, current: req.user.lifetimePointsEarned, achieved: req.user.lifetimePointsEarned >= 5000 }
    ];

    res.json({
      streakDays: req.user.streakDays || 0,
      badges: req.user.badges || [],
      milestones,
      referralsCount: req.user.referralsCount || 0,
      referralCode: req.user.referralCode
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Play post-purchase Lucky Spin
const postSpinWheel = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Sign in to play.' });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID associated with purchase is required.' });
    }

    // Determine random rewards weights:
    // - 50 points (40% probability)
    // - 100 points (30% probability)
    // - 200 points (20% probability)
    // - 500 points (9% probability)
    // - 1000 points (1% probability)
    const weights = [
      { points: 50, label: '50 Luxe Points!' },
      { points: 100, label: '100 Luxe Points!' },
      { points: 200, label: '200 Luxe Points!' },
      { points: 500, label: '500 Luxe Points (Super Win)!' },
      { points: 1000, label: '1000 Luxe Points (Jackpot Master)!' }
    ];

    const randVal = Math.random();
    let reward = weights[0]; // fallback default
    
    if (randVal < 0.01) {
      reward = weights[4]; // jackpot 1000
    } else if (randVal < 0.10) {
      reward = weights[3]; // 500
    } else if (randVal < 0.30) {
      reward = weights[2]; // 200
    } else if (randVal < 0.60) {
      reward = weights[1]; // 100
    } else {
      reward = weights[0]; // 50
    }

    if (!isDbConnected()) {
      // Offline fallback: simulate lucky spin success instantly!
      return res.json({
        success: true,
        pointsWon: reward.points,
        label: reward.label,
        newBalance: (req.user.walletPoints || 350) + reward.points
      });
    }

    const user = await User.findById(req.user._id);
    user.walletPoints += reward.points;
    user.lifetimePointsEarned += reward.points;
    user.updateMembershipTier();

    // Check if new badge unlocked
    if (reward.points >= 500 && !user.badges.includes('Jackpot Spinner')) {
      user.badges.push('Jackpot Spinner');
    }

    await user.save();

    // Log transaction
    await WalletTransaction.create({
      user: user._id,
      amount: reward.points,
      type: 'credit',
      description: `Lucky Spin Post-Purchase Win for Order #${orderId}`
    });

    res.json({
      success: true,
      pointsWon: reward.points,
      label: reward.label,
      newBalance: user.walletPoints
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getGamificationStats,
  postSpinWheel
};
