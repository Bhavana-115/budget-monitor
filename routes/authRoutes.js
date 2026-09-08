const express = require('express');
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.post('/login', loginUser);

// Registering new users is restricted to Admins once the system is bootstrapped.
// (Use utils/seed.js to create the very first Admin account.)
router.post('/register', protect, authorize(ROLES.ADMIN), registerUser);

router.get('/profile', protect, getProfile);

module.exports = router;
