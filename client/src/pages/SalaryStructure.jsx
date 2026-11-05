
import { useEffect, useState } from 'react';
import { Save, Wallet, UserRound, IndianRupee } from 'lucide-react';
import api from '../services/api';
import {
  getSalaryStructure,
  createSalaryStructure,
  updateSalaryStructure
} from '../services/salaryService';
import './SalaryStructure.css';

const initialForm = {
  salaryType: 'monthly',
  basicSalary: '',
  hra: '',
  travelAllowance: '',
  otherAllowances: '',
  incentive: '',
  pfDeduction: '',
  taxDeduction: '',
  otherDeductions: '',
  effectiveFrom: new Date().toISOString().split('T')[0]
};

function SalaryStructure() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [form, setForm] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

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

  const handleEmployeeChange = async (employeeId) => {
    setSelectedEmployee(employeeId);
    setForm(initialForm);
    setIsEditing(false);
    setMessage('');
    setError('');

    if (!employeeId) return;

    try {
      const data = await getSalaryStructure(employeeId);
      const salary = data.salaryStructure || data.salary || data;

      if (salary && salary.basicSalary !== undefined) {
        setForm({
          salaryType: salary.salaryType || 'monthly',
          basicSalary: salary.basicSalary ?? '',
          hra: salary.hra ?? '',
          travelAllowance: salary.travelAllowance ?? '',
          otherAllowances: salary.otherAllowances ?? '',
          incentive: salary.incentive ?? '',
          pfDeduction: salary.pfDeduction ?? '',
          taxDeduction: salary.taxDeduction ?? '',
          otherDeductions: salary.otherDeductions ?? '',
          effectiveFrom: salary.effectiveFrom
            ? new Date(salary.effectiveFrom).toISOString().split('T')[0]
            : initialForm.effectiveFrom
        });
        setIsEditing(true);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Unable to load salary details.');
      }
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const numberValue = (value) => Number(value || 0);

  const totalAllowances =
    numberValue(form.hra) +
    numberValue(form.travelAllowance) +
    numberValue(form.otherAllowances) +
    numberValue(form.incentive);

  const grossSalary = numberValue(form.basicSalary) + totalAllowances;

  const totalDeductions =
    numberValue(form.pfDeduction) +
    numberValue(form.taxDeduction) +
    numberValue(form.otherDeductions);

  const netSalary = grossSalary - totalDeductions;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!selectedEmployee) {
      setError('Please select an employee.');
      return;
    }

    if (!form.basicSalary || numberValue(form.basicSalary) <= 0) {
      setError('Please enter a basic salary greater than zero.');
      return;
    }

    if (netSalary < 0) {
      setError('Total deductions cannot be greater than gross salary.');
      return;
    }

    const salaryDetails = {
      ...form,
      basicSalary: numberValue(form.basicSalary),
      hra: numberValue(form.hra),
      travelAllowance: numberValue(form.travelAllowance),
      otherAllowances: numberValue(form.otherAllowances),
      incentive: numberValue(form.incentive),
      pfDeduction: numberValue(form.pfDeduction),
      taxDeduction: numberValue(form.taxDeduction),
      otherDeductions: numberValue(form.otherDeductions)
    };

    try {
      setSaving(true);

      if (isEditing) {
        await updateSalaryStructure(selectedEmployee, salaryDetails);
        setMessage('Salary structure updated successfully.');
      } else {
        await createSalaryStructure({
          ...salaryDetails,
          employee: selectedEmployee
        });
        setMessage('Salary structure created successfully.');
        setIsEditing(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save salary structure.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="salary-page">
      <div className="salary-heading">
        <div>
          <span className="salary-eyebrow">PAYROLL MANAGEMENT</span>
          <h1>Salary Structure</h1>
          <p>Configure employee wages, allowances and deductions.</p>
        </div>
        <div className="salary-heading-icon">
          <Wallet size={25} />
        </div>
      </div>

      {message && <div className="salary-message success">{message}</div>}
      {error && <div className="salary-message error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <section className="salary-section">
          <div className="salary-section-title">
            <UserRound size={19} />
            <div>
              <h2>Employee Details</h2>
              <p>Select the employee whose salary you want to configure.</p>
            </div>
          </div>

          <label className="salary-field">
            Employee
            <select
              value={selectedEmployee}
              onChange={(event) => handleEmployeeChange(event.target.value)}
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

        <section className="salary-section">
          <div className="salary-section-title">
            <IndianRupee size={19} />
            <div>
              <h2>Earnings</h2>
              <p>Set the employee's salary and additional earnings.</p>
            </div>
          </div>

          <div className="salary-form-grid">
            <label className="salary-field">
              Salary Type
              <select name="salaryType" value={form.salaryType} onChange={handleChange}>
                <option value="monthly">Monthly</option>
                <option value="daily">Daily</option>
              </select>
            </label>

            <label className="salary-field">
              Basic Salary (₹)
              <input name="basicSalary" type="number" min="0" value={form.basicSalary} onChange={handleChange} required />
            </label>

            <label className="salary-field">
              House Rent Allowance — HRA (₹)
              <input name="hra" type="number" min="0" value={form.hra} onChange={handleChange} />
            </label>

            <label className="salary-field">
              Travel Allowance (₹)
              <input name="travelAllowance" type="number" min="0" value={form.travelAllowance} onChange={handleChange} />
            </label>

            <label className="salary-field">
              Other Allowances (₹)
              <input name="otherAllowances" type="number" min="0" value={form.otherAllowances} onChange={handleChange} />
            </label>

            <label className="salary-field">
              Incentives (₹)
              <input name="incentive" type="number" min="0" value={form.incentive} onChange={handleChange} />
            </label>
          </div>
        </section>

        <section className="salary-section">
          <div className="salary-section-title">
            <Wallet size={19} />
            <div>
              <h2>Deductions</h2>
              <p>Configure deductions used in net salary calculation.</p>
            </div>
          </div>

          <div className="salary-form-grid">
            <label className="salary-field">
              PF Deduction (₹)
              <input name="pfDeduction" type="number" min="0" value={form.pfDeduction} onChange={handleChange} />
            </label>

            <label className="salary-field">
              Tax Deduction (₹)
              <input name="taxDeduction" type="number" min="0" value={form.taxDeduction} onChange={handleChange} />
            </label>

            <label className="salary-field">
              Other Deductions (₹)
              <input name="otherDeductions" type="number" min="0" value={form.otherDeductions} onChange={handleChange} />
            </label>

            <label className="salary-field">
              Effective From
              <input name="effectiveFrom" type="date" value={form.effectiveFrom} onChange={handleChange} required />
            </label>
          </div>
        </section>

        <section className="salary-summary">
          <h2>Salary Preview</h2>
          <div className="salary-summary-grid">
            <div>
              <span>Basic + Allowances</span>
              <strong>₹{grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div>
              <span>Total Deductions</span>
              <strong>₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="net-preview">
              <span>Estimated Net Salary</span>
              <strong>₹{netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </section>

        <div className="salary-submit-row">
          <button type="submit" disabled={saving || !selectedEmployee}>
            <Save size={17} />
            {saving ? 'Saving...' : isEditing ? 'Update Salary Structure' : 'Save Salary Structure'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalaryStructure;
