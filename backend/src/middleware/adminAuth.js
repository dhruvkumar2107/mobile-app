const jwt = require('jsonwebtoken');
const { findByField } = require('../models/schema');

function adminAuth(req, res, next) {
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
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
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

module.exports = { adminAuth };
