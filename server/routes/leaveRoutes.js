
const express = require('express');
const router = express.Router();

const {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getTeamLeaves,
  getAllLeaves,
  reviewLeave
} = require('../controller/leaveController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// All leave routes require authentication.
router.use(protect);

// Employee routes.
router.post('/apply', authorize('employee'), applyLeave);
router.get('/my', authorize('employee'), getMyLeaves);
router.patch('/:id/cancel', authorize('employee'), cancelLeave);

// Manager routes.
router.get('/team', authorize('manager'), getTeamLeaves);

// Admin route.
router.get('/all', authorize('admin'), getAllLeaves);

// Manager and admin can review leave applications.
router.patch(
  '/:id/review',
  authorize('manager', 'admin'),
  reviewLeave
);

module.exports = router;
