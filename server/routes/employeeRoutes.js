
const express = require('express');
const router = express.Router();

const {
  createEmployee,
  getAllEmployees,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  createManager
} = require('../controller/employeeController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Admin-only employee routes
router.post('/', protect, authorize('admin'), createEmployee);

router.get('/', protect, authorize('admin'), getAllEmployees);

router.put('/:id', protect, authorize('admin'), updateEmployee);

router.patch('/:id/deactivate', protect, authorize('admin'), deactivateEmployee);

router.patch('/:id/reactivate', protect, authorize('admin'), reactivateEmployee);
// Only admins can create manager accounts
router.post('/manager', protect, authorize('admin'), createManager);

module.exports = router;
