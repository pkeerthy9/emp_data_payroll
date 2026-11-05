
const User = require('../models/user');
const Employee = require('../models/employee');
const bcrypt = require('bcryptjs');
const { createAuditLog } = require('./auditLogController');

// Create a new employee
const createEmployee = async (req, res) => {
  try {
    const {
      name, email, password, employeeId, phone,
      department, designation, manager, joiningDate,
      employmentType, address
    } = req.body;

    if (
      !name || !email || !password || !employeeId ||
      !phone || !department || !designation || !joiningDate
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required employee details'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingEmployee = await Employee.findOne({ employeeId });

    if (existingUser || existingEmployee) {
      return res.status(409).json({
        success: false,
        message: 'Email or Employee ID already exists'
      });
    }

    if (manager) {
      const managerUser = await User.findOne({
        _id: manager,
        role: 'manager',
        isActive: true
      });

      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: 'Selected manager does not exist or is inactive'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'employee'
    });

    try {
      const employee = await Employee.create({
        user: user._id,
        employeeId,
        phone,
        department,
        designation,
        manager: manager || null,
        joiningDate,
        employmentType,
        address
      });

      const populatedEmployee = await Employee.findById(employee._id)
        .populate('user', 'name email role isActive')
        .populate('manager', 'name email role');
        // Record employee creation in the audit logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'CREATE',
  module: 'Employee',
  description: `Created employee ${name} (${employeeId})`,
  targetId: employee._id,
  details: {
    employeeId,
    department,
    designation
  }
});

      return res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        employee: populatedEmployee
      });

    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }

  } catch (error) {
    console.error('Create employee error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

// Get all employees with search and filters
const getAllEmployees = async (req, res) => {
  try {
    const { search, department, isActive } = req.query;

    let filter = {};

    if (department) {
      filter.department = department;
    }

    const employees = await Employee.find(filter)
      .populate('user', 'name email role isActive')
      .populate('manager', 'name email role')
      .sort({ createdAt: -1 });

    let filteredEmployees = employees;

    if (isActive !== undefined) {
      filteredEmployees = filteredEmployees.filter(
        employee => employee.user &&
        employee.user.isActive === (isActive === 'true')
      );
    }

    if (search) {
      const searchText = search.toLowerCase();

      filteredEmployees = filteredEmployees.filter(employee => {
        const name = employee.user?.name?.toLowerCase() || '';
        const email = employee.user?.email?.toLowerCase() || '';
        const employeeId = employee.employeeId?.toLowerCase() || '';
        const departmentName = employee.department?.toLowerCase() || '';
        const designation = employee.designation?.toLowerCase() || '';

        return (
          name.includes(searchText) ||
          email.includes(searchText) ||
          employeeId.includes(searchText) ||
          departmentName.includes(searchText) ||
          designation.includes(searchText)
        );
      });
    }

    return res.status(200).json({
      success: true,
      count: filteredEmployees.length,
      employees: filteredEmployees
    });

  } catch (error) {
    console.error('Get employees error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// Update employee details
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const user = await User.findById(employee.user);

    if (!user || user.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee account not found'
      });
    }

    const {
      name, email, phone, department, designation,
      manager, joiningDate, employmentType, address
    } = req.body;

    if (name !== undefined) user.name = name;

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();

      const existingEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id }
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already belongs to another account'
        });
      }

      user.email = normalizedEmail;
    }

    if (phone !== undefined) employee.phone = phone;
    if (department !== undefined) employee.department = department;
    if (designation !== undefined) employee.designation = designation;

    if (manager !== undefined) {
      if (manager) {
        const managerUser = await User.findOne({
          _id: manager,
          role: 'manager',
          isActive: true
        });

        if (!managerUser) {
          return res.status(400).json({
            success: false,
            message: 'Selected manager does not exist or is inactive'
          });
        }
      }

      employee.manager = manager || null;
    }

    if (joiningDate !== undefined) {
      const parsedDate = new Date(joiningDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid joining date'
        });
      }

      employee.joiningDate = parsedDate;
    }

    if (employmentType !== undefined) {
      const allowedTypes = [
        'full-time', 'part-time', 'contract', 'intern'
      ];

      if (!allowedTypes.includes(employmentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid employment type'
        });
      }

      employee.employmentType = employmentType;
    }

    if (address !== undefined) employee.address = address;

    await user.save();
    await employee.save();

    const updatedEmployee = await Employee.findById(id)
      .populate('user', 'name email role isActive')
      .populate('manager', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee
    });

  } catch (error) {
    console.error('Update employee error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

// Deactivate employee
const deactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const user = await User.findById(employee.user);

    if (!user || user.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee account not found'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already deactivated'
      });
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
      employeeId: employee.employeeId,
      isActive: false
    });

  } catch (error) {
    console.error('Deactivate employee error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate employee',
      error: error.message
    });
  }
};

// Reactivate employee
const reactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const user = await User.findById(employee.user);

    if (!user || user.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee account not found'
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already active'
      });
    }

    user.isActive = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Employee reactivated successfully',
      employeeId: employee.employeeId,
      isActive: true
    });

  } catch (error) {
    console.error('Reactivate employee error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to reactivate employee',
      error: error.message
    });
  }
};
// Admin creates a manager account
const createManager = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const manager = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'manager'
    });

    return res.status(201).json({
      success: true,
      message: 'Manager account created successfully',
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role
      }
    });

  } catch (error) {
    console.error('Create manager error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to create manager account'
    });
  }
};
module.exports = {
  
  createEmployee,
  getAllEmployees,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
   createManager
};
