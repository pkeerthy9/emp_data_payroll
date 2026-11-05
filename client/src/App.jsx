
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import PayrollDashboard from './pages/PayrollDashboard';
import SalaryStructure from './pages/SalaryStructure';
import GeneratePayroll from './pages/GeneratePayroll';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminAttendance from './pages/AdminAttendance';
import GPSTracking from './pages/GPSTracking';
import AttendanceReports from './pages/AttendanceReports';
import TaskManagement from './pages/TaskManagement';
import Analytics from './pages/Analytics';
// Imports the admin Audit Logs page.
import AuditLogs from './pages/AuditLogs';
// Imports the shared Leave Management page.
import LeaveManagement from './pages/LeaveManagement';
// Check whether the logged-in user has permission to open a page.
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('trackpay_token');
  const savedUser = localStorage.getItem('trackpay_user');

  if (!token || !savedUser) {
    return <Navigate to="/" replace />;
  }

  let user;

  try {
    user = JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('trackpay_token');
    localStorage.removeItem('trackpay_user');
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Display this page when a user tries to access a page they are not allowed to open.
function Unauthorized() {
  const savedUser = localStorage.getItem('trackpay_user');

  let role = 'Unknown';

  try {
    role = JSON.parse(savedUser || '{}').role || 'Unknown';
  } catch {
    role = 'Invalid login data';
  }

  const switchAccount = () => {
    localStorage.removeItem('trackpay_token');
    localStorage.removeItem('trackpay_user');
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Access Denied</h1>
      <p>You do not have permission to access this page.</p>

      <p>
        Current logged-in role: <strong>{role}</strong>
      </p>

      <button onClick={switchAccount}>
        Switch Account
      </button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Admin-only Analytics page */}
<Route
  path="/analytics"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <Analytics />
    </ProtectedRoute>
  }
/>
{/* Admin-only Audit Logs page */}
<Route
  path="/audit-logs"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AuditLogs />
    </ProtectedRoute>
  }
/>
        {/* Admin-only pages */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PayrollDashboard />
              
            </ProtectedRoute>
          }
        />

        <Route
          path="/salary"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SalaryStructure />
            </ProtectedRoute>
          }
        />

        <Route
          path="/generate-payroll"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <GeneratePayroll />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Employees />
            </ProtectedRoute>
          }
        />

        {/* Admin attendance and GPS monitoring page */}
        <Route
          path="/admin-attendance"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAttendance />
            </ProtectedRoute>
          }
        />
        {/* Admin-only GPS Tracking page */}
<Route
  path="/gps-tracking"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <GPSTracking />
    </ProtectedRoute>
  }
/>
{/* Admin-only Attendance Reports page */}
<Route
  path="/attendance-reports"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AttendanceReports />
    </ProtectedRoute>
  }
/>

        {/* Employee-only page */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <Attendance />
            </ProtectedRoute>
          }
        />

        {/* Manager-only page */}
        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        {/* Allows all three user roles to access Leave Management. */}
<Route
  path="/leaves"
  element={
    <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
      <LeaveManagement />
    </ProtectedRoute>
  }
/>
{/* Task Management for Admin, Manager and Employee */}
<Route
  path="/tasks"
  element={
    <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
      <TaskManagement />
    </ProtectedRoute>
  }
/>
        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
