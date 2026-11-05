
import api from './api';

export const getPayrollHistory = async () => {
  const response = await api.get('/payroll-management/history');
  return response.data;
};

export const generatePayroll = async (payrollDetails) => {
  const response = await api.post('/payroll/generate', payrollDetails);
  return response.data;
};

export const approvePayroll = async (payrollId) => {
  const response = await api.patch(
    `/payroll-management/${payrollId}/approve`
  );
  return response.data;
};

export const rejectPayroll = async (payrollId) => {
  const response = await api.patch(
    `/payroll-management/${payrollId}/reject`
  );
  return response.data;
};

export const markPayrollAsPaid = async (payrollId) => {
  const response = await api.patch(
    `/payroll-management/${payrollId}/pay`
  );
  return response.data;
};
