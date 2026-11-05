import { useEffect, useState } from 'react';
import api from '../services/api';
import './GPSTracking.css';

// Convert GPS coordinates into a Google Maps link.
const getMapLink = (location) => {
  if (
    !location ||
    !Number.isFinite(Number(location.latitude)) ||
    !Number.isFinite(Number(location.longitude))
  ) {
    return null;
  }

  return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
};

// Display recorded attendance times.
const formatTime = (value) => {
  if (!value) return '--';

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

function GPSTracking() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load today's recorded GPS attendance information.
  const fetchGPSData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/attendance/admin/today');

      setAttendance(response.data.attendance || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load GPS records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGPSData();
  }, []);

    // Show every employee, including those without GPS records.
const gpsRecords = attendance;

  const activeSessions = attendance.filter(
    (record) => record.isTrackingActive
  ).length;

  return (
    <div className="gps-tracking-page">

      <header className="gps-header">
        <div>
          <h1>GPS Tracking</h1>
          <p>Recorded employee check-in and check-out locations</p>
        </div>

        <button
          className="gps-refresh-btn"
          onClick={fetchGPSData}
        >
          ↻ Refresh
        </button>
      </header>

      <div className="gps-summary-grid">

        <div className="gps-summary-card">
          <span>Employees Listed</span>
          <strong>{gpsRecords.length}</strong>
        </div>

        <div className="gps-summary-card">
          <span>Active GPS Sessions</span>
          <strong>{activeSessions}</strong>
        </div>

        <div className="gps-summary-card">
          <span>Check-in Locations</span>
          <strong>
            {attendance.filter(
              (record) => getMapLink(record.checkIn?.location)
            ).length}
          </strong>
        </div>

        <div className="gps-summary-card">
          <span>Check-out Locations</span>
          <strong>
            {attendance.filter(
              (record) => getMapLink(record.checkOut?.location)
            ).length}
          </strong>
        </div>

      </div>

      <section className="gps-section">

        <div className="gps-section-heading">
          <h2>Employee Location Records</h2>
          <span>{gpsRecords.length} records with GPS locations</span>
        </div>

        {loading ? (
          <div className="gps-message">Loading GPS records...</div>
        ) : error ? (
          <div className="gps-message gps-error">{error}</div>
        ) : gpsRecords.length === 0 ? (
          <div className="gps-message">
            No recorded GPS locations are available today.
          </div>
        ) : (

          <div className="gps-table-wrapper">
            <table className="gps-table">

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Check-in Time</th>
                  <th>Check-in Location</th>
                  <th>Check-out Time</th>
                  <th>Check-out Location</th>
                  <th>GPS Session</th>
                </tr>
              </thead>

              <tbody>
                {gpsRecords.map((record) => {
                  const employee = record.employee;
                  const user = employee?.user;

                  const checkInMap = getMapLink(
                    record.checkIn?.location
                  );

                  const checkOutMap = getMapLink(
                    record.checkOut?.location
                  );

                  return (
                    <tr key={record._id}>

                      <td>
                        <strong>
                          {user?.name || 'Unknown Employee'}
                        </strong>
                        <small>{user?.email || '--'}</small>
                      </td>

                      <td>{employee?.employeeId || '--'}</td>

                      <td>
                        {formatTime(record.checkIn?.time)}
                      </td>

                      <td>
                        {checkInMap ? (
                          <a
                            href={checkInMap}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gps-map-link"
                          >
                            <span>📍</span> View Check-in
                          </a>
                        ) : '--'}
                      </td>

                      <td>
                        {formatTime(record.checkOut?.time)}
                      </td>

                      <td>
                        {checkOutMap ? (
                          <a
                            href={checkOutMap}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gps-map-link"
                          >
                            <span>📍</span> View Check-out
                          </a>
                        ) : '--'}
                      </td>

                      <td>
                        <span
                          className={
                            record.isTrackingActive
                              ? 'gps-session-active'
                              : 'gps-session-inactive'
                          }
                        >
                          {record.isTrackingActive
                            ? '● Active'
                            : '● Inactive'}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        <div className="gps-privacy-note">
          <strong>Privacy & Location Safety</strong>
          <p>
            GPS information is recorded only during employee
            check-in and check-out with location permission.
            TrackPay does not continuously or secretly track
            employee locations.
          </p>
        </div>

      </section>
    </div>
  );
}

export default GPSTracking;