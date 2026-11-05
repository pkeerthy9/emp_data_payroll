
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const payrollManagementRoutes = require('./routes/payrollManagementRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const managerRoutes = require('./routes/managerRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const { protect, authorize } = require('./middleware/authMiddleware');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/payroll-management', payrollManagementRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TrackPay API is running successfully!'
  });
});

// Protected profile route
app.get('/api/auth/profile', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Protected profile accessed successfully',
    user: req.user
  });
});

// Admin-only route
app.get(
  '/api/auth/admin',
  protect,
  authorize('admin'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome, TrackPay Admin!'
    });
  }
);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TrackPay server running on port ${PORT}`);
});
