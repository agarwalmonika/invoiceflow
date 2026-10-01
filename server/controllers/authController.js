const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { Subscription } = require('../models/PaymentSubscription');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, businessName, phone } = req.body;

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, businessName, phone });

    // Create free subscription
    await Subscription.create({ userId: user._id, plan: 'free', status: 'active' });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        subscriptionPlan: user.subscriptionPlan,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        subscriptionPlan: user.subscriptionPlan,
        currency: user.currency,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user data.' });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, businessName, phone, address, currency } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, businessName, phone, address, currency },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    const token = generateToken(user._id);
    res.json({ success: true, message: 'Password changed successfully.', token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password.' });
  }
};
