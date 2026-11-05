import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CalendarDays } from 'lucide-react';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import './ManagerDashboard.css';

function ManagerDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    presentEmployees: 0,
    notCheckedIn: 0,
    activeSessions: 0,
    completedSessions: 0,
    totalWorkingHours: 0
  });

  const [team, setTeam] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashboardResponse, teamResponse, attendanceResponse] =
        await Promise.all([
          api.get('/manager/dashboard'),
          api.get('/manager/team'),
          api.get('/manager/attendance')
        ]);

      setSummary(dashboardResponse.data.summary);
      setTeam(teamResponse.data.employees || []);
      setAttendance(attendanceResponse.data.attendance || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load manager dashboard. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '--';

    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEmployeeName = (employee) => {
    return employee?.user?.name || 'Unknown employee';
  };

  if (loading) {
    return (
      <div className="manager-loading">
        Loading your manager dashboard...
      </div>
    );
  }

  return (
    <main className="manager-dashboard">
      <header className="manager-header">
        <div>
          <p className="manager-eyebrow">TRACKPAY / MANAGEMENT</p>
          <h1>Manager Dashboard</h1>
          <p>Monitor your team, attendance and work hours.</p>
        </div>
 <div className="manager-header-actions">
  <NotificationBell />
  <button
    className="manager-nav-btn"
    onClick={() => navigate('/tasks')}
  >
    <ClipboardList size={17} />
    Task Management
  </button>

  <button
    className="manager-nav-btn"
    onClick={() => navigate('/leaves')}
  >
    <CalendarDays size={17} />
    Leave Management
  </button>
</div>
        <button
          className="manager-refresh-btn"
          onClick={fetchManagerData}
        >
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div className="manager-error">
          {error}
        </div>
      )}

      <section className="manager-stats">
        <article className="manager-stat-card">
          <span>Total Employees</span>
          <h2>{summary.totalEmployees}</h2>
          <p>Assigned to your team</p>
        </article>

        <article className="manager-stat-card">
          <span>Present Today</span>
          <h2>{summary.presentEmployees}</h2>
          <p>Attendance marked</p>
        </article>

        <article className="manager-stat-card">
          <span>Not Checked In</span>
          <h2>{summary.notCheckedIn}</h2>
          <p>Awaiting check-in</p>
        </article>

        <article className="manager-stat-card">
          <span>Active Sessions</span>
          <h2>{summary.activeSessions}</h2>
          <p>Currently checked in</p>
        </article>

        <article className="manager-stat-card">
          <span>Completed Sessions</span>
          <h2>{summary.completedSessions}</h2>
          <p>Checked out today</p>
        </article>

        <article className="manager-stat-card">
          <span>Team Working Hours</span>
          <h2>{summary.totalWorkingHours}</h2>
          <p>Total hours recorded today</p>
        </article>
      </section>

      <section className="manager-panel">
        <div className="manager-panel-heading">
          <div>
            <h2>My Team</h2>
            <p>Employees assigned to you</p>
          </div>
          <span>{team.length} Employees</span>
        </div>

        {team.length === 0 ? (
          <div className="manager-empty">
            <div className="manager-empty-icon">♧</div>
            <h3>Your team is waiting</h3>
            <p>
              No employees have been assigned to you yet.
              Once the admin assigns employees, they will
              appear here.
            </p>
          </div>
        ) : (
          <div className="manager-table-wrapper">
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Email</th>
                </tr>
              </thead>

              <tbody>
                {team.map((employee) => (
                  <tr key={employee._id}>
                    <td>{getEmployeeName(employee)}</td>
                    <td>{employee.employeeId || '--'}</td>
                    <td>{employee.department || '--'}</td>
                    <td>{employee.designation || '--'}</td>
                    <td>{employee.user?.email || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="manager-panel">
        <div className="manager-panel-heading">
          <div>
            <h2>Today's Attendance</h2>
            <p>Check-in and check-out activity of your team</p>
          </div>
          <span>{attendance.length} Records</span>
        </div>

        {attendance.length === 0 ? (
          <div className="manager-empty">
            <div className="manager-empty-icon">◷</div>
            <h3>No attendance records yet</h3>
            <p>
              Your team's attendance activity will appear here
              after employees check in.
            </p>
          </div>
        ) : (
          <div className="manager-table-wrapper">
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>GPS Session</th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((record) => (
                  <tr key={record._id}>
                    <td>{getEmployeeName(record.employee)}</td>
                    <td>{formatTime(record.checkIn?.time)}</td>
                    <td>{formatTime(record.checkOut?.time)}</td>
                    <td>{record.workingHours ?? 0} hrs</td>
                    <td>
                      <span className={`manager-status ${record.status}`}>
                        {record.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          record.isTrackingActive
                            ? 'gps-active'
                            : 'gps-inactive'
                        }
                      >
                        {record.isTrackingActive
                          ? '● Active'
                          : '○ Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default ManagerDashboard;