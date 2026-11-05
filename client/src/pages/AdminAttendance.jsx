
import { useEffect, useState } from 'react';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import './AdminAttendance.css';
// Convert attendance timestamps into readable local time.
const formatTime = (value) => {
  if (!value) return '--';

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};
// Display working hours in a readable hours-and-minutes format.
const formatHours = (hours) => {
  if (hours === undefined || hours === null) return '--';

  const totalMinutes = Math.round(Number(hours) * 60);

  if (totalMinutes === 0) return '0 min';

  const wholeHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (wholeHours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${wholeHours} hrs`;
  }

  return `${wholeHours} hrs ${remainingMinutes} min`;
};

const getLocationLink = (location) => {
  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return null;
  }

  return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
};

function AdminAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/attendance/admin/today');

      setAttendance(response.data.attendance || []);
    } catch (err) {
      console.error('Admin attendance error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load employee attendance.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const totalEmployees = attendance.length;

  const presentEmployees = attendance.filter(
    (record) =>
      record.status === 'present' ||
      record.status === 'late' ||
      record.status === 'half-day'
  ).length;

  const activeSessions = attendance.filter(
    (record) => record.isTrackingActive
  ).length;

  const completedSessions = attendance.filter(
    (record) => record.checkOut?.time
  ).length;

  return (
    <main className="admin-attendance-page">

      <header className="admin-attendance-header">
        
        <div>
          <h1>Attendance & GPS Monitoring</h1>
          <p>Monitor employee attendance and work-session GPS activity.</p>
        </div>

        <button
          className="attendance-refresh-btn"
          onClick={fetchAttendance}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </header>

      <section className="attendance-summary-grid">

        <div className="attendance-summary-card">
          <span>Attendance Records Today</span>
          <strong>{totalEmployees}</strong>
        </div>

        <div className="attendance-summary-card">
          <span>Present Employees</span>
          <strong>{presentEmployees}</strong>
        </div>

        <div className="attendance-summary-card">
          <span>Active GPS Sessions</span>
          <strong>{activeSessions}</strong>
        </div>

        <div className="attendance-summary-card">
          <span>Completed Sessions</span>
          <strong>{completedSessions}</strong>
        </div>

      </section>

      <section className="attendance-section">

        <div className="attendance-section-heading">
          <h2>Today's Employee Attendance</h2>
          <span>{new Date().toLocaleDateString()}</span>
        </div>

        {loading ? (
          <div className="attendance-loading">
            Loading attendance records...
          </div>
        ) : error ? (
          <div className="attendance-error">
            {error}
            <button onClick={fetchAttendance}>Try again</button>
          </div>
        ) : attendance.length === 0 ? (
          <div className="attendance-empty">
            No attendance records found for today.
          </div>
        ) : (
          <div className="attendance-table-wrapper">

            <table className="admin-attendance-table">

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>GPS Session</th>
                  <th>Location</th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((record) => {
                  const employee = record.employee;
                  const user = employee?.user;

                  // Determine the employee's current attendance status.
const displayStatus = !record.checkIn?.time
  ? 'Not Checked In'
  : !record.checkOut?.time
    ? 'On Duty'
    : record.status === 'half-day'
      ? 'Half Day'
      : record.status === 'late'
        ? 'Late · Checked Out'
        : 'Checked Out';

const statusClass = !record.checkIn?.time
  ? 'not-checked-in'
  : !record.checkOut?.time
    ? 'on-duty'
    : record.status === 'half-day'
      ? 'half-day'
      : record.status === 'late'
        ? 'late'
        : 'checked-out';
                  const checkInLocation = getLocationLink(
                    record.checkIn?.location
                  );

                  const checkOutLocation = getLocationLink(
                    record.checkOut?.location
                  );

                  return (
                    <tr key={record._id}>

                      <td>
                        <span className="attendance-employee-name">
                          {user?.name || 'Unknown Employee'}
                        </span>

                        <span className="attendance-employee-email">
                          {user?.email || '--'}
                        </span>
                      </td>

                      <td>{employee?.employeeId || '--'}</td>

                      <td>{employee?.department || '--'}</td>

                      <td>{formatTime(record.checkIn?.time)}</td>

                      <td>{formatTime(record.checkOut?.time)}</td>

                      <td>{formatHours(record.workingHours)}</td>

                      <td>
                        <span className={`attendance-status ${statusClass}`}>
  {displayStatus}
</span>
                      </td>

                      <td>
                        {record.isTrackingActive ? (
                          <span className="gps-active">
                            ● Active
                          </span>
                        ) : (
                          <span className="gps-inactive">
                            ● Inactive
                          </span>
                        )}
                      </td>

                      <td>
                        {checkInLocation ? (
                          <a
                            className="attendance-location"
                            href={checkInLocation}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Check-in map
                          </a>
                        ) : (
                          '--'
                        )}

                        {checkOutLocation && (
                          <>
                            {' / '}
                            <a
                              className="attendance-location"
                              href={checkOutLocation}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Check-out map
                            </a>
                          </>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>

          </div>
        )}

        <div className="attendance-privacy-note">
          GPS information is recorded at employee check-in and check-out
          with location permission. This page displays those recorded
          locations; it does not provide continuous live tracking.
        </div>

      </section>

    </main>
  );
}

export default AdminAttendance;
