const express = require('express');
const {
  getUsers,
  setUserStatus,
  getThresholds,
  updateThresholds,
  getAuditLogs
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get('/users', getUsers);
router.patch('/users/:id/status', setUserStatus);
router.route('/thresholds').get(getThresholds).put(updateThresholds);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
