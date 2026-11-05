import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import GeneratePayrollModal from '../components/GeneratePayrollModal';

import usePayrollData from '../hooks/usePayrollData';

import NotificationBell from '../components/NotificationBell';

import {

  LayoutDashboard,

  Users,
  ShieldCheck,
  Wallet,

   Calculator,

  ReceiptText,

  MapPin,

  ClipboardList,

  Settings,



  Search,

  Plus,

  TrendingUp,

  CircleDollarSign,

  Clock3,

  CheckCircle2,

  MoreHorizontal,

  ChevronDown,

  CalendarDays,

  ArrowUpRight,

  Menu,

  X,

  Check,

  XCircle,

  LoaderCircle

} from 'lucide-react';



import {

  ResponsiveContainer,

  AreaChart,

  Area,

  XAxis,

  Tooltip

} from 'recharts';



import {

  approvePayroll,

  rejectPayroll,

  markPayrollAsPaid

} from '../services/payrollService';



import './PayrollDashboard.css';



// Status priority is used only when two records belong to the same period.

const chartStatusPriority = {

  paid: 5,

  approved: 4,

  pending: 3,

  draft: 2,

  rejected: 1

};



// Build monthly payroll totals using actual backend records.

function buildMonthlyPayrollData(records) {

  const uniquePayrolls = new Map();



  records.forEach((record) => {

    const employeeId =

      record.employee?.employeeId ||

      record.employee?._id ||

      record.employee;



    const key = `${employeeId}-${record.payrollYear}-${record.payrollMonth}`;

    const existing = uniquePayrolls.get(key);



    const newPriority = chartStatusPriority[record.status] || 0;

    const oldPriority = existing

      ? chartStatusPriority[existing.status] || 0

      : -1;



    const newTime = new Date(

      record.updatedAt || record.createdAt || 0

    ).getTime();



    const oldTime = existing

      ? new Date(existing.updatedAt || existing.createdAt || 0).getTime()

      : -1;



    if (

      !existing ||

      newPriority > oldPriority ||

      (newPriority === oldPriority && newTime > oldTime)

    ) {

      uniquePayrolls.set(key, record);

    }

  });



  const monthlyTotals = new Map();



  uniquePayrolls.forEach((record) => {

    const month = Number(record.payrollMonth);

    const year = Number(record.payrollYear);



    if (

      !Number.isInteger(month) ||

      month < 1 ||

      month > 12 ||

      !Number.isInteger(year)

    ) {

      return;

    }



    const key = `${year}-${String(month).padStart(2, '0')}`;



    const existing = monthlyTotals.get(key) || {

      month: new Date(year, month - 1).toLocaleDateString('en-IN', {

        month: 'short',

        year: 'numeric'

      }),

      sortKey: year * 100 + month,

      amount: 0

    };



    existing.amount += Number(record.grossSalary || 0);

    monthlyTotals.set(key, existing);

  });



  return Array.from(monthlyTotals.values())

    .sort((a, b) => a.sortKey - b.sortKey)

    .slice(-6);

}



// Convert backend status into readable dashboard text.

function formatStatus(status) {

  if (!status) return 'Unknown';



  return status.charAt(0).toUpperCase() + status.slice(1);

}



// Select the newest payroll period for each employee.

function getLatestPayrollByEmployee(records) {

  const latestRecords = new Map();



  records.forEach((record) => {

    const employeeId =

      record.employee?.employeeId ||

      record.employee?._id ||

      record.employee;



    const existing = latestRecords.get(String(employeeId));



    const recordPeriod =

      Number(record.payrollYear) * 100 + Number(record.payrollMonth);



    const existingPeriod = existing

      ? Number(existing.payrollYear) * 100 + Number(existing.payrollMonth)

      : -1;



    const recordTime = new Date(

      record.updatedAt || record.createdAt || 0

    ).getTime();



    const existingTime = existing

      ? new Date(existing.updatedAt || existing.createdAt || 0).getTime()

      : -1;



    if (

      !existing ||

      recordPeriod > existingPeriod ||

      (recordPeriod === existingPeriod && recordTime > existingTime)

    ) {

      latestRecords.set(String(employeeId), record);

    }

  });



  return Array.from(latestRecords.values());

}



