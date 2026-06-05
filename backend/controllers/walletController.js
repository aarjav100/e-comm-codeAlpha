const mongoose = require('mongoose');
const { WalletTransaction } = require('../models/models');
const { callGemini } = require('../config/gemini');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Fetch Wallet Balance and Lifetime Stats
const getWalletStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Sign in to access your wallet.' });
    }

    if (!isDbConnected()) {
      console.log('[Database Offline] Serving wallet statistics from sandbox emulations.');
      const isRoleAdmin = req.user.id === 'mock_admin_999';
      return res.json({
        currentPoints: isRoleAdmin ? 1000 : 350,
        lifetimePoints: isRoleAdmin ? 1000 : 450,
        pointsUsed: isRoleAdmin ? 0 : 100,
        pointsValueInInr: isRoleAdmin ? 1000 : 350,
        membershipTier: isRoleAdmin ? 'Platinum' : 'Silver',
        badges: isRoleAdmin ? ['Master Creator', 'Welcome Administrator'] : ['First Welcome Reward', 'Offline Sandbox Mode']
      });
    }

    const currentPoints = req.user.walletPoints || 0;
    const lifetimePoints = req.user.lifetimePointsEarned || 0;
    const pointsUsed = req.user.pointsRedeemed || 0;
    const pointsValueInInr = currentPoints;

    res.json({
      currentPoints,
      lifetimePoints,
      pointsUsed,
      pointsValueInInr,
      membershipTier: req.user.membershipTier,
      badges: req.user.badges
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch transaction history ledger
const getWalletLedger = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Sign in to access transactions ledger.' });
    }

    if (!isDbConnected()) {
      console.log('[Database Offline] Serving simulated wallet ledger.');
      const isRoleAdmin = req.user.id === 'mock_admin_999';
      return res.json([
        {
          _id: 'tx_mock_201',
          amount: isRoleAdmin ? 1000 : 250,
          type: 'credit',
          description: 'LUXE Post-Purchase Lucky Spin Reward',
          createdAt: new Date()
        },
        {
          _id: 'tx_mock_202',
          amount: 100,
          type: 'credit',
          description: 'Welcome Registration Bonus',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      ]);
    }

    const ledger = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Cashback Optimizer
const getAiCashbackOptimizer = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Sign in to load dynamic cashback optimizer.' });
    }

    const { cartTotal } = req.body;
    if (!cartTotal || isNaN(cartTotal)) {
      return res.status(400).json({ error: 'Valid numeric cartTotal required.' });
    }

    const isRoleAdmin = req.user.id === 'mock_admin_999';
    const points = isRoleAdmin ? 1000 : (req.user.walletPoints || 350);

    const aiPrompt = `
      User wants to buy items totaling ₹${cartTotal}.
      They have ${points} Luxe Points (valued at ₹1 each).
      Provide a smart cashback optimization tip under 60 words advising them on whether they should use all their points, use a portion of them (e.g. 50-70%), or save them for high-value future events.
      Keep the tone ultra-professional and premium.
    `;

    const aiRecommendation = await callGemini(aiPrompt);

    res.json({
      points,
      inrValue: points,
      recommendation: aiRecommendation.trim()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getWalletStats,
  getWalletLedger,
  getAiCashbackOptimizer
};
