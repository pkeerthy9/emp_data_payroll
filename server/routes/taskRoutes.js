
const express = require('express');
const router = express.Router();

const {
  createTask,
  getMyTasks,
  getAssignedTasks,
  updateTaskStatus
} = require('../controller/taskController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Admin and managers can create and view assigned tasks.
router.post('/', authorize('admin', 'manager'), createTask);
router.get('/assigned', authorize('admin', 'manager'), getAssignedTasks);

// Employees can view and update their own tasks.
router.get('/my', authorize('employee'), getMyTasks);
router.patch('/:id/status', authorize('employee'), updateTaskStatus);

module.exports = router;