function PayrollDashboard() {

  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('Payroll');

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState('All');

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showPayrollModal, setShowPayrollModal] = useState(false);



  // State for the payroll action dropdown and action feedback.

  const [activeActionMenu, setActiveActionMenu] = useState(null);

  const [actionLoading, setActionLoading] = useState(null);

  const [actionMessage, setActionMessage] = useState(null);



  // Fetch real payroll records from the backend.

  const {

    payrollRecords,

    loading,

    error,

    refreshPayroll

  } = usePayrollData();



  // Generate chart data from actual payroll records.

  const payrollData = buildMonthlyPayrollData(payrollRecords);



  const chartTotal = payrollData.reduce(

    (total, item) => total + item.amount,

    0

  );



  // Keep only the latest payroll record for each employee.

  const latestPayrollRecords = getLatestPayrollByEmployee(payrollRecords);



  // Prepare employee rows for the dashboard table.

  const dashboardEmployees = latestPayrollRecords.map((record) => {

    const name = record.employee?.user?.name || 'Unknown Employee';



    return {

      id:

        record.employee?.employeeId ||

        record.employee?._id ||

        'N/A',

      payrollId: record._id,

      name,

      role: record.employee?.designation || 'Employee',

      department: record.employee?.department || 'Not assigned',

      gross: Number(record.grossSalary || 0),

      net: Number(record.netSalary || 0),

      status: formatStatus(record.status),

      initials: name

        .split(' ')

        .map((part) => part[0])

        .join('')

        .slice(0, 2),

      color: 'sage',

      payrollMonth: record.payrollMonth,

      payrollYear: record.payrollYear

    };

  });



  // Search and filter employees.

  const filteredEmployees = dashboardEmployees.filter((employee) => {

    const matchesSearch =

      employee.name.toLowerCase().includes(search.toLowerCase()) ||

      String(employee.id).toLowerCase().includes(search.toLowerCase());



    const matchesStatus =

      statusFilter === 'All' || employee.status === statusFilter;



    return matchesSearch && matchesStatus;

  });



  const menuItems = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Employees', icon: Users },
  { name: 'Payroll', icon: Wallet },
  { name: 'Salary Structure', icon: ReceiptText },
  { name: 'Generate Payroll', icon: Calculator },
  { name: 'Attendance', icon: Clock3 },
  { name: 'GPS Tracking', icon: MapPin },
  { name: 'Reports', icon: ClipboardList },
  { name: 'Leave Management', icon: CalendarDays },
  { name: 'Task Management', icon: ClipboardList },
  { name: 'Analytics', icon: TrendingUp },
{ name: 'Audit Logs', icon: ShieldCheck },
];



  // Dashboard summary calculations.

  const employeeCount = dashboardEmployees.length;



  const totalPayroll = dashboardEmployees.reduce(

    (total, employee) => total + employee.gross,

    0

  );



  const totalNetWages = dashboardEmployees.reduce(

    (total, employee) => total + employee.net,

    0

  );



  const paidCount = dashboardEmployees.filter(

    (employee) => employee.status === 'Paid'

  ).length;



  const pendingCount = dashboardEmployees.filter(

    (employee) =>

      employee.status === 'Pending' || employee.status === 'Draft'

  ).length;



  const approvedCount = dashboardEmployees.filter(

    (employee) => employee.status === 'Approved'

  ).length;



  const pendingApprovalCount = pendingCount;



  // Format amounts in Indian Rupees.

  const formatCurrency = (amount) =>

    `₹${Number(amount || 0).toLocaleString('en-IN', {

      maximumFractionDigits: 2

    })}`;



  // Decide which actions are allowed for each payroll status.

  const getAvailableActions = (status) => {

    if (status === 'Draft' || status === 'Pending') {

      return ['approve', 'reject'];

    }



    if (status === 'Approved') {

      return ['paid'];

    }



    return [];

  };



  // Perform a payroll action using the backend API.

  const handlePayrollAction = async (action, employee) => {

    if (!employee.payrollId || actionLoading) return;



    const actionNames = {

      approve: 'approve',

      reject: 'reject',

      paid: 'mark as paid'

    };
    // Download an approved or paid employee payslip.
const handleDownloadPayslip = async (payrollId, employeeName) => {
  try {
    const response = await import('../services/api').then(({ default: api }) =>
      api.get(`/payroll/${payrollId}/payslip`, {
        responseType: 'blob'
      })
    );

    const pdfBlob = new Blob([response.data], {
      type: 'application/pdf'
    });

    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `TrackPay_Payslip_${employeeName.replace(/\s+/g, '_')}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(downloadUrl);

    setActionMessage({
      type: 'success',
      text: `Payslip downloaded for ${employeeName}.`
    });
  } catch (err) {
    setActionMessage({
      type: 'error',
      text: 'Unable to download payslip. Please try again.'
    });
  }
};



    const actionFunctions = {

      approve: approvePayroll,

      reject: rejectPayroll,

      paid: markPayrollAsPaid

    };



    const actionFunction = actionFunctions[action];



    if (!actionFunction) return;



    try {

      setActionLoading(employee.payrollId);

      setActionMessage(null);

      setActiveActionMenu(null);



      await actionFunction(employee.payrollId);



      setActionMessage({

        type: 'success',

        text: `Payroll for ${employee.name} successfully ${actionNames[action]}.`

      });



      // Refresh records so the latest backend status is displayed.

      await refreshPayroll();

    } catch (err) {

      setActionMessage({

        type: 'error',

        text:

          err.response?.data?.message ||

          `Unable to ${actionNames[action]} this payroll. Please try again.`

      });

    } finally {

      setActionLoading(null);

    }

  };

// Download an approved or paid employee payslip.
const handleDownloadPayslip = async (payrollId, employeeName) => {
  try {
    const response = await import('../services/api').then(({ default: api }) =>
      api.get(`/payroll/${payrollId}/payslip`, {
        responseType: 'blob'
      })
    );

    const pdfBlob = new Blob([response.data], {
      type: 'application/pdf'
    });

    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `TrackPay_Payslip_${employeeName.replace(/\s+/g, '_')}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(downloadUrl);

    setActionMessage({
      type: 'success',
      text: `Payslip downloaded for ${employeeName}.`
    });
  } catch (err) {
    console.error('Payslip download error:', err);

    setActionMessage({
      type: 'error',
      text: 'Unable to download payslip. Please try again.'
    });
  }
};

  return (

    <div className="trackpay-dashboard">



      {showPayrollModal && (

        <GeneratePayrollModal

          onClose={() => setShowPayrollModal(false)}

          onSuccess={() => {

            setShowPayrollModal(false);

            refreshPayroll();

          }}

        />

      )}



      {sidebarOpen && (

        <div

          className="sidebar-overlay"

          onClick={() => setSidebarOpen(false)}

        />

      )}



      <aside

        className={`dashboard-sidebar ${

          sidebarOpen ? 'sidebar-open' : ''

        }`}

      >

        <div className="brand">

          <div className="brand-icon">

            <MapPin size={23} />

            <CircleDollarSign size={14} />

          </div>



          <div>

            <h2>trackpay<span>.</span></h2>

            <p>WORKFORCE MANAGEMENT</p>

          </div>



          <button

            className="mobile-close"

            onClick={() => setSidebarOpen(false)}

          >

            <X size={20} />

          </button>

        </div>



        <div className="workspace-label">WORKSPACE</div>



        <nav className="sidebar-navigation">

          {menuItems.map((item) => {

            const Icon = item.icon;



            return (

              <button

                key={item.name}

                className={`nav-item ${

                  activeMenu === item.name ? 'active' : ''

                }`}

                onClick={() => {
                  setActiveMenu(item.name);
                  setSidebarOpen(false);

                  if (item.name === 'Employees') {
  navigate('/employees');
} else if (item.name === 'Salary Structure') {
  navigate('/salary');
} else if (item.name === 'Generate Payroll') {
  navigate('/generate-payroll');
} else if (item.name === 'Attendance') {
  navigate('/admin-attendance');
} else if (item.name === 'GPS Tracking') {
  navigate('/gps-tracking');
}else if (item.name === 'Analytics') {
  navigate('/analytics');
} else if (item.name === 'Audit Logs') {
  navigate('/audit-logs');
} else if (item.name === 'Reports') {
  navigate('/attendance-reports');
  // Opens the Leave Management page.
} else if (item.name === 'Leave Management') {
  navigate('/leaves');
} else if (item.name === 'Task Management') {
  navigate('/tasks');
} else if (item.name === 'Payroll' || item.name === 'Overview') {
  navigate('/dashboard');
}
                }}

              >

                <Icon size={19} />

                <span>{item.name}</span>



                {item.name === 'Payroll' && (

                  <span className="nav-indicator" />

                )}

              </button>

            );

          })}

        </nav>



        <div className="sidebar-bottom">

          <div className="workspace-label">PREFERENCES</div>



          <button className="nav-item">

            <Settings size={19} />

            <span>Settings</span>

          </button>



          <div className="sidebar-profile">

            <div className="profile-avatar">TA</div>



            <div>

              <strong>TrackPay Admin</strong>

              <span>Administrator</span>

            </div>



            <MoreHorizontal size={19} />

          </div>

        </div>

      </aside>



      <main className="dashboard-main">



        <header className="dashboard-header">

          <div className="header-left">

            <button

              className="mobile-menu"

              onClick={() => setSidebarOpen(true)}

            >

              <Menu size={22} />

            </button>



            <div>

              <p className="breadcrumb">Workspace / Payroll</p>

              <h1>Payroll Overview</h1>

            </div>

          </div>



          <div className="header-actions">

            <div className="header-search">

              <Search size={17} />

              <input placeholder="Search anything..." />

              <span>⌘ K</span>

            </div>



            <NotificationBell />



            <div className="header-date">

              <CalendarDays size={16} />

              November 2026

              <ChevronDown size={15} />

            </div>

          </div>

        </header>



        <section className="welcome-section">

          <div>

            <span className="welcome-tag">PAYROLL MANAGEMENT</span>



            <h2>

              Let's make payday <span>effortless.</span>

            </h2>



            <p>

              Here's what's happening with your team's wages this month.

            </p>

          </div>



          <button

            className="generate-button"

            onClick={() => navigate('/generate-payroll')}

          >

            <Plus size={18} />

            Generate Payroll

          </button>

        </section>



        <section className="stats-grid">



          <div className="stat-card">

            <div className="stat-top">

              <span>Total Payroll</span>

              <div className="stat-icon sage-icon">

                <Wallet size={19} />

              </div>

            </div>



            <h2>{loading ? '...' : formatCurrency(totalPayroll)}</h2>



            <div className="stat-footer">

              <TrendingUp size={15} />

              <strong>Current records</strong>

            </div>

          </div>



          <div className="stat-card">

            <div className="stat-top">

              <span>Employees</span>

              <div className="stat-icon pink-icon">

                <Users size={19} />

              </div>

            </div>



            <h2>{loading ? '...' : employeeCount}</h2>



            <div className="stat-footer neutral-footer">

              <span>Employees with payroll records</span>

            </div>

          </div>



          <div className="stat-card">

            <div className="stat-top">

              <span>Pending Approval</span>

              <div className="stat-icon peach-icon">

                <Clock3 size={19} />

              </div>

            </div>



            <h2>{loading ? '...' : pendingApprovalCount}</h2>



            <div className="stat-footer pending-footer">

              <span>Needs your attention</span>

            </div>

          </div>



          <div className="stat-card">

            <div className="stat-top">

              <span>Net Wages</span>

              <div className="stat-icon lavender-icon">

                <CircleDollarSign size={19} />

              </div>

            </div>



            <h2>{loading ? '...' : formatCurrency(totalNetWages)}</h2>



            <div className="stat-footer">

              <CheckCircle2 size={15} />

              <strong>Calculated wages</strong>

            </div>

          </div>



        </section>



        <section className="dashboard-content-grid">



          <div className="panel payroll-chart-panel">



            <div className="panel-heading">

              <div>

                <h3>Payroll trends</h3>

                <p>Monthly gross wages from actual payroll records</p>

              </div>



              <button className="period-button">

                Last 6 months <ChevronDown size={15} />

              </button>

            </div>



            <div className="chart-summary">

              <h2>{loading ? '...' : formatCurrency(chartTotal)}</h2>



              <span>{payrollData.length} months shown</span>

            </div>



            <div className="payroll-chart">



              {!loading && payrollData.length === 0 && (

                <div className="empty-table">

                  No monthly payroll data available yet.

                </div>

              )}



              {payrollData.length > 0 && (

                <ResponsiveContainer width="100%" height="100%">

                  <AreaChart data={payrollData}>

                    <defs>

                      <linearGradient

                        id="payrollGradient"

                        x1="0"

                        y1="0"

                        x2="0"

                        y2="1"

                      >

                        <stop

                          offset="0%"

                          stopColor="#88a995"

                          stopOpacity={0.3}

                        />



                        <stop

                          offset="95%"

                          stopColor="#88a995"

                          stopOpacity={0}

                        />

                      </linearGradient>

                    </defs>



                    <XAxis

                      dataKey="month"

                      axisLine={false}

                      tickLine={false}

                      tick={{ fill: '#929b94', fontSize: 12 }}

                    />



                    <Tooltip

                      formatter={(value) => [

                        formatCurrency(value),

                        'Gross Payroll'

                      ]}

                    />



                    <Area

                      type="monotone"

                      dataKey="amount"

                      stroke="#769b83"

                      strokeWidth={3}

                      fill="url(#payrollGradient)"

                    />

                  </AreaChart>

                </ResponsiveContainer>

              )}



            </div>

          </div>



          <div className="panel payroll-status-panel">



            <div className="panel-heading">

              <div>

                <h3>Payroll status</h3>

                <p>Current payroll records</p>

              </div>



              <MoreHorizontal size={21} />

            </div>



            <div className="status-circle">

              <div className="status-circle-inner">

                <h2>{loading ? '...' : employeeCount}</h2>

                <span>Employees</span>

              </div>

            </div>



            <div className="status-legend">



              <div>

                <span className="legend-dot paid-dot" />

                <span>Paid</span>

                <strong>{paidCount}</strong>

              </div>



              <div>

                <span className="legend-dot pending-dot" />

                <span>Pending</span>

                <strong>{pendingCount}</strong>

              </div>



              <div>

                <span className="legend-dot approved-dot" />

                <span>Approved</span>

                <strong>{approvedCount}</strong>

              </div>



            </div>

          </div>



        </section>



        <section className="panel employees-panel">



          <div className="panel-heading employees-heading">

            <div>

              <h3>Employee payroll</h3>

              <p>Manage and monitor employee wages</p>

            </div>



            <button className="export-button">

              <ReceiptText size={16} />

              Export report

            </button>

          </div>



          {actionMessage && (

            <div

              className={`payroll-action-message ${actionMessage.type}`}

              role="status"

            >

              {actionMessage.text}

            </div>

          )}



          <div className="table-toolbar">



            <div className="table-search">

              <Search size={17} />



              <input

                value={search}

                onChange={(e) => setSearch(e.target.value)}

                placeholder="Search employee or ID..."

              />

            </div>



            <select

              value={statusFilter}

              onChange={(e) => setStatusFilter(e.target.value)}

            >

              <option value="All">All statuses</option>

              <option value="Draft">Draft</option>

              <option value="Pending">Pending</option>

              <option value="Paid">Paid</option>

              <option value="Approved">Approved</option>

              <option value="Rejected">Rejected</option>

            </select>



          </div>



          <div className="table-wrapper">



            <table className="payroll-table">



              <thead>

                <tr>

                  <th>EMPLOYEE</th>

                  <th>DEPARTMENT</th>

                  <th>GROSS WAGES</th>

                  <th>NET WAGES</th>

                  <th>STATUS</th>

                  <th>ACTION</th>

                </tr>

              </thead>



              <tbody>



                {loading && (

                  <tr>

                    <td colSpan="6" className="empty-table">

                      Loading payroll records...

                    </td>

                  </tr>

                )}



                {!loading && error && (

                  <tr>

                    <td colSpan="6" className="empty-table">

                      {error}

                    </td>

                  </tr>

                )}



                {!loading && !error && filteredEmployees.map((employee) => {

                  const availableActions = getAvailableActions(employee.status);

                  const isProcessing = actionLoading === employee.payrollId;

                  const isMenuOpen = activeActionMenu === employee.payrollId;



                  return (

                    <tr

                      key={`${employee.id}-${employee.payrollYear}-${employee.payrollMonth}`}

                    >

                      <td>

                        <div className="employee-cell">

                          <div className={`employee-avatar ${employee.color}`}>

                            {employee.initials}

                          </div>



                          <div>

                            <strong>{employee.name}</strong>

                            <span>{employee.id}</span>

                          </div>

                        </div>

                      </td>



                      <td>

                        <span className="department-name">

                          {employee.department}

                        </span>

                      </td>



                      <td className="amount-cell">

                        {formatCurrency(employee.gross)}

                      </td>



                      <td className="amount-cell net-amount">

                        {formatCurrency(employee.net)}

                      </td>



                      <td>

                        <span

                          className={`status-badge ${employee.status.toLowerCase()}`}

                        >

                          <span />

                          {employee.status}

                        </span>

                      </td>
<td className="action-cell">
  <div className="payroll-row-actions">
    {['Paid', 'Approved'].includes(employee.status) && (
      <button
        className="row-action"
        title="Download Payslip"
        onClick={() =>
          handleDownloadPayslip(employee.payrollId, employee.name)
        }
      >
        <ReceiptText size={18} />
      </button>
    )}

    {availableActions.length > 0 && (
      <>
        <button
          className="row-action"
          title="Payroll actions"
          disabled={Boolean(actionLoading)}
          onClick={() => {
            setActiveActionMenu(
              isMenuOpen ? null : employee.payrollId
            );
          }}
        >
          {isProcessing ? (
            <LoaderCircle size={18} />
          ) : (
            <MoreHorizontal size={19} />
          )}
        </button>

        {isMenuOpen && (
          <div className="payroll-action-menu">
            {availableActions.includes('approve') && (
              <button
                disabled={Boolean(actionLoading)}
                onClick={() =>
                  handlePayrollAction('approve', employee)
                }
              >
                <Check size={15} />
                Approve
              </button>
            )}

            {availableActions.includes('reject') && (
              <button
                className="reject-action"
                disabled={Boolean(actionLoading)}
                onClick={() =>
                  handlePayrollAction('reject', employee)
                }
              >
                <XCircle size={15} />
                Reject
              </button>
            )}

            {availableActions.includes('paid') && (
              <button
                disabled={Boolean(actionLoading)}
                onClick={() =>
                  handlePayrollAction('paid', employee)
                }
              >
                <CircleDollarSign size={15} />
                Mark as Paid
              </button>
            )}
          </div>
        )}
      </>
    )}
  </div>
</td>


                      

                    </tr>

                  );

                })}



                {!loading && !error && filteredEmployees.length === 0 && (

                  <tr>

                    <td colSpan="6" className="empty-table">

                      No payroll records found.

                    </td>

                  </tr>

                )}



              </tbody>



            </table>



          </div>



          <div className="table-footer">

            <span>

              Showing {filteredEmployees.length} of {dashboardEmployees.length} payroll entries

            </span>



            <button>

              View all employees <ArrowUpRight size={15} />

            </button>

          </div>



        </section>



        <footer className="dashboard-footer">

          <span>© 2026 TrackPay. All rights reserved.</span>

          <span>Made for smarter workforce management ♡</span>

        </footer>



      </main>

    </div>

  );

}



export default PayrollDashboard;
