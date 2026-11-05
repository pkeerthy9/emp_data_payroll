
const express = require('express');
const router = express.Router();

const {
  getPayrollHistory,
  approvePayroll,
  rejectPayroll,
  markPayrollAsPaid
} = require('../controller/payrollManagementController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Admin-only payroll management
router.get('/history', protect, authorize('admin'), getPayrollHistory);
router.patch('/:id/approve', protect, authorize('admin'), approvePayroll);
router.patch('/:id/reject', protect, authorize('admin'), rejectPayroll);
router.patch('/:id/pay', protect, authorize('admin'), markPayrollAsPaid);

module.exports = router;
