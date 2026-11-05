
import api from './api';

// Fetch an employee's existing salary structure.
export const getSalaryStructure = async (employeeId) => {
  const response = await api.get(`/salary/${employeeId}`);
  return response.data;
};

// Create a new salary structure for an employee.
export const createSalaryStructure = async (salaryDetails) => {
  const response = await api.post('/salary', salaryDetails);
  return response.data;
};

// Update an employee's existing salary structure.
export const updateSalaryStructure = async (employeeId, salaryDetails) => {
  const response = await api.put(`/salary/${employeeId}`, salaryDetails);
  return response.data;
};
