const express = require('express');
const router = express.Router();
const { getUsers, getStats, toggleUserStatus, updateUserPlan } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/users', getUsers);
router.get('/stats', getStats);
router.put('/users/:id/toggle', toggleUserStatus);
router.put('/users/:id/plan', updateUserPlan);

module.exports = router;
