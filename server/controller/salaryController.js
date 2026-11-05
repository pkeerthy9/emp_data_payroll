
const SalaryStructure = require('../models/salaryStructure');
const Employee = require('../models/employee');

// Create salary structure for an employee
const createSalaryStructure = async (req, res) => {
  try {
    const {
      employee,
      salaryType,
      basicSalary,
      hra,
      travelAllowance,
      otherAllowances,
      incentive,
      pfDeduction,
      taxDeduction,
      otherDeductions,
      effectiveFrom
    } = req.body;

    if (!employee || basicSalary === undefined || !effectiveFrom) {
      return res.status(400).json({
        success: false,
        message: 'Employee, basic salary and effective date are required'
      });
    }

    const employeeExists = await Employee.findById(employee);

    if (!employeeExists) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const existingStructure = await SalaryStructure.findOne({
      employee,
      isActive: true
    });

    if (existingStructure) {
      return res.status(409).json({
        success: false,
        message: 'An active salary structure already exists for this employee'
      });
    }

    const salaryFields = {
      basicSalary,
      hra,
      travelAllowance,
      otherAllowances,
      incentive,
      pfDeduction,
      taxDeduction,
      otherDeductions
    };

    for (const [field, value] of Object.entries(salaryFields)) {
      if (value !== undefined && (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0
      )) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid non-negative number`
        });
      }
    }

    if (salaryType && !['monthly', 'daily'].includes(salaryType)) {
      return res.status(400).json({
        success: false,
        message: 'Salary type must be monthly or daily'
      });
    }

    const parsedDate = new Date(effectiveFrom);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid effective date'
      });
    }

    const salaryStructure = await SalaryStructure.create({
      employee,
      salaryType: salaryType || 'monthly',
      basicSalary,
      hra,
      travelAllowance,
      otherAllowances,
      incentive,
      pfDeduction,
      taxDeduction,
      otherDeductions,
      effectiveFrom: parsedDate
    });

    const populatedSalary = await SalaryStructure.findById(
      salaryStructure._id
    ).populate({
      path: 'employee',
      populate: {
        path: 'user',
        select: 'name email role isActive'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Salary structure created successfully',
      salaryStructure: populatedSalary
    });

  } catch (error) {
    console.error('Create salary structure error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to create salary structure',
      error: error.message
    });
  }
};

// Get salary structure for an employee
const getSalaryStructure = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const salaryStructure = await SalaryStructure.findOne({
      employee: employeeId,
      isActive: true
    }).populate({
      path: 'employee',
      populate: {
        path: 'user',
        select: 'name email role isActive'
      }
    });

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: 'Active salary structure not found for this employee'
      });
    }

    return res.status(200).json({
      success: true,
      salaryStructure
    });

  } catch (error) {
    console.error('Get salary structure error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch salary structure',
      error: error.message
    });
  }
};

// Update an employee's salary structure
const updateSalaryStructure = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const salaryStructure = await SalaryStructure.findOne({
      employee: employeeId,
      isActive: true
    });

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: 'Active salary structure not found'
      });
    }

    const allowedFields = [
      'salaryType',
      'basicSalary',
      'hra',
      'travelAllowance',
      'otherAllowances',
      'incentive',
      'pfDeduction',
      'taxDeduction',
      'otherDeductions',
      'effectiveFrom'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'salaryType') {
          if (!['monthly', 'daily'].includes(req.body[field])) {
            return res.status(400).json({
              success: false,
              message: 'Salary type must be monthly or daily'
            });
          }
        } else if (field === 'effectiveFrom') {
          const parsedDate = new Date(req.body[field]);

          if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
              success: false,
              message: 'Invalid effective date'
            });
          }

          salaryStructure[field] = parsedDate;
          continue;
        } else if (
          typeof req.body[field] !== 'number' ||
          !Number.isFinite(req.body[field]) ||
          req.body[field] < 0
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a valid non-negative number`
          });
        }

        salaryStructure[field] = req.body[field];
      }
    }

    await salaryStructure.save();

    const updatedSalary = await SalaryStructure.findById(
      salaryStructure._id
    ).populate({
      path: 'employee',
      populate: {
        path: 'user',
        select: 'name email role isActive'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Salary structure updated successfully',
      salaryStructure: updatedSalary
    });

  } catch (error) {
    console.error('Update salary structure error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to update salary structure',
      error: error.message
    });
  }
};

module.exports = {
  createSalaryStructure,
  getSalaryStructure,
  updateSalaryStructure
};
