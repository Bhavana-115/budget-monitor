const asyncHandler = require('express-async-handler');
const Expenditure = require('../models/Expenditure');
const Budget = require('../models/Budget');
const logAction = require('../utils/logAction');
const { ROLES } = require('../config/constants');
const {
  detectTransactionSpike,
  runAnomalyDetection
} = require('../services/monitoringService');

// @desc    Record a new expenditure transaction
// @route   POST /api/expenditures
// @access  Private/Finance Officer, Department Head
const createExpenditure = asyncHandler(async (req, res) => {
  const { budget: budgetId, amountSpent, category, date, description } = req.body;

  const budget = await Budget.findById(budgetId);
  if (!budget) {
    res.status(404);
    throw new Error('Referenced budget not found');
  }

  // Department Heads may only record spend for their own department
  if (
    req.user.role === ROLES.DEPARTMENT_HEAD &&
    String(budget.department) !== String(req.user.department)
  ) {
    res.status(403);
    throw new Error('You may only record expenditure for your own department');
  }

  const expenditure = await Expenditure.create({
    budget: budgetId,
    department: budget.department,
    amountSpent,
    category,
    date,
    description,
    supportingDocument: req.file ? `/uploads/${req.file.filename}` : undefined,
    recordedBy: req.user._id
  });

  await logAction({
    user: req.user._id,
    action: 'CREATE_EXPENDITURE',
    entityType: 'Expenditure',
    entityId: expenditure._id,
    details: { budget: budgetId, amountSpent, category },
    req
  });

  // Run detection asynchronously so the response isn't held up, but await here
  // for simplicity/reliability in this reference implementation.
  const spikeAlert = await detectTransactionSpike(expenditure);
  const anomalyAlerts = await runAnomalyDetection(budgetId);

  res.status(201).json({
    expenditure,
    alertsTriggered: [spikeAlert, ...anomalyAlerts].filter(Boolean)
  });
});

// @desc    List expenditures (filterable by budget/department/date range)
// @route   GET /api/expenditures
// @access  Private
const getExpenditures = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === ROLES.DEPARTMENT_HEAD) {
    query.department = req.user.department;
  } else if (req.query.department) {
    query.department = req.query.department;
  }

  if (req.query.budget) query.budget = req.query.budget;
  if (req.query.category) query.category = req.query.category;

  if (req.query.from || req.query.to) {
    query.date = {};
    if (req.query.from) query.date.$gte = new Date(req.query.from);
    if (req.query.to) query.date.$lte = new Date(req.query.to);
  }

  const expenditures = await Expenditure.find(query)
    .populate('budget', 'projectName financialYear allocatedAmount')
    .populate('department', 'name code')
    .populate('recordedBy', 'name email')
    .sort('-date');

  res.json(expenditures);
});

// @desc    Update an expenditure record
// @route   PUT /api/expenditures/:id
// @access  Private/Finance Officer, Admin
const updateExpenditure = asyncHandler(async (req, res) => {
  const expenditure = await Expenditure.findById(req.params.id);
  if (!expenditure) {
    res.status(404);
    throw new Error('Expenditure not found');
  }

  const editableFields = ['amountSpent', 'category', 'date', 'description'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) expenditure[field] = req.body[field];
  });

  await expenditure.save();

  await logAction({
    user: req.user._id,
    action: 'UPDATE_EXPENDITURE',
    entityType: 'Expenditure',
    entityId: expenditure._id,
    details: req.body,
    req
  });

  // Re-run detection since amount may have changed
  await runAnomalyDetection(expenditure.budget);

  res.json(expenditure);
});

module.exports = { createExpenditure, getExpenditures, updateExpenditure };
