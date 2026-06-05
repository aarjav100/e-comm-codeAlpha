const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, WalletTransaction } = require('../models/models');
const { JWT_SECRET } = require('../middleware/auth');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Register Customer
const registerUser = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailLower = email.toLowerCase().trim();

    if (!isDbConnected()) {
      console.log('[Database Offline] Simulating user registration under sandbox.');
      const mockUser = {
        _id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        email: emailLower,
        role: 'user',
        walletPoints: referralCode ? 200 : 100,
        membershipTier: 'Silver',
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        badges: ['First Welcome Reward', 'Offline Sandbox Mode'],
        streakDays: 1
      };
      const token = jwt.sign({ id: mockUser._id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.status(201).json({
        message: 'Account created successfully (Sandbox Fallback)!',
        user: {
          id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          walletPoints: mockUser.walletPoints,
          membershipTier: mockUser.membershipTier,
          referralCode: mockUser.referralCode
        }
      });
    }

    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Dynamic points award
    let initialPoints = 100; // 100 welcome points default
    let referredByUser = null;

    if (referralCode) {
      referredByUser = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
    }

    if (referredByUser) {
      initialPoints += 100; // referred referee gets 100 bonus points (200 total)
    }

    const newUser = new User({
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
      walletPoints: initialPoints,
      lifetimePointsEarned: initialPoints,
      referredBy: referredByUser ? referredByUser.referralCode : null
    });

    await newUser.save();

    // Log welcome transaction
    await WalletTransaction.create({
      user: newUser._id,
      amount: 100,
      type: 'credit',
      description: 'LUXE Registration Welcome Points'
    });

    // Award Referrer if applicable
    if (referredByUser) {
      referredByUser.walletPoints += 200;
      referredByUser.lifetimePointsEarned += 200;
      referredByUser.referralsCount += 1;
      referredByUser.updateMembershipTier();
      
      if (referredByUser.referralsCount === 1 && !referredByUser.badges.includes('First Referral')) {
        referredByUser.badges.push('First Referral');
      }
      
      await referredByUser.save();

      // Log transaction for referred referee
      await WalletTransaction.create({
        user: newUser._id,
        amount: 100,
        type: 'credit',
        description: 'Referral Code Registration Bonus'
      });

      // Log transaction for referrer
      await WalletTransaction.create({
        user: referredByUser._id,
        amount: 200,
        type: 'credit',
        description: `Referral Award for inviting ${newUser.name}`
      });
    }

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        walletPoints: newUser.walletPoints,
        membershipTier: newUser.membershipTier,
        referralCode: newUser.referralCode
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login Customer
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailLower = email.toLowerCase().trim();

    if (!isDbConnected()) {
      console.log('[Database Offline] Simulating user login under sandbox.');
      const isRoleAdmin = emailLower === 'admin@luxe.com';
      const mockUser = {
        _id: isRoleAdmin ? 'mock_admin_999' : 'mock_user_123',
        name: isRoleAdmin ? 'LUXE Administrator' : 'Sandbox Tester',
        email: emailLower,
        role: isRoleAdmin ? 'admin' : 'user',
        walletPoints: isRoleAdmin ? 1000 : 350,
        membershipTier: isRoleAdmin ? 'Platinum' : 'Silver',
        referralCode: 'SANDBOX',
        badges: isRoleAdmin ? ['Master Creator', 'Welcome Administrator'] : ['First Welcome Reward', 'Offline Mode Active'],
        streakDays: isRoleAdmin ? 5 : 2
      };
      
      const token = jwt.sign({ id: mockUser._id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({
        message: 'Logged in successfully (Sandbox Fallback)!',
        user: {
          id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          walletPoints: mockUser.walletPoints,
          membershipTier: mockUser.membershipTier,
          referralCode: mockUser.referralCode
        }
      });
    }

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      message: 'Logged in successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletPoints: user.walletPoints,
        membershipTier: user.membershipTier,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Google OAuth Login
const googleLoginUser = async (req, res) => {
  try {
    const { email, name, sub } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Google credential properties missing.' });
    }

    const emailLower = email.toLowerCase().trim();

    if (!isDbConnected()) {
      console.log('[Database Offline] Simulating Google login under sandbox.');
      const mockUser = {
        _id: 'mock_google_' + Math.random().toString(36).substr(2, 9),
        name: name || 'Google Sandbox User',
        email: emailLower,
        role: 'user',
        walletPoints: 100,
        membershipTier: 'Silver',
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        badges: ['First Welcome Reward', 'Google Sandbox Mode']
      };
      
      const token = jwt.sign({ id: mockUser._id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({
        message: 'Logged in with Google successfully (Sandbox Fallback)!',
        user: {
          id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          walletPoints: mockUser.walletPoints,
          membershipTier: mockUser.membershipTier,
          referralCode: mockUser.referralCode
        }
      });
    }

    let user = await User.findOne({ email: emailLower });

    if (!user) {
      const dummyPassword = await bcrypt.hash(Math.random().toString(), 10);
      user = new User({
        name: name || 'Google User',
        email: emailLower,
        password: dummyPassword,
        googleId: sub || 'google_' + Math.random().toString(36).substr(2, 9),
        walletPoints: 100,
        lifetimePointsEarned: 100
      });
      await user.save();

      await WalletTransaction.create({
        user: user._id,
        amount: 100,
        type: 'credit',
        description: 'Google Registration Welcome Points'
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      message: 'Logged in with Google successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletPoints: user.walletPoints,
        membershipTier: user.membershipTier,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Current Session Info
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ user: null });
    }
    
    if (!isDbConnected()) {
      console.log('[Database Offline] Resolving mock current session details.');
      const isRoleAdmin = req.user.id === 'mock_admin_999';
      const mockUser = {
        id: req.user.id,
        name: req.user.id === 'mock_admin_999' ? 'LUXE Administrator' : (req.user.name || 'Sandbox Tester'),
        email: req.user.email || 'tester@luxe.com',
        role: isRoleAdmin ? 'admin' : 'user',
        walletPoints: isRoleAdmin ? 1000 : 350,
        membershipTier: isRoleAdmin ? 'Platinum' : 'Silver',
        referralCode: 'SANDBOX',
        badges: isRoleAdmin ? ['Master Creator', 'Welcome Administrator'] : ['First Welcome Reward', 'Offline Mode Active'],
        streakDays: isRoleAdmin ? 5 : 2
      };
      return res.json({ user: mockUser });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      const today = new Date().toDateString();
      if (!user.lastLoginDate || user.lastLoginDate.toDateString() !== today) {
        user.lastLoginDate = new Date();
        user.walletPoints = (user.walletPoints || 0) + 10;
        user.lifetimePointsEarned = (user.lifetimePointsEarned || 0) + 10;
        user.streakDays = (user.streakDays || 0) + 1;
        user.updateMembershipTier();
        await user.save();

        // Log transaction
        await WalletTransaction.create({
          user: user._id,
          amount: 10,
          type: 'credit',
          description: 'LUXE Daily Login Streak Bonus (+10 pts)'
        });
      }
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout User
const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully!' });
};

module.exports = {
  registerUser,
  loginUser,
  googleLoginUser,
  getMe,
  logoutUser
};
