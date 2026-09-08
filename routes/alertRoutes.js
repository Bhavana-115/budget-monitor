const express = require('express');
const { getAlerts, resolveAlert, triggerScan } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/', getAlerts);
router.post('/scan', authorize(ROLES.ADMIN, ROLES.FINANCE_OFFICER), triggerScan);
router.patch('/:id/resolve', authorize(ROLES.ADMIN, ROLES.FINANCE_OFFICER), resolveAlert);

module.exports = router;
