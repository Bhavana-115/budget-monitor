const express = require('express');
const {
  exportUtilizationCSV,
  exportExpendituresCSV
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/utilization.csv', exportUtilizationCSV);
router.get('/expenditures.csv', exportExpendituresCSV);

module.exports = router;
