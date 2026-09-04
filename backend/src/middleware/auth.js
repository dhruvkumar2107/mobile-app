const jwt = require('jsonwebtoken');
const { findByField } = require('../models/schema');

function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id || !decoded.role) {
      return res.status(401).json({ success: false, error: 'Invalid token payload' });
    }
    const user = findByField('users', 'id', decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = findByField('users', 'id', decoded.id);
      if (user) {
        req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
      }
    }
  } catch (e) {
    // Token is invalid or expired - continue without authentication
    // This is expected for optional auth middleware
  }
  next();
}

module.exports = { auth, optionalAuth };
