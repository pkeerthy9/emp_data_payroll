
const express = require('express');
const router = express.Router();

const {
  createSalaryStructure,
  getSalaryStructure,
  updateSalaryStructure
} = require('../controller/salaryController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Admin-only salary routes
router.post('/', protect, authorize('admin'), createSalaryStructure);

router.get('/:employeeId', protect, authorize('admin'), getSalaryStructure);

router.put('/:employeeId', protect, authorize('admin'), updateSalaryStructure);

module.exports = router;
