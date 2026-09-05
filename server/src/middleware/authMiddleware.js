const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Protect routes — verify the Bearer token from the Authorization header
 * and attach the decoded payload (id, role) to req.user.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized — no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Not authorized — token has expired'
        : 'Not authorized — invalid token';
    return res.status(401).json({ error: message });
  }
};

/**
 * Restrict access to specific roles.
 * Usage: authorizeRoles('organizer')
 * @param  {...string} roles - allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — insufficient permissions' });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
