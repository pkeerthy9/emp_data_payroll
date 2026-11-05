const express = require('express');
const router = express.Router();

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controller/notificationController');

const { protect } = require('../middleware/authMiddleware');

// All notification routes require login.
router.use(protect);

// Get notifications for the logged-in user.
router.get('/', getMyNotifications);

// Mark all notifications as read.
router.patch('/read-all', markAllNotificationsAsRead);

// Mark one notification as read.
router.patch('/:id/read', markNotificationAsRead);

module.exports = router;