
import { useEffect, useState } from 'react';
import { Calculator, Wallet, CalendarDays, UserRound } from 'lucide-react';
import api from '../services/api';
import { generatePayroll } from '../services/payrollService';
import './GeneratePayroll.css';

function GeneratePayroll() {
  const today = new Date();

  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: '',
    payrollMonth: String(today.getMonth() + 1),
    payrollYear: String(today.getFullYear()),
    workingDays: '26',
    presentDays: '26',
    overtimeHours: '0',
    overtimeMultiplier: '1.5'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [generatedPayroll, setGeneratedPayroll] = useState(null);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const response = await api.get('/employees');
        setEmployees(response.data.employees || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load employees.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setMessage('');
    setError('');
    setGeneratedPayroll(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');
    setGeneratedPayroll(null);

    const workingDays = Number(form.workingDays);
    const presentDays = Number(form.presentDays);
    const overtimeHours = Number(form.overtimeHours);

    if (!form.employeeId) {
      setError('Please select an employee.');
      return;
    }

    if (workingDays <= 0 || presentDays < 0 || presentDays > workingDays) {
      setError('Please enter valid working days and present days.');
      return;
    }

    if (overtimeHours < 0) {
      setError('Overtime hours cannot be negative.');
      return;
    }

    const payrollDetails = {
      employeeId: form.employeeId,
      payrollMonth: Number(form.payrollMonth),
      payrollYear: Number(form.payrollYear),
      workingDays,
      presentDays,
      overtimeHours,
      overtimeMultiplier: Number(form.overtimeMultiplier)
    };

    try {
      setSaving(true);

      const response = await generatePayroll(payrollDetails);

      const payroll =
        response.payroll ||
        response.data?.payroll ||
        response.data ||
        null;

      setGeneratedPayroll(payroll);
      setMessage(response.message || 'Payroll generated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to generate payroll.'
      );
    } finally {
      setSaving(false);
    }
  };

  const money = (value) =>
    Number(value || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    });

  return (
    <div className="generate-payroll-page">
      <div className="generate-payroll-heading">
        <div>
          <span className="generate-payroll-eyebrow">PAYROLL MANAGEMENT</span>
          <h1>Generate Payroll</h1>
          <p>Calculate employee wages using their saved salary structure.</p>
        </div>

        <div className="generate-payroll-icon">
          <Calculator size={25} />
        </div>
      </div>

      {message && (
        <div className="generate-payroll-message success">{message}</div>
      )}

      {error && (
        <div className="generate-payroll-message error">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <section className="generate-payroll-section">
          <div className="generate-payroll-section-title">
            <UserRound size={19} />
            <div>
              <h2>Employee Selection</h2>
              <p>Choose the employee for this payroll calculation.</p>
            </div>
          </div>

          <label className="generate-payroll-field">
            Employee
            <select
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              required
            >
              <option value="">
                {loading ? 'Loading employees...' : 'Select an employee'}
              </option>

              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.user?.name || employee.name} — {employee.employeeId}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="generate-payroll-section">
          <div className="generate-payroll-section-title">
            <CalendarDays size={19} />
            <div>
              <h2>Payroll Period</h2>
              <p>Select the month and year for the payroll.</p>
            </div>
          </div>

          <div className="generate-payroll-grid">
            <label className="generate-payroll-field">
              Payroll Month
              <select
                name="payrollMonth"
                value={form.payrollMonth}
                onChange={handleChange}
              >
                {[
                  'January', 'February', 'March', 'April',
                  'May', 'June', 'July', 'August',
                  'September', 'October', 'November', 'December'
                ].map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>

            <label className="generate-payroll-field">
              Payroll Year
              <input
                name="payrollYear"
                type="number"
                min="2020"
                max="2100"
                value={form.payrollYear}
                onChange={handleChange}
                required
              />
            </label>
          </div>
        </section>

        <section className="generate-payroll-section">
          <div className="generate-payroll-section-title">
            <Wallet size={19} />
            <div>
              <h2>Attendance and Overtime</h2>
              <p>Enter the attendance details used for wage calculation.</p>
            </div>
          </div>

          <div className="generate-payroll-grid">
            <label className="generate-payroll-field">
              Total Working Days
              <input
                name="workingDays"
                type="number"
                min="1"
                value={form.workingDays}
                onChange={handleChange}
                required
              />
            </label>

            <label className="generate-payroll-field">
              Present Days
              <input
                name="presentDays"
                type="number"
                min="0"
                value={form.presentDays}
                onChange={handleChange}
                required
              />
            </label>

            <label className="generate-payroll-field">
              Overtime Hours
              <input
                name="overtimeHours"
                type="number"
                min="0"
                step="0.5"
                value={form.overtimeHours}
                onChange={handleChange}
              />
            </label>

            <label className="generate-payroll-field">
              Overtime Multiplier
              <select
                name="overtimeMultiplier"
                value={form.overtimeMultiplier}
                onChange={handleChange}
              >
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </label>
          </div>
        </section>

        <div className="generate-payroll-submit">
          <button type="submit" disabled={saving || loading}>
            <Calculator size={17} />
            {saving ? 'Calculating Payroll...' : 'Generate Payroll'}
          </button>
        </div>
      </form>

      {generatedPayroll && (
        <section className="generated-payroll-result">
          <h2>Generated Payroll Summary</h2>

          <div className="generated-payroll-result-grid">
            <div>
              <span>Gross Salary</span>
              <strong>{money(generatedPayroll.grossSalary)}</strong>
            </div>

            <div>
              <span>Total Deductions</span>
              <strong>{money(generatedPayroll.totalDeductions)}</strong>
            </div>

            <div className="generated-net-salary">
              <span>Net Salary</span>
              <strong>{money(generatedPayroll.netSalary)}</strong>
            </div>
          </div>

          <p>Payroll status: <strong>{generatedPayroll.status || 'Draft'}</strong></p>
        </section>
      )}
    </div>
  );
}

export default GeneratePayroll;
