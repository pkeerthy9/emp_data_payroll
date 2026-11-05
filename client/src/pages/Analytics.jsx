
import { useEffect, useState } from 'react';
import {
  Users,
  Wallet,
  CalendarDays,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Analytics.css';

// Safely format numbers as Indian Rupees.
const currency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  })}`;

function Analytics() {
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load analytics from the existing backend APIs.
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        api.get('/attendance/admin/today'),
        api.get('/payroll/history'),
        api.get('/leaves/all'),
        api.get('/tasks/assigned')
      ]);

      const [attendanceResult, payrollResult, leaveResult, taskResult] = results;
      
      setAttendance(
        attendanceResult.status === 'fulfilled'
          ? attendanceResult.value.data.attendance || []
          : []
      );

      setPayrolls(
        payrollResult.status === 'fulfilled'
          ? payrollResult.value.data.payrolls || []
          : []
      );

      setLeaves(
        leaveResult.status === 'fulfilled'
          ? leaveResult.value.data.leaves || []
          : []
      );

      setTasks(
        taskResult.status === 'fulfilled'
          ? taskResult.value.data.tasks || []
          : []
      );

      if (results.every((result) => result.status === 'rejected')) {
        setError('Unable to load analytics. Please check the backend.');
      }
    } catch (err) {
      setError('Unable to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Calculate attendance summary.
  const presentCount = attendance.filter(
    (item) => ['present', 'late', 'half-day'].includes(item.status)
  ).length;

  const notCheckedIn = attendance.filter(
    (item) => item.status === 'not-checked-in'
  ).length;

  // Calculate payroll totals.
  const totalPayroll = payrolls.reduce(
    (sum, item) => sum + Number(item.grossSalary || 0),
    0
  );

  const paidPayroll = payrolls
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + Number(item.netSalary || 0), 0);

  // Calculate leave summary.
  const pendingLeaves = leaves.filter(
    (item) => item.status === 'pending'
  ).length;

  const approvedLeaves = leaves.filter(
    (item) => item.status === 'approved'
  ).length;

  // Calculate task summary.
  const completedTasks = tasks.filter(
    (item) => item.status === 'completed'
  ).length;

  const inProgressTasks = tasks.filter(
    (item) => item.status === 'in-progress'
  ).length;

  const todoTasks = tasks.filter(
    (item) => item.status === 'todo'
  ).length;

  const taskData = [
    { name: 'Completed', value: completedTasks },
    { name: 'In Progress', value: inProgressTasks },
    { name: 'To Do', value: todoTasks }
  ];

  const taskColors = ['#789b83', '#e8ae91', '#c6b5d9'];

  // Prepare payroll status chart.
  const payrollStatusData = [
    {
      name: 'Paid',
      value: payrolls.filter((item) => item.status === 'paid').length
    },
    {
      name: 'Approved',
      value: payrolls.filter((item) => item.status === 'approved').length
    },
    {
      name: 'Pending',
      value: payrolls.filter(
        (item) => ['draft', 'pending'].includes(item.status)
      ).length
    },
    {
      name: 'Rejected',
      value: payrolls.filter((item) => item.status === 'rejected').length
    }
  ];

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <span className="analytics-eyebrow">TRACKPAY INSIGHTS</span>
          <h1>Analytics & Reports</h1>
          <p>Understand your workforce performance at a glance.</p>
        </div>

        <div className="analytics-header-actions">
          <button onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <button onClick={loadAnalytics}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="analytics-error">{error}</div>}

      {loading ? (
        <div className="analytics-loading">Loading analytics...</div>
      ) : (
        <>
          <section className="analytics-stats">
            <div className="analytics-stat-card">
              <div className="analytics-stat-icon sage">
                <Users size={21} />
              </div>
              <span>Present / Active Today</span>
              <h2>{presentCount}</h2>
              <small>{notCheckedIn} not checked in</small>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-icon pink">
                <Wallet size={21} />
              </div>
              <span>Total Gross Payroll</span>
              <h2>{currency(totalPayroll)}</h2>
              <small>{payrolls.length} payroll records</small>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-icon peach">
                <CalendarDays size={21} />
              </div>
              <span>Pending Leave Requests</span>
              <h2>{pendingLeaves}</h2>
              <small>{approvedLeaves} approved requests</small>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-icon lavender">
                <ClipboardList size={21} />
              </div>
              <span>Completed Tasks</span>
              <h2>{completedTasks}</h2>
              <small>{tasks.length} assigned tasks</small>
            </div>
          </section>

          <section className="analytics-grid">
            <div className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h3>Payroll status</h3>
                  <p>Distribution of payroll records</p>
                </div>
                <TrendingUp size={20} />
              </div>

              <div className="analytics-chart">
                {payrollStatusData.every((item) => item.value === 0) ? (
                  <p className="analytics-empty">No payroll records available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payrollStatusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#789b83"
                        radius={[7, 7, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h3>Task performance</h3>
                  <p>Current task completion status</p>
                </div>
                <ClipboardList size={20} />
              </div>

              <div className="analytics-chart">
                {tasks.length === 0 ? (
                  <p className="analytics-empty">No task records available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={85}
                        label
                      >
                        {taskData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={taskColors[index]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h3>Attendance overview</h3>
                  <p>Today's employee attendance records</p>
                </div>
                <Users size={20} />
              </div>

              <div className="analytics-detail-list">
                <div>
                  <span>Present / Late / Half-day</span>
                  <strong>{presentCount}</strong>
                </div>
                <div>
                  <span>Not checked in</span>
                  <strong>{notCheckedIn}</strong>
                </div>
                <div>
                  <span>Total listed</span>
                  <strong>{attendance.length}</strong>
                </div>
              </div>
            </div>

            <div className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h3>Payroll summary</h3>
                  <p>Based on loaded payroll records</p>
                </div>
                <Wallet size={20} />
              </div>

              <div className="analytics-detail-list">
                <div>
                  <span>Gross payroll</span>
                  <strong>{currency(totalPayroll)}</strong>
                </div>
                <div>
                  <span>Net amount marked paid</span>
                  <strong>{currency(paidPayroll)}</strong>
                </div>
                <div>
                  <span>Total payroll records</span>
                  <strong>{payrolls.length}</strong>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="analytics-footer">
        TrackPay Analytics · Workforce insights
      </footer>
    </div>
  );
}

export default Analytics;
