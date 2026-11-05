const Notification = require('../models/notification');

// Get notifications for the logged-in user.
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch notifications.',
      error: error.message
    });
  }
};

// Mark one notification as read.
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id
      },
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to update notification.',
      error: error.message
    });
  }
};

// Mark all notifications as read.
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to update notifications.',
      error: error.message
    });
  }
};
// Create a notification for a user.
const createNotification = async ({
  recipient,
  title,
  message,
  type = 'system',
  relatedId = null
}) => {
  try {
    return await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedId
    });
  } catch (error) {
    console.error('Notification creation failed:', error.message);
    return null;
  }
};
module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification
};