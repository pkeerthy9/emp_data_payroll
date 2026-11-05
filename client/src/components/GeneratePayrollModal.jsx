
import { useState } from 'react';
import { generatePayroll } from '../services/payrollService';
import { X, Calculator, LoaderCircle } from 'lucide-react';

function GeneratePayrollModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employeeId: '',
    payrollMonth: new Date().getMonth() + 1,
    payrollYear: new Date().getFullYear(),
    workingDays: 22,
    presentDays: 22,
    overtimeHours: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.employeeId.trim()) {
      setError('Please enter the employee profile ID.');
      return;
    }

    const payrollDetails = {
      employeeId: formData.employeeId.trim(),
      payrollMonth: Number(formData.payrollMonth),
      payrollYear: Number(formData.payrollYear),
      workingDays: Number(formData.workingDays),
      presentDays: Number(formData.presentDays),
      overtimeHours: Number(formData.overtimeHours)
    };

    if (
      payrollDetails.workingDays <= 0 ||
      payrollDetails.presentDays < 0 ||
      payrollDetails.presentDays > payrollDetails.workingDays ||
      payrollDetails.overtimeHours < 0
    ) {
      setError('Please enter valid attendance and overtime details.');
      return;
    }

    try {
      setLoading(true);

      await generatePayroll(payrollDetails);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to generate payroll. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="payroll-modal">
        <div className="modal-heading">
          <div>
            <span className="modal-eyebrow">
              AUTOMATED WAGE CALCULATOR
            </span>
            <h2>Generate payroll</h2>
            <p>
              Enter employee attendance details to calculate wages.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee profile ID</label>
            <input
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              placeholder="Enter employee profile ID"
              required
            />
            <small>
              Use the employee profile ID from TrackPay.
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Payroll month</label>
              <select
                name="payrollMonth"
                value={formData.payrollMonth}
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
            </div>

            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                name="payrollYear"
                min="2020"
                max="2100"
                value={formData.payrollYear}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Working days</label>
              <input
                type="number"
                name="workingDays"
                min="1"
                value={formData.workingDays}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Present days</label>
              <input
                type="number"
                name="presentDays"
                min="0"
                value={formData.presentDays}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Overtime hours</label>
            <input
              type="number"
              name="overtimeHours"
              min="0"
              step="0.5"
              value={formData.overtimeHours}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-payroll-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={17} />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator size={17} />
                  Calculate payroll
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GeneratePayrollModal;
