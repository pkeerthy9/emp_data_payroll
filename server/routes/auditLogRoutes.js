const express = require('express');
const router = express.Router();

const {
  getAuditLogs
} = require('../controller/auditLogController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// Only authenticated administrators can access audit logs.
router.use(protect, authorize('admin'));

// Retrieve audit logs.
router.get('/', getAuditLogs);

module.exports = router;