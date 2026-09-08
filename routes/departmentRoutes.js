const express = require('express');
const {
  createDepartment,
  getDepartments,
  updateDepartment
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.route('/').get(getDepartments).post(authorize(ROLES.ADMIN), createDepartment);
router.route('/:id').put(authorize(ROLES.ADMIN), updateDepartment);

module.exports = router;
