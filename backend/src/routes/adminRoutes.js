const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Restrict all routes below to Authenticated ADMIN users
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users', adminController.getUsers);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/metrics', adminController.getPlatformMetrics);

module.exports = router;
