const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validateRegisterInput, validateLoginInput } = require('../utils/validators');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, registrationId, role } = req.body;

    // ---------- Input validation ----------
    const validation = validateRegisterInput({ name, email, password, registrationId, role });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // ---------- Duplicate checks ----------
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const existingRegId = await User.findOne({ registrationId });
    if (existingRegId) {
      return res.status(409).json({ error: 'An account with this registration ID already exists' });
    }

    // ---------- Create user ----------
    const user = await User.create({
      name,
      email,
      password, // hashed by pre-save hook
      registrationId,
      role: role || 'attendee',
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registrationId: user.registrationId,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ---------- Input validation ----------
    const validation = validateLoginInput({ email, password });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // ---------- Find user (include password for comparison) ----------
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ---------- Verify password ----------
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registrationId: user.registrationId,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user info
 * @access  Private (requires protect middleware)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registrationId: user.registrationId,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
};

module.exports = { register, login, getMe };
