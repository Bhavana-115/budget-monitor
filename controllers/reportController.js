const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const Expenditure = require('../models/Expenditure');
const { getAllUtilizations } = require('../services/monitoringService');
const { ROLES } = require('../config/constants');

// @desc    Download department-wise utilization report as CSV
// @route   GET /api/reports/utilization.csv
// @access  Private
const exportUtilizationCSV = asyncHandler(async (req, res) => {
  const departmentId =
    req.user.role === ROLES.DEPARTMENT_HEAD ? req.user.department : req.query.department;

  const utilizations = await getAllUtilizations(departmentId);

  const rows = utilizations.map((u) => ({
    department: u.budget.department.name,
    financialYear: u.budget.financialYear,
    allocatedAmount: u.budget.allocatedAmount,
    totalSpent: u.totalSpent,
    remainingAmount: u.remainingAmount,
    utilizationPercent: u.utilizationPercent,
    timeElapsedPercent: u.timeElapsedPercent
  }));

  const parser = new Parser();
  const csv = parser.parse(rows);

  res.header('Content-Type', 'text/csv');
  res.attachment('utilization-report.csv');
  res.send(csv);
});

// @desc    Download raw expenditure transactions as CSV
// @route   GET /api/reports/expenditures.csv
// @access  Private
const exportExpendituresCSV = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === ROLES.DEPARTMENT_HEAD) {
    query.department = req.user.department;
  } else if (req.query.department) {
    query.department = req.query.department;
  }

  const expenditures = await Expenditure.find(query)
    .populate('department', 'name')
    .populate('budget', 'projectName financialYear')
    .lean();

  const rows = expenditures.map((e) => ({
    date: e.date,
    department: e.department ? e.department.name : '',
    project: e.budget ? e.budget.projectName : '',
    category: e.category,
    amountSpent: e.amountSpent,
    description: e.description
  }));

  const parser = new Parser();
  const csv = parser.parse(rows);

  res.header('Content-Type', 'text/csv');
  res.attachment('expenditure-report.csv');
  res.send(csv);
});

module.exports = { exportUtilizationCSV, exportExpendituresCSV };
