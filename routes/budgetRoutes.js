const express = require('express');
const {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  getUtilizationSummary
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/utilization/summary', getUtilizationSummary);

router
  .route('/')
  .get(getBudgets)
  .post(authorize(ROLES.ADMIN, ROLES.FINANCE_OFFICER), createBudget);

router
  .route('/:id')
  .get(getBudgetById)
  .put(authorize(ROLES.ADMIN, ROLES.FINANCE_OFFICER), updateBudget);

module.exports = router;
