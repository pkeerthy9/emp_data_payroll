
import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  ClipboardList,
  Clock3,
  UserRound,

} from 'lucide-react';

import api from '../services/api';
import './AuditLogs.css';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};

      if (module) params.module = module;
      if (action) params.action = action;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/audit-logs', { params });

      setLogs(response.data.logs || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load audit logs.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (date) => {
    if (!date) return '--';

    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionClass = (value) => {
    return value?.toLowerCase().replaceAll('_', '-') || '';
  };

  const clearFilters = () => {
    setModule('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setTimeout(fetchLogs, 0);
  };

  return (
    <div className="audit-page">
      <div className="audit-header">
        <div>
          <div className="audit-heading-icon">
            <ShieldCheck size={23} />
          </div>

          <h1>Audit Logs</h1>
          <p>Track important activities and changes across TrackPay.</p>
        </div>

        <button
          className="audit-refresh-btn"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="audit-summary-card">
        <div className="audit-summary-icon">
          <ClipboardList size={23} />
        </div>

        <div>
          <span>Total Activity Records</span>
          <h2>{logs.length}</h2>
          <small>Latest 200 records</small>
        </div>
      </div>

      <div className="audit-filters">
        <div className="audit-filter-heading">
          <Search size={18} />
          <h3>Filter Activities</h3>
        </div>

        <div className="audit-filter-grid">
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
          >
            <option value="">All Modules</option>
            <option value="Employee">Employee</option>
            <option value="Payroll">Payroll</option>
            <option value="Attendance">Attendance</option>
            <option value="Leave">Leave</option>
            <option value="Task">Task</option>
          </select>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="GENERATE">Generate</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="MARK_AS_PAID">Mark as Paid</option>
            <option value="APPLY">Apply</option>
<option value="CANCEL">Cancel</option>
<option value="CHECK_IN">Check In</option>
<option value="CHECK_OUT">Check Out</option>
<option value="COMPLETE">Complete</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="audit-filter-actions">
          <button onClick={fetchLogs}>
            Apply Filters
          </button>

          <button onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="audit-table-card">
        <div className="audit-table-heading">
          <div>
            <h3>Activity History</h3>
            <p>Recent administrative activities</p>
          </div>

          <span>{logs.length} records</span>
        </div>

        {loading ? (
          <div className="audit-message">
            Loading audit records...
          </div>
        ) : error ? (
          <div className="audit-error">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="audit-message">
            No audit activities found.
          </div>
        ) : (
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Performed By</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <strong>{log.description}</strong>
                      {log.details?.employeeId && (
                        <small>
                          Employee ID: {log.details.employeeId}
                        </small>
                      )}
                    </td>

                    <td>
                      <div className="audit-user">
                        <UserRound size={17} />
                        <div>
                          <strong>
                            {log.performedBy?.name || 'Unknown User'}
                          </strong>
                          <small>{log.role}</small>
                        </div>
                      </div>
                    </td>

                    <td>{log.module}</td>

                    <td>
                      <span className={`audit-action ${getActionClass(log.action)}`}>
                        {log.action?.replaceAll('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <div className="audit-date">
                        <Clock3 size={15} />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogs;
