const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const logAction = require('../utils/logAction');

// @desc    Register a new user (Admin creates Finance Officers / Department Heads)
// @route   POST /api/auth/register
// @access  Private/Admin (except the very first user, see note below)
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({ name, email, password, role, department });

  await logAction({
    user: req.user ? req.user._id : user._id,
    action: 'CREATE_USER',
    entityType: 'User',
    entityId: user._id,
    details: { email, role },
    req
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    token: generateToken(user._id)
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact an administrator.');
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    token: generateToken(user._id)
  });
});

// @desc    Get current logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department', 'name code');
  res.json(user);
});

module.exports = { registerUser, loginUser, getProfile };
