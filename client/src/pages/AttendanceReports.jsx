import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Users, Download, RefreshCw } from 'lucide-react';
import api from '../services/api';
import './AttendanceReports.css';

function AttendanceReports() {
  const today = new Date().toLocaleDateString('en-CA');

  const firstDay = new Date();
  firstDay.setDate(1);
  const defaultStartDate = firstDay.toLocaleDateString('en-CA');

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/attendance/admin/reports', {
        params: { startDate, endDate }
      });

      setReport(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load attendance report.'
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatHours = (hours) => {
    const totalMinutes = Math.round(Number(hours || 0) * 60);
    const wholeHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (wholeHours === 0) return `${minutes} min`;
    if (minutes === 0) return `${wholeHours} hr`;

    return `${wholeHours} hr ${minutes} min`;
  };

  const formatTime = (value) => {
    if (!value) return '--';

    return new Date(value).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (value) => {
    if (!value) return '--';

    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatus = (record) => {
    if (record.status === 'half-day') return 'Half Day';
    if (record.status === 'late') return 'Late';
    if (record.status === 'absent') return 'Absent';
    if (record.checkIn?.time && !record.checkOut?.time) return 'On Duty';
    return 'Present';
  };

  const exportCSV = () => {
    if (!report?.attendance?.length) return;

    const headers = [
      'Date',
      'Employee Name',
      'Employee ID',
      'Department',
      'Check In',
      'Check Out',
      'Working Hours',
      'Status'
    ];

    const rows = report.attendance.map((record) => [
      formatDate(record.date),
      record.employee?.user?.name || 'Unknown',
      record.employee?.employeeId || 'N/A',
      record.employee?.department || 'N/A',
      formatTime(record.checkIn?.time),
      formatTime(record.checkOut?.time),
      formatHours(record.workingHours),
      getStatus(record)
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) =>
          `"${String(value).replace(/"/g, '""')}"`
        ).join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `TrackPay_Attendance_${startDate}_to_${endDate}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const summary = report?.summary || {};

  return (
    <div className="attendance-reports-page">
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">WORKFORCE ANALYTICS</span>
          <h1>Attendance Reports</h1>
          <p>Review employee attendance and working hours.</p>
        </div>

        <button
          className="reports-refresh"
          onClick={fetchReport}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="reports-filter">
        <div className="filter-heading">
          <CalendarDays size={19} />
          <div>
            <h3>Choose report period</h3>
            <p>Select the dates you want to review.</p>
          </div>
        </div>

        <div className="filter-controls">
          <label>
            Start date
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            End date
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <button
            className="generate-report-button"
            onClick={fetchReport}
            disabled={loading || !startDate || !endDate}
          >
            <CalendarDays size={16} />
            Generate Report
          </button>
        </div>
      </section>

      {error && (
        <div className="reports-error">
          {error}
        </div>
      )}

      <section className="reports-stats">
        <div className="report-stat-card">
          <div className="report-stat-icon sage">
            <Users size={20} />
          </div>
          <span>Active Employees</span>
          <h2>{loading ? '...' : summary.totalEmployees ?? 0}</h2>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon blue">
            <CalendarDays size={20} />
          </div>
          <span>Attendance Records</span>
          <h2>{loading ? '...' : summary.totalRecords ?? 0}</h2>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon peach">
            <Clock3 size={20} />
          </div>
          <span>Late Arrivals</span>
          <h2>{loading ? '...' : summary.lateDays ?? 0}</h2>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon lavender">
            <Clock3 size={20} />
          </div>
          <span>Half Days</span>
          <h2>{loading ? '...' : summary.halfDays ?? 0}</h2>
        </div>
      </section>

      <section className="reports-summary-strip">
        <div>
          <span>Present records</span>
          <strong>{summary.presentDays ?? 0}</strong>
        </div>

        <div>
          <span>Recorded absences</span>
          <strong>{summary.absentRecords ?? 0}</strong>
        </div>

        <div>
          <span>Total working hours</span>
          <strong>{formatHours(summary.totalWorkingHours)}</strong>
        </div>
      </section>

      <section className="reports-table-panel">
        <div className="reports-table-heading">
          <div>
            <h3>Attendance details</h3>
            <p>
              {startDate} to {endDate}
            </p>
          </div>

          <button
            className="reports-export-button"
            onClick={exportCSV}
            disabled={!report?.attendance?.length}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>EMPLOYEE</th>
                <th>EMPLOYEE ID</th>
                <th>DEPARTMENT</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
                <th>WORKING HOURS</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="8" className="reports-empty">
                    Generating attendance report...
                  </td>
                </tr>
              )}

              {!loading && !error && report?.attendance?.map((record) => {
                const status = getStatus(record);

                return (
                  <tr key={record._id}>
                    <td>{formatDate(record.date)}</td>

                    <td className="reports-employee-name">
                      {record.employee?.user?.name || 'Unknown'}
                    </td>

                    <td>{record.employee?.employeeId || 'N/A'}</td>

                    <td>{record.employee?.department || 'N/A'}</td>

                    <td>{formatTime(record.checkIn?.time)}</td>

                    <td>{formatTime(record.checkOut?.time)}</td>

                    <td>{formatHours(record.workingHours)}</td>

                    <td>
                      <span className={`report-status ${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!loading && !error && report?.attendance?.length === 0 && (
                <tr>
                  <td colSpan="8" className="reports-empty">
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="reports-privacy-note">
          Reports display saved attendance records only. Missing records are
          not automatically classified as absences.
        </p>
      </section>
    </div>
  );
}

export default AttendanceReports;