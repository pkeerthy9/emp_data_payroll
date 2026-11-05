
import { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  UserX,
  UserCheck,
  X,
  RefreshCw
} from 'lucide-react';

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee
} from '../services/employeeService';

import './Employees.css';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  employeeId: '',
  phone: '',
  department: '',
  designation: '',
  joiningDate: '',
  employmentType: 'full-time',
  address: '',
  manager: ''
};

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Load employees from the backend.
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getEmployees(search);
      setEmployees(response.employees || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load employees.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [search]);

  // Calculate employee statistics.
  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) =>
      employee.user?.isActive ?? employee.isActive ?? true
  ).length;

  const inactiveEmployees = totalEmployees - activeEmployees;

  // Display active or inactive employees based on the selected filter.
  const visibleEmployees = employees.filter((employee) => {
    const active =
      employee.user?.isActive ?? employee.isActive ?? true;

    return showInactive ? !active : active;
  });

  // Open the form for adding an employee.
  const openAddForm = () => {
    setEditingEmployee(null);
    setForm(emptyForm);
    setShowForm(true);
    setMessage('');
  };

  // Open the form with the selected employee's details.
  const openEditForm = (employee) => {
    setEditingEmployee(employee);

    setForm({
      name: employee.user?.name || employee.name || '',
      email: employee.user?.email || employee.email || '',
      password: '',
      employeeId: employee.employeeId || '',
      phone: employee.phone || '',
      department: employee.department || '',
      designation: employee.designation || '',
      joiningDate: employee.joiningDate
        ? new Date(employee.joiningDate).toISOString().split('T')[0]
        : '',
      employmentType: employee.employmentType || 'full-time',
      address: employee.address || '',
      manager: employee.manager?._id || employee.manager || ''
    });

    setShowForm(true);
    setMessage('');
  };

  // Update form values when the user types.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Add a new employee or update an existing employee.
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const employeeDetails = { ...form };

      if (!employeeDetails.password) {
        delete employeeDetails.password;
      }

      if (editingEmployee) {
        await updateEmployee(editingEmployee._id, employeeDetails);
        setMessage('Employee updated successfully.');
      } else {
        await createEmployee(employeeDetails);
        setMessage('Employee added successfully.');
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingEmployee(null);

      await loadEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to save employee details.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate an employee.
  const handleStatusChange = async (employee) => {
    const isActive =
      employee.user?.isActive ?? employee.isActive ?? true;

    try {
      setError('');
      setMessage('');

      if (isActive) {
        await deactivateEmployee(employee._id);
        setMessage('Employee deactivated successfully.');
      } else {
        await reactivateEmployee(employee._id);
        setMessage('Employee reactivated successfully.');
      }

      await loadEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to update employee status.'
      );
    }
  };

  return (
    <div className="employees-page">

      {/* Page heading */}
      <header className="employees-header">
        <div>
          <span className="employees-eyebrow">
            WORKFORCE MANAGEMENT
          </span>
          <h1>Employee Management</h1>
          <p>
            Manage your team, employee profiles and work information.
          </p>
        </div>

        <button
          className="employee-add-button"
          onClick={openAddForm}
        >
          <UserPlus size={17} />
          Add Employee
        </button>
      </header>

      {/* Success and error messages */}
      {message && (
        <div className="employee-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="employee-message error">
          {error}
        </div>
      )}

      {/* Employee statistics */}
      <div className="employee-stats-grid">

        <section className="employee-stat-card">
          <div className="employee-stat-icon">
            <Users size={22} />
          </div>
          <div>
            <span>Total Employees</span>
            <h2>{totalEmployees}</h2>
          </div>
        </section>

        <section className="employee-stat-card">
          <div className="employee-stat-icon">
            <UserCheck size={22} />
          </div>
          <div>
            <span>Active Employees</span>
            <h2>{activeEmployees}</h2>
          </div>
        </section>

        <section className="employee-stat-card">
          <div className="employee-stat-icon">
            <UserX size={22} />
          </div>
          <div>
            <span>Inactive Employees</span>
            <h2>{inactiveEmployees}</h2>
          </div>
        </section>

      </div>

      {/* Employee directory */}
      <section className="employee-list-card">

        <div className="employee-list-heading">
          <div>
            <h2>Team Directory</h2>
            <p>View and manage employee information.</p>
          </div>

          <button
            className="employee-refresh-button"
            onClick={loadEmployees}
            title="Refresh employees"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Search and filter */}
        <div className="employee-toolbar">

          <div className="employee-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            className={`employee-filter-button ${
              showInactive ? 'selected' : ''
            }`}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? 'Show Active' : 'Show Inactive'}
          </button>

        </div>

        {/* Employee table */}
        {loading ? (
          <div className="employee-empty">
            Loading employees...
          </div>
        ) : visibleEmployees.length === 0 ? (
          <div className="employee-empty">
            No employees found.
          </div>
        ) : (
          <div className="employee-table-wrapper">

            <table className="employee-table">

              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>EMPLOYEE ID</th>
                  <th>DEPARTMENT</th>
                  <th>DESIGNATION</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {visibleEmployees.map((employee) => {
                  const active =
                    employee.user?.isActive ??
                    employee.isActive ??
                    true;

                  return (
                    <tr key={employee._id}>

                      <td>
                        <div className="employee-name-cell">

                          <div className="employee-avatar">
                            {(employee.user?.name || employee.name || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {employee.user?.name || employee.name}
                            </strong>

                            <span>
                              {employee.user?.email || employee.email}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>{employee.employeeId}</td>
                      <td>{employee.department}</td>
                      <td>{employee.designation}</td>

                      <td>
                        <span
                          className={`employee-status ${
                            active ? 'active' : 'inactive'
                          }`}
                        >
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td>
                        <div className="employee-actions">

                          <button
                            onClick={() => openEditForm(employee)}
                            title="Edit employee"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => handleStatusChange(employee)}
                            title={active ? 'Deactivate' : 'Reactivate'}
                          >
                            {active ? (
                              <UserX size={16} />
                            ) : (
                              <UserCheck size={16} />
                            )}
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

      </section>

      {/* Add and edit employee modal */}
      {showForm && (
        <div className="employee-modal-overlay">

          <form
            className="employee-modal"
            onSubmit={handleSubmit}
          >

            <div className="employee-modal-heading">

              <div>
                <span>EMPLOYEE DETAILS</span>

                <h2>
                  {editingEmployee
                    ? 'Edit Employee'
                    : 'Add New Employee'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="employee-close-button"
              >
                <X size={20} />
              </button>

            </div>

            <div className="employee-form-grid">

              <label>
                Full Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Email Address *
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>

              {!editingEmployee && (
                <label>
                  Temporary Password *
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </label>
              )}

              <label>
                Employee ID *
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Phone Number
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </label>

              <label>
                Department *
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Designation *
                <input
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Joining Date *
                <input
                  name="joiningDate"
                  type="date"
                  value={form.joiningDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Employment Type
                <select
                  name="employmentType"
                  value={form.employmentType}
                  onChange={handleChange}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </label>

              <label className="employee-full-width">
                Address
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows="3"
                />
              </label>

            </div>

            <div className="employee-modal-actions">

              <button
                type="button"
                className="employee-cancel-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="employee-save-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingEmployee
                    ? 'Update Employee'
                    : 'Save Employee'}
              </button>

            </div>

          </form>
        </div>
      )}

    </div>
  );
}

export default Employees;
