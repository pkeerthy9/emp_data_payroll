
import { useState, useEffect, useCallback } from 'react';
import { getPayrollHistory } from '../services/payrollService';

function usePayrollData() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshPayroll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getPayrollHistory();

      setPayrollRecords(data.payrolls || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load payroll records.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPayroll();
  }, [refreshPayroll]);

  return {
    payrollRecords,
    loading,
    error,
    refreshPayroll
  };
}

export default usePayrollData;
