
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  ClipboardList,
  AlertCircle,
  X
} from 'lucide-react';

import api from '../services/api';
import './LeaveManagement.css';

const LeaveManagement = () => {
  const storedUser = JSON.parse(
    localStorage.getItem('trackpay_user') || '{}'
  );

  const role = storedUser.role || 'employee';

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [reviewingId, setReviewingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isEmployee = role === 'employee';
  const isManager = role === 'manager';
  const isAdmin = role === 'admin';

  const pageTitle = isEmployee
    ? 'My Leave'
    : isManager
      ? 'Team Leave Requests'
      : 'Leave Management';

  const loadLeaves = async () => {
    try {
      setLoading(true);

      let endpoint = '/leaves/my';

      if (isManager) endpoint = '/leaves/team';
      if (isAdmin) endpoint = '/leaves/all';

      const response = await api.get(endpoint);

      setLeaves(response.data.leaves || []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message ||
          'Unable to load leave requests.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleApplyLeave = async (event) => {
    event.preventDefault();

    if (form.endDate < form.startDate) {
      showMessage('error', 'End date cannot be before start date.');
      return;
    }

    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });

      const response = await api.post('/leaves/apply', form);

      showMessage(
        'success',
        response.data.message || 'Leave application submitted successfully.'
      );

      setForm({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: ''
      });

      await loadLeaves();
    } catch (error) {
      showMessage(
        'error',
        error.response?.data?.message || 'Unable to submit leave application.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      setActionLoading(true);

      const response = await api.patch(`/leaves/${leaveId}/cancel`);

      showMessage(
        'success',
        response.data.message || 'Leave request cancelled.'
      );

      await loadLeaves();
    } catch (error) {
      showMessage(
        'error',
        error.response?.data?.message || 'Unable to cancel leave request.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (leaveId, status) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      showMessage('error', 'Please enter a reason for rejecting this request.');
      return;
    }

    try {
      setActionLoading(true);

      const payload = { status };

      if (status === 'rejected') {
        payload.rejectionReason = rejectionReason.trim();
      }

      const response = await api.patch(
        `/leaves/${leaveId}/review`,
        payload
      );

      showMessage(
        'success',
        response.data.message || `Leave request ${status}.`
      );

      setReviewingId(null);
      setRejectionReason('');

      await loadLeaves();
    } catch (error) {
      showMessage(
        'error',
        error.response?.data?.message || 'Unable to review leave request.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '--';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEmployeeName = (leave) => {
    return leave.employee?.user?.name ||
      leave.employee?.name ||
      'Employee';
  };

  const getEmployeeId = (leave) => {
    return leave.employee?.employeeId || '--';
  };

  const getStatusClass = (status) => {
    return `leave-status ${status || 'pending'}`;
  };

  const pendingCount = leaves.filter(
    (leave) => leave.status === 'pending'
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status === 'approved'
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.status === 'rejected'
  ).length;

  if (loading) {
    return (
      <div className="leave-loading">
        <RefreshCw size={25} className="leave-spin" />
        <p>Loading leave information...</p>
      </div>
    );
  }

  return (
    <main className="leave-page">
      <header className="leave-header">
        <div>
          <span className="leave-eyebrow">
            TRACKPAY / WORKFORCE
          </span>

          <h1>{pageTitle}</h1>

          <p>
            {isEmployee
              ? 'Apply for leave and keep track of your requests.'
              : isManager
                ? 'Review and manage leave requests from your team.'
                : 'View and manage employee leave applications.'}
          </p>
        </div>

        <button
          className="leave-refresh"
          onClick={loadLeaves}
          disabled={actionLoading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      {message.text && (
        <div className={`leave-message ${message.type}`}>
          {message.type === 'success'
            ? <CheckCircle2 size={19} />
            : <AlertCircle size={19} />}

          <span>{message.text}</span>

          <button
            type="button"
            onClick={() => setMessage({ type: '', text: '' })}
            aria-label="Close message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="leave-stats">
        <article className="leave-stat-card">
          <div className="leave-stat-icon lavender">
            <ClipboardList size={21} />
          </div>
          <span>Total requests</span>
          <strong>{leaves.length}</strong>
        </article>

        <article className="leave-stat-card">
          <div className="leave-stat-icon peach">
            <Clock size={21} />
          </div>
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </article>

        <article className="leave-stat-card">
          <div className="leave-stat-icon sage">
            <CheckCircle2 size={21} />
          </div>
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </article>

        <article className="leave-stat-card">
          <div className="leave-stat-icon pink">
            <XCircle size={21} />
          </div>
          <span>Rejected</span>
          <strong>{rejectedCount}</strong>
        </article>
      </section>

      {isEmployee && (
        <section className="leave-form-card">
          <div className="leave-section-heading">
            <div>
              <span>NEW APPLICATION</span>
              <h2>Apply for leave</h2>
            </div>

            <div className="leave-heading-icon">
              <CalendarDays size={23} />
            </div>
          </div>

          <form onSubmit={handleApplyLeave}>
            <div className="leave-form-grid">
              <label>
                Leave type
                <select
                  name="leaveType"
                  value={form.leaveType}
                  onChange={handleFormChange}
                  required
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </label>

              <label>
                Start date
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                End date
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleFormChange}
                  min={form.startDate || undefined}
                  required
                />
              </label>

              <label className="leave-reason-field">
                Reason for leave
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  placeholder="Briefly explain why you need leave..."
                  rows="3"
                  maxLength="500"
                  required
                />
              </label>
            </div>

            <div className="leave-form-footer">
              <p>Submit your application for manager/admin review.</p>

              <button
                type="submit"
                className="leave-submit-button"
                disabled={actionLoading}
              >
                <Send size={17} />
                {actionLoading ? 'Submitting...' : 'Submit application'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="leave-list-section">
        <div className="leave-section-heading">
          <div>
            <span>
              {isEmployee ? 'YOUR RECORDS' : 'APPLICATIONS'}
            </span>

            <h2>
              {isEmployee
                ? 'My leave history'
                : 'Leave requests'}
            </h2>
          </div>

          <span className="leave-record-count">
            {leaves.length} records
          </span>
        </div>

        <div className="leave-table-wrapper">
          <table className="leave-table">
            <thead>
              <tr>
                {(!isEmployee) && <th>Employee</th>}
                {(!isEmployee) && <th>Employee ID</th>}
                <th>Leave type</th>
                <th>Start date</th>
                <th>End date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                {isEmployee && <th>Action</th>}
                {(isManager || isAdmin) && <th>Review</th>}
              </tr>
            </thead>

            <tbody>
              {leaves.length > 0 ? (
                leaves.map((leave) => (
                  <tr key={leave._id}>
                    {!isEmployee && (
                      <td>{getEmployeeName(leave)}</td>
                    )}

                    {!isEmployee && (
                      <td>{getEmployeeId(leave)}</td>
                    )}

                    <td className="leave-type-cell">
                      {(leave.leaveType || '').replace('-', ' ')}
                    </td>

                    <td>{formatDate(leave.startDate)}</td>
                    <td>{formatDate(leave.endDate)}</td>
                    <td>{leave.totalDays ?? 0}</td>

                    <td className="leave-reason-cell" title={leave.reason}>
                      {leave.reason || '--'}
                    </td>

                    <td>
                      <span className={getStatusClass(leave.status)}>
                        {leave.status}
                      </span>
                    </td>

                    {isEmployee && (
                      <td>
                        {leave.status === 'pending' ? (
                          <button
                            className="leave-cancel-button"
                            onClick={() => handleCancelLeave(leave._id)}
                            disabled={actionLoading}
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="leave-no-action">--</span>
                        )}
                      </td>
                    )}

                    {(isManager || isAdmin) && (
                      <td>
                        {leave.status === 'pending' ? (
                          <div className="leave-review-actions">
                            <button
                              className="leave-approve-button"
                              onClick={() => handleReview(leave._id, 'approved')}
                              disabled={actionLoading}
                            >
                              Approve
                            </button>

                            <button
                              className="leave-reject-button"
                              onClick={() => {
                                setReviewingId(leave._id);
                                setRejectionReason('');
                              }}
                              disabled={actionLoading}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="leave-no-action">Reviewed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={
                      isEmployee ? 9 : 10
                    }
                    className="leave-empty"
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {reviewingId && (
        <div className="leave-modal-backdrop">
          <section className="leave-review-modal">
            <div className="leave-modal-heading">
              <div>
                <span>LEAVE REVIEW</span>
                <h2>Reject application</h2>
              </div>

              <button
                onClick={() => setReviewingId(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Rejection reason
              <textarea
                rows="4"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Explain why this request is being rejected..."
                maxLength="500"
              />
            </label>

            <div className="leave-modal-actions">
              <button
                className="leave-modal-cancel"
                onClick={() => setReviewingId(null)}
                disabled={actionLoading}
              >
                Go back
              </button>

              <button
                className="leave-reject-button"
                onClick={() => handleReview(reviewingId, 'rejected')}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm rejection'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default LeaveManagement;
