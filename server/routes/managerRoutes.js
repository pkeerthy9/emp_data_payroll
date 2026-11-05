const express = require('express');
const router = express.Router();

const {
  getMyTeam,
  getTeamAttendance,
  getManagerDashboard
} = require('../controller/managerController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// All manager routes require manager authentication.
router.use(protect, authorize('manager'));

// Manager dashboard summary.
router.get('/dashboard', getManagerDashboard);

// Employees assigned to this manager.
router.get('/team', getMyTeam);

// Today's attendance for this manager's team.
router.get('/attendance', getTeamAttendance);

module.exports = router;