const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const ThresholdConfig = require('../models/ThresholdConfig');
const logAction = require('../utils/logAction');

// @desc    List all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate('department', 'name code').sort('name');
  res.json(users);
});

// @desc    Activate/deactivate a user
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const setUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isActive = req.body.isActive;
  await user.save();

  await logAction({
    user: req.user._id,
    action: 'UPDATE_USER_STATUS',
    entityType: 'User',
    entityId: user._id,
    details: { isActive: user.isActive },
    req
  });

  res.json(user);
});

// @desc    Get current detection thresholds
// @route   GET /api/admin/thresholds
// @access  Private/Admin
const getThresholds = asyncHandler(async (req, res) => {
  const config = await ThresholdConfig.getActive();
  res.json(config);
});

// @desc    Update detection thresholds
// @route   PUT /api/admin/thresholds
// @access  Private/Admin
const updateThresholds = asyncHandler(async (req, res) => {
  const config = await ThresholdConfig.getActive();

  const editableFields = ['underUtilizationPercent', 'timeElapsedPercent', 'spikeMultiplier'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) config[field] = req.body[field];
  });
  config.updatedBy = req.user._id;
  await config.save();

  await logAction({
    user: req.user._id,
    action: 'UPDATE_THRESHOLDS',
    entityType: 'ThresholdConfig',
    entityId: config._id,
    details: req.body,
    req
  });

  res.json(config);
});

// @desc    View audit logs (most recent first)
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 100;
  const logs = await AuditLog.find()
    .populate('user', 'name email role')
    .sort('-createdAt')
    .limit(limit);
  res.json(logs);
});

module.exports = { getUsers, setUserStatus, getThresholds, updateThresholds, getAuditLogs };
