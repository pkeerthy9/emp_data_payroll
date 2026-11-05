const express = require('express');
const router = express.Router();

const {
  checkIn,
  checkOut,
  getMyAttendanceHistory,
  getMyAttendanceSummary,
  getAllAttendanceToday,
  getAttendanceReports
} = require('../controller/attendanceController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// Employee GPS check-in.
router.post('/check-in', protect, authorize('employee'), checkIn);

// Employee GPS check-out.
router.post('/check-out', protect, authorize('employee'), checkOut);

// Get the logged-in employee's attendance history.
router.get('/my-history', protect, authorize('employee'), getMyAttendanceHistory);

// Get the logged-in employee's monthly attendance summary.
router.get('/my-summary', protect, authorize('employee'), getMyAttendanceSummary);

// Admin can view today's attendance for all employees.
router.get('/admin/today', protect, authorize('admin'), getAllAttendanceToday);

// Admin can view attendance reports for a selected date range.
router.get('/admin/reports', protect, authorize('admin'), getAttendanceReports);

module.exports = router;