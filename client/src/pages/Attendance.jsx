
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  LogIn,
  LogOut,
  Navigation,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ReceiptText,
Download
} from 'lucide-react';

import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import './Attendance.css';

const Attendance = () => {
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
const [payrollLoading, setPayrollLoading] = useState(false);
const [downloadingPayslip, setDownloadingPayslip] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [message, setMessage] = useState({
    type: '',
    text: ''
  });

  const isTracking = attendance?.isTrackingActive === true;
  const checkedIn = Boolean(attendance?.checkIn?.time);
  const checkedOut = Boolean(attendance?.checkOut?.time);

  const today = new Date();

  // Converts attendance timestamps into readable local time.
  const formatTime = (date) => {
    if (!date) return '--:--';

    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formats attendance dates.
  const formatDate = (date) => {
    if (!date) return '--';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Displays success and error messages.
  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  // Loads attendance history and monthly summary.
  const loadAttendanceData = async () => {
    try {
      setLoading(true);

      const [historyResponse, summaryResponse] = await Promise.all([
        api.get('/attendance/my-history'),
        api.get('/attendance/my-summary')
      ]);

      const records = historyResponse.data.attendance || [];

      setHistory(records);
      setSummary(summaryResponse.data.summary || null);

      const todayRecord = records.find((record) => {
        return (
          new Date(record.date).toDateString() ===
          new Date().toDateString()
        );
      });

      setAttendance(todayRecord || null);
    } catch (error) {
      showMessage(
        'error',
        error.response?.data?.message ||
          'Unable to load attendance information.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  loadAttendanceData();
  loadPayrollHistory();
}, []);
// Load the logged-in employee's approved and paid payslips.
const loadPayrollHistory = async () => {
  try {
    setPayrollLoading(true);

    const response = await api.get('/payroll/my-history');

    setPayrollHistory(response.data.payrolls || []);
  } catch (error) {
    showMessage(
      'error',
      error.response?.data?.message ||
        'Unable to load your payslip history.'
    );
  } finally {
    setPayrollLoading(false);
  }
};
// Download an employee's own payslip as a PDF.
const handleDownloadPayslip = async (payrollId) => {
  try {
    setDownloadingPayslip(payrollId);

    const response = await api.get(
      `/payroll/${payrollId}/payslip`,
      { responseType: 'blob' }
    );

    const pdfBlob = new Blob([response.data], {
      type: 'application/pdf'
    });

    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `TrackPay_Payslip_${payrollId}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(downloadUrl);

    showMessage('success', 'Payslip downloaded successfully.');
  } catch (error) {
    showMessage(
      'error',
      'Unable to download payslip. Please try again.'
    );
  } finally {
    setDownloadingPayslip('');
  }
};
  // Requests the employee's current GPS location.
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Your browser does not support GPS location.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Unable to get your location.';

          if (error.code === error.PERMISSION_DENIED) {
            errorMessage =
              'Location permission was denied. Please allow location access in your browser.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Your current location is unavailable.';
          } else if (error.code === error.TIMEOUT) {
            errorMessage = 'Location request timed out. Please try again.';
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  };

  // Checks the employee in after location consent.
  const handleCheckIn = async () => {
    if (!locationConsent) {
      showMessage(
        'error',
        'Please agree to location permission before checking in.'
      );
      return;
    }

    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });

      const location = await getCurrentLocation();

      const response = await api.post('/attendance/check-in', {
        ...location,
        locationConsent: true
      });

      showMessage('success', response.data.message);

      await loadAttendanceData();
    } catch (error) {
      showMessage(
        'error',
        error.response?.data?.message ||
          error.message ||
          'Check-in failed.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Checks the employee out and records the checkout location.
  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });

      const location = await getCurrentLocation();

      const response = await api.post('/attendance/check-out', location);

      showMessage('success', response.data.message);

      await loadAttendanceData();
    } catch (error) {
      showMessage(
        'error',
        error.response?.data?.message ||
          error.message ||
          'Check-out failed.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="attendance-loading">
        <RefreshCw size={25} className="attendance-spin" />
        <p>Loading attendance...</p>
      </div>
    );
  }

  return (
    <main className="attendance-page">

      <header className="attendance-header">
        <div>
          <span className="attendance-eyebrow">
            TRACKPAY / WORKFORCE
          </span>

          <h1>Attendance & GPS</h1>

          <p>
            Track your workday, manage attendance and view your work history.
          </p>
        </div>

        <div className="attendance-header-actions">

          <NotificationBell />

          <button
            className="attendance-leave-button"
            onClick={() => navigate('/tasks')}
          >
            <ClipboardList size={17} />
            Task Management
          </button>

          <button
            className="attendance-leave-button"
            onClick={() => navigate('/leaves')}
          >
            <CalendarDays size={17} />
            Leave Management
          </button>

          <button
            className="attendance-refresh"
            onClick={loadAttendanceData}
            disabled={actionLoading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </header>

      {message.text && (
        <div className={`attendance-message ${message.type}`}>
          {message.type === 'success'
            ? <CheckCircle2 size={19} />
            : <AlertCircle size={19} />}

          <span>{message.text}</span>
        </div>
      )}

      <section className="attendance-date-card">
        <div>
          <span>YOUR WORKDAY</span>

          <h2>
            {today.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </h2>

          <p>
            {today.toLocaleDateString('en-IN', {
              year: 'numeric'
            })}
          </p>
        </div>

        <div className="attendance-date-icon">
          <CalendarDays size={30} />
        </div>
      </section>

      <section className="attendance-stats">

        <article className="attendance-stat-card">
          <div className="attendance-stat-icon sage">
            <CheckCircle2 size={21} />
          </div>
          <span>Present days</span>
          <strong>{summary?.presentDays ?? 0}</strong>
        </article>

        <article className="attendance-stat-card">
          <div className="attendance-stat-icon pink">
            <Clock size={21} />
          </div>
          <span>Late days</span>
          <strong>{summary?.lateDays ?? 0}</strong>
        </article>

        <article className="attendance-stat-card">
          <div className="attendance-stat-icon lavender">
            <CalendarDays size={21} />
          </div>
          <span>Half days</span>
          <strong>{summary?.halfDays ?? 0}</strong>
        </article>

        <article className="attendance-stat-card">
          <div className="attendance-stat-icon peach">
            <Clock size={21} />
          </div>
          <span>Working hours</span>
          <strong>{summary?.totalWorkingHours ?? 0} hrs</strong>
        </article>

      </section>

      <section className="attendance-workspace">

        <article className="attendance-main-card">

          <div className="attendance-card-heading">
            <div>
              <span>DAILY ATTENDANCE</span>
              <h2>Manage your work session</h2>
            </div>

            <span
              className={`attendance-status ${
                isTracking ? 'active' : 'inactive'
              }`}
            >
              <span className="attendance-status-dot" />
              {isTracking ? 'GPS Active' : 'GPS Inactive'}
            </span>
          </div>

          <div className="attendance-time-grid">

            <div>
              <span>Check-in time</span>
              <strong>{formatTime(attendance?.checkIn?.time)}</strong>
            </div>

            <div>
              <span>Check-out time</span>
              <strong>{formatTime(attendance?.checkOut?.time)}</strong>
            </div>

            <div>
              <span>Working hours</span>
              <strong>{attendance?.workingHours ?? 0} hrs</strong>
            </div>

          </div>

          {!checkedIn && (
            <label className="attendance-consent">
              <input
                type="checkbox"
                checked={locationConsent}
                onChange={(event) =>
                  setLocationConsent(event.target.checked)
                }
              />

              <span>
                I consent to sharing my GPS location for attendance
                verification during my work session. Tracking ends
                when I check out.
              </span>
            </label>
          )}

          <div className="attendance-action-area">

            {!checkedIn && (
              <button
                className="attendance-checkin-button"
                onClick={handleCheckIn}
                disabled={actionLoading}
              >
                <LogIn size={20} />
                {actionLoading ? 'Processing...' : 'Check In'}
              </button>
            )}

            {isTracking && !checkedOut && (
              <button
                className="attendance-checkout-button"
                onClick={handleCheckOut}
                disabled={actionLoading}
              >
                <LogOut size={20} />
                {actionLoading ? 'Processing...' : 'Check Out'}
              </button>
            )}

            {checkedOut && (
              <div className="attendance-completed">
                <CheckCircle2 size={22} />
                Attendance completed for today.
              </div>
            )}

            {checkedIn && !checkedOut && !isTracking && (
              <div className="attendance-completed">
                Your work session is not currently marked as active.
              </div>
            )}

          </div>

          <div className="attendance-privacy">
            <ShieldCheck size={19} />

            <p>
              Your location is requested only when you check in or
              check out. This page does not continuously collect GPS
              coordinates.
            </p>
          </div>

        </article>

        <article className="attendance-location-card">

          <div className="attendance-location-icon">
            <Navigation size={26} />
          </div>

          <span>LOCATION VERIFICATION</span>

          <h2>
            {isTracking ? 'Work session active' : 'Location protected'}
          </h2>

          <p>
            {isTracking
              ? 'Your attendance session is active. Check out when your workday ends.'
              : 'GPS coordinates are requested only during attendance actions.'}
          </p>

          <div className="attendance-location-footer">
            <MapPin size={17} />
            GPS permission is controlled by your browser.
          </div>

        </article>

      </section>

      <section className="attendance-history-section">

        <div className="attendance-section-heading">
          <div>
            <span>YOUR RECORDS</span>
            <h2>Attendance history</h2>
          </div>

          <span className="attendance-record-count">
            {history.length} records
          </span>
        </div>

        <div className="attendance-table-wrapper">
          <table className="attendance-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Working hours</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record._id}>
                    <td>{formatDate(record.date)}</td>

                    <td>{formatTime(record.checkIn?.time)}</td>

                    <td>{formatTime(record.checkOut?.time)}</td>

                    <td>{record.workingHours ?? 0} hrs</td>

                    <td>
                      <span
                        className={`attendance-table-status ${record.status}`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="attendance-empty">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </section>
                  {/* Employee Payslip History */}
      <section className="attendance-history-section payslip-section">

        <div className="attendance-section-heading">
          <div>
            <span>YOUR SALARY RECORDS</span>
            <h2>My Payslips</h2>
          </div>

          <span className="attendance-record-count">
            {payrollHistory.length} payslips
          </span>
        </div>

        {payrollLoading ? (
          <div className="attendance-empty">
            Loading your payslips...
          </div>
        ) : payrollHistory.length > 0 ? (
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Pay period</th>
                  <th>Gross salary</th>
                  <th>Deductions</th>
                  <th>Net salary</th>
                  <th>Status</th>
                  <th>Download</th>
                </tr>
              </thead>

              <tbody>
                {payrollHistory.map((payroll) => (
                  <tr key={payroll._id}>
                    <td>
                      {new Date(
                        payroll.payrollYear,
                        payroll.payrollMonth - 1
                      ).toLocaleString('en-IN', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </td>

                    <td>
                      ₹{Number(payroll.grossSalary || 0).toLocaleString('en-IN')}
                    </td>

                    <td>
                      ₹{Number(payroll.totalDeductions || 0).toLocaleString('en-IN')}
                    </td>

                    <td>
                      <strong>
                        ₹{Number(payroll.netSalary || 0).toLocaleString('en-IN')}
                      </strong>
                    </td>

                    <td>
                      <span className={`attendance-table-status ${payroll.status}`}>
                        {payroll.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="attendance-refresh"
                        onClick={() => handleDownloadPayslip(payroll._id)}
                        disabled={downloadingPayslip === payroll._id}
                      >
                        <Download size={16} />
                        {downloadingPayslip === payroll._id
                          ? 'Downloading...'
                          : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="attendance-empty">
            No approved or paid payslips available yet.
          </div>
        )}

      </section>
    </main>
  );
};

export default Attendance;
