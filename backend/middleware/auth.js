const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../models/models');
const JWT_SECRET = process.env.JWT_SECRET || 'luxe-super-secret-key-2026';

const isDbConnected = () => mongoose.connection.readyState === 1;

const authenticateToken = async (req, res, next) => {
  let token = req.cookies.token;

  // Fallback to Bearer headers
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isDbConnected()) {
      // In offline sandbox fallback mode, bypass database queries to prevent bufferCommands failures
      const isRoleAdmin = decoded.id === 'mock_admin_999' || (typeof decoded.id === 'string' && decoded.id.includes('admin'));
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        name: isRoleAdmin ? 'LUXE Administrator' : 'Sandbox Tester',
        email: isRoleAdmin ? 'admin@luxe.com' : 'tester@luxe.com',
        role: isRoleAdmin ? 'admin' : 'user',
        walletPoints: isRoleAdmin ? 1000 : 350,
        membershipTier: isRoleAdmin ? 'Platinum' : 'Silver',
        badges: isRoleAdmin ? ['Master Creator', 'Welcome Administrator'] : ['First Welcome Reward', 'Offline Sandbox Mode']
      };
    } else {
      const user = await User.findById(decoded.id);
      if (!user) {
        res.clearCookie('token');
        req.user = null;
      } else {
        req.user = user;
      }
    }
  } catch (err) {
    res.clearCookie('token');
    req.user = null;
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAuth,
  requireAdmin,
  JWT_SECRET
};
