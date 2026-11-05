
import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Check, X } from 'lucide-react';
import api from '../services/api';
import './NotificationBell.css';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetches notifications belonging to the logged-in user.
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get('/notifications');

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Notification loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loads notifications when the component opens and refreshes periodically.
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Marks one notification as read.
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (error) {
      console.error('Unable to mark notification as read:', error);
    }
  };

  // Marks every notification as read.
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      await fetchNotifications();
    } catch (error) {
      console.error('Unable to mark all notifications as read:', error);
    }
  };

  return (
    <div className="notification-container">
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        type="button"
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="notification-backdrop"
            onClick={() => setIsOpen(false)}
          />

          <div className="notification-dropdown">
            <div className="notification-heading">
              <div>
                <h3>Notifications</h3>
                <span>{unreadCount} unread</span>
              </div>

              <button
                className="notification-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                className="notification-read-all"
                onClick={markAllAsRead}
                type="button"
              >
                <CheckCheck size={16} />
                Mark all as read
              </button>
            )}

            <div className="notification-list">
              {loading && notifications.length === 0 ? (
                <p className="notification-empty">Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={25} />
                  <p>You're all caught up!</p>
                  <span>No notifications yet.</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`notification-item ${
                      notification.isRead ? 'read' : 'unread'
                    }`}
                  >
                    <div className="notification-item-content">
                      <div className="notification-item-title">
                        <strong>{notification.title}</strong>
                        {!notification.isRead && (
                          <span className="notification-unread-dot" />
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <span className="notification-date">
                        {new Date(notification.createdAt).toLocaleString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }
                        )}
                      </span>
                    </div>

                    {!notification.isRead && (
                      <button
                        className="notification-mark-read"
                        onClick={() => markAsRead(notification._id)}
                        title="Mark as read"
                        type="button"
                      >
                        <Check size={17} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
