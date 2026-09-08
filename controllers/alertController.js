const asyncHandler = require('express-async-handler');
const Alert = require('../models/Alert');
const logAction = require('../utils/logAction');
const { ROLES } = require('../config/constants');
const { runFullSystemScan } = require('../services/monitoringService');

// @desc    List alerts (filterable by department/type/resolved status)
// @route   GET /api/alerts
// @access  Private
const getAlerts = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === ROLES.DEPARTMENT_HEAD) {
    query.department = req.user.department;
  } else if (req.query.department) {
    query.department = req.query.department;
  }

  if (req.query.alertType) query.alertType = req.query.alertType;
  if (req.query.isResolved !== undefined) query.isResolved = req.query.isResolved === 'true';

  const alerts = await Alert.find(query)
    .populate('department', 'name code')
    .populate('budget', 'projectName financialYear')
    .sort('-createdAt');

  res.json(alerts);
});

// @desc    Mark an alert as resolved
// @route   PATCH /api/alerts/:id/resolve
// @access  Private/Admin, Finance Officer
const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  alert.isResolved = true;
  alert.resolvedBy = req.user._id;
  alert.resolvedAt = new Date();
  await alert.save();

  await logAction({
    user: req.user._id,
    action: 'RESOLVE_ALERT',
    entityType: 'Alert',
    entityId: alert._id,
    req
  });

  res.json(alert);
});

// @desc    Manually trigger a full anomaly-detection scan across all budgets
// @route   POST /api/alerts/scan
// @access  Private/Admin, Finance Officer
const triggerScan = asyncHandler(async (req, res) => {
  const newAlerts = await runFullSystemScan();
  res.json({ scanned: true, newAlertsCount: newAlerts.length, newAlerts });
});

module.exports = { getAlerts, resolveAlert, triggerScan };
