const asyncHandler = require('express-async-handler');
const Department = require('../models/Department');
const logAction = require('../utils/logAction');

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  const department = await Department.create({ name, code, description });

  await logAction({
    user: req.user._id,
    action: 'CREATE_DEPARTMENT',
    entityType: 'Department',
    entityId: department._id,
    details: { name, code },
    req
  });

  res.status(201).json(department);
});

// @desc    List all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort('name');
  res.json(departments);
});

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  Object.assign(department, req.body);
  await department.save();

  await logAction({
    user: req.user._id,
    action: 'UPDATE_DEPARTMENT',
    entityType: 'Department',
    entityId: department._id,
    details: req.body,
    req
  });

  res.json(department);
});

module.exports = { createDepartment, getDepartments, updateDepartment };
