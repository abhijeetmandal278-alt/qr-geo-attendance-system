const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate a signed JWT for the given user.
 * @param {object} user - Mongoose user document (needs _id and role)
 * @returns {string} signed JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = generateToken;
