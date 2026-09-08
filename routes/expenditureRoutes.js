const express = require('express');
const {
  createExpenditure,
  getExpenditures,
  updateExpenditure
} = require('../controllers/expenditureController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getExpenditures)
  .post(
    authorize(ROLES.ADMIN, ROLES.FINANCE_OFFICER, ROLES.DEPARTMENT_HEAD),
    upload.single('supportingDocument'),
    createExpenditure
  );

router
  .route('/:id')
  .put(authorize(ROLES.ADMIN, ROLES.FINANCE_OFFICER), updateExpenditure);

module.exports = router;
