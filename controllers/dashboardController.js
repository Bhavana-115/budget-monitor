const asyncHandler = require('express-async-handler');
const Budget = require('../models/Budget');
const Expenditure = require('../models/Expenditure');
const Alert = require('../models/Alert');
const { ROLES } = require('../config/constants');
const { getAllUtilizations } = require('../services/monitoringService');

// @desc    Aggregated dashboard data: KPIs + chart-ready breakdowns
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
  const departmentId =
    req.user.role === ROLES.DEPARTMENT_HEAD ? req.user.department : req.query.department;

  const utilizations = await getAllUtilizations(departmentId);

  const totalAllocated = utilizations.reduce((sum, u) => sum + u.budget.allocatedAmount, 0);
  const totalSpent = utilizations.reduce((sum, u) => sum + u.totalSpent, 0);
  const overallUtilizationPercent =
    totalAllocated > 0 ? Number(((totalSpent / totalAllocated) * 100).toFixed(2)) : 0;

  const underUtilizedCount = utilizations.filter(
    (u) => u.timeElapsedPercent >= 70 && u.utilizationPercent < 40
  ).length;
  const overspentCount = utilizations.filter((u) => u.utilizationPercent > 100).length;

  const alertQuery = departmentId ? { department: departmentId } : {};
  const [totalAlerts, unresolvedAlerts] = await Promise.all([
    Alert.countDocuments(alertQuery),
    Alert.countDocuments({ ...alertQuery, isResolved: false })
  ]);

  // Department-wise breakdown for bar/pie charts
  const departmentBreakdown = utilizations.map((u) => ({
    department: u.budget.department,
    allocatedAmount: u.budget.allocatedAmount,
    totalSpent: u.totalSpent,
    utilizationPercent: u.utilizationPercent
  }));

  // Category-wise spend breakdown (pie chart)
  const categoryMatch = departmentId ? { department: departmentId } : {};
  const categoryBreakdown = await Expenditure.aggregate([
    { $match: categoryMatch },
    { $group: { _id: '$category', total: { $sum: '$amountSpent' } } },
    { $sort: { total: -1 } }
  ]);

  // Monthly spend trend for the current financial year (line/trend chart)
  const monthlyTrend = await Expenditure.aggregate([
    { $match: categoryMatch },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: '$amountSpent' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    kpis: {
      totalAllocated,
      totalSpent,
      overallUtilizationPercent,
      underUtilizedCount,
      overspentCount,
      totalAlerts,
      unresolvedAlerts
    },
    departmentBreakdown,
    categoryBreakdown,
    monthlyTrend
  });
});

module.exports = { getDashboardSummary };
