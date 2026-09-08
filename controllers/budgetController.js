const asyncHandler = require('express-async-handler');
const Budget = require('../models/Budget');
const logAction = require('../utils/logAction');
const { getBudgetUtilization, getAllUtilizations } = require('../services/monitoringService');
const { ROLES } = require('../config/constants');

// @desc    Create a budget allocation
// @route   POST /api/budgets
// @access  Private/Admin, Finance Officer
const createBudget = asyncHandler(async (req, res) => {
  const {
    financialYear,
    quarter,
    department,
    projectName,
    allocatedAmount,
    allocationDate,
    periodStart,
    periodEnd
  } = req.body;

  const budget = await Budget.create({
    financialYear,
    quarter,
    department,
    projectName,
    allocatedAmount,
    allocationDate,
    periodStart,
    periodEnd,
    createdBy: req.user._id
  });

  await logAction({
    user: req.user._id,
    action: 'CREATE_BUDGET',
    entityType: 'Budget',
    entityId: budget._id,
    details: { department, allocatedAmount, financialYear },
    req
  });

  res.status(201).json(budget);
});

// @desc    List budgets (Department Heads only see their own department)
// @route   GET /api/budgets
// @access  Private
const getBudgets = asyncHandler(async (req, res) => {
  const query = { isActive: true };

  if (req.user.role === ROLES.DEPARTMENT_HEAD) {
    query.department = req.user.department;
  } else if (req.query.department) {
    query.department = req.query.department;
  }

  if (req.query.financialYear) query.financialYear = req.query.financialYear;

  const budgets = await Budget.find(query)
    .populate('department', 'name code')
    .populate('createdBy', 'name email')
    .sort('-createdAt');

  res.json(budgets);
});

// @desc    Get single budget with utilization detail
// @route   GET /api/budgets/:id
// @access  Private
const getBudgetById = asyncHandler(async (req, res) => {
  const summary = await getBudgetUtilization(req.params.id);
  if (!summary) {
    res.status(404);
    throw new Error('Budget not found');
  }
  res.json(summary);
});

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private/Admin, Finance Officer
const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }

  const editableFields = [
    'financialYear',
    'quarter',
    'projectName',
    'allocatedAmount',
    'periodStart',
    'periodEnd',
    'isActive'
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) budget[field] = req.body[field];
  });

  await budget.save();

  await logAction({
    user: req.user._id,
    action: 'UPDATE_BUDGET',
    entityType: 'Budget',
    entityId: budget._id,
    details: req.body,
    req
  });

  res.json(budget);
});

// @desc    Get utilization summary across all (or one department's) budgets
// @route   GET /api/budgets/utilization/summary
// @access  Private
const getUtilizationSummary = asyncHandler(async (req, res) => {
  const departmentId =
    req.user.role === ROLES.DEPARTMENT_HEAD ? req.user.department : req.query.department;

  const summaries = await getAllUtilizations(departmentId);
  res.json(summaries);
});

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  getUtilizationSummary
};
