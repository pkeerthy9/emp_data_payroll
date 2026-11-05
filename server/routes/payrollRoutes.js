const express = require('express');
const router = express.Router();
const { downloadPayslip } = require('../controller/payslipController');

const {
  generatePayroll
} = require('../controller/payrollController');

const {
  getPayrollHistory,
  approvePayroll,
  rejectPayroll,
  markPayrollAsPaid
} = require('../controller/payrollManagementController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All payroll routes require an authenticated user.
router.use(protect);

// Admin-only payroll generation.
router.post('/generate', authorize('admin'), generatePayroll);

// Admin-only payroll history.
router.get('/history', authorize('admin'), getPayrollHistory);
// Employees can view only their own approved or paid payroll history.
router.get('/my-history', authorize('employee'), require('../controller/payrollManagementController').getMyPayrollHistory);

// Admin-only payroll approval.
router.patch('/:id/approve', authorize('admin'), approvePayroll);

// Admin-only payroll rejection.
router.patch('/:id/reject', authorize('admin'), rejectPayroll);

// Admin-only payment status update.
router.patch('/:id/paid', authorize('admin'), markPayrollAsPaid);
// Admin and employees can download approved or paid payslips.
router.get(
  '/:id/payslip',
  authorize('admin', 'employee'),
  downloadPayslip
);
module.exports = router;