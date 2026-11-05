import api from './api';

// Get all employees from the backend.
export const getEmployees = async (search = '') => {
  const response = await api.get('/employees', {
    params: search ? { search } : {}
  });

  return response.data;
};

// Add a new employee.
export const createEmployee = async (employeeDetails) => {
  const response = await api.post('/employees', employeeDetails);

  return response.data;
};

// Update an employee's details.
export const updateEmployee = async (employeeId, employeeDetails) => {
  const response = await api.put(
    `/employees/${employeeId}`,
    employeeDetails
  );

  return response.data;
};

// Deactivate an employee.
export const deactivateEmployee = async (employeeId) => {
  const response = await api.patch(
    `/employees/${employeeId}/deactivate`
  );

  return response.data;
};

// Reactivate an employee.
export const reactivateEmployee = async (employeeId) => {
  const response = await api.patch(
    `/employees/${employeeId}/reactivate`
  );

  return response.data;
};