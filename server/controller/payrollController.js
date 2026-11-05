
const Payroll = require('../models/payroll');
const Employee = require('../models/employee');
const SalaryStructure = require('../models/salaryStructure');
const { createNotification } = require('./notificationController');
const { createAuditLog } = require('./auditLogController');

// Generate monthly payroll for an employee
const generatePayroll = async (req, res) => {
  try {
    const {
      employeeId,
      payrollMonth,
      payrollYear,
      workingDays,
      presentDays,
      overtimeHours = 0,
      overtimeMultiplier = 1.5
    } = req.body;

    // Validate required fields
    if (
      !employeeId ||
      payrollMonth === undefined ||
      payrollYear === undefined ||
      workingDays === undefined ||
      presentDays === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Employee, month, year and attendance details are required'
      });
    }

    // Validate payroll period
    if (
      !Number.isInteger(payrollMonth) ||
      payrollMonth < 1 ||
      payrollMonth > 12 ||
      !Number.isInteger(payrollYear) ||
      payrollYear < 2020 ||
      payrollYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payroll month or year'
      });
    }

    // Validate attendance and overtime
    if (
      typeof workingDays !== 'number' ||
      typeof presentDays !== 'number' ||
      typeof overtimeHours !== 'number' ||
      typeof overtimeMultiplier !== 'number' ||
      !Number.isFinite(workingDays) ||
      !Number.isFinite(presentDays) ||
      !Number.isFinite(overtimeHours) ||
      !Number.isFinite(overtimeMultiplier) ||
      workingDays <= 0 ||
      presentDays < 0 ||
      presentDays > workingDays ||
      overtimeHours < 0 ||
      overtimeMultiplier < 1 ||
      overtimeMultiplier > 3
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid working days, attendance or overtime values'
      });
    }

    // Find employee
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Find linked user account
    const user = await require('../models/user').findById(employee.user);

    if (!user || user.role !== 'employee' || !user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Employee account is inactive or unavailable'
      });
    }

    // Find active salary structure
    const salaryStructure = await SalaryStructure.findOne({
      employee: employeeId,
      isActive: true,
      effectiveFrom: {
  $lte: new Date(Date.UTC(payrollYear, payrollMonth - 1, 1))
}
    });

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: 'No effective active salary structure found'
      });
    }

    // Prevent duplicate payroll generation
    const existingPayroll = await Payroll.findOne({
      employee: employeeId,
      payrollMonth,
      payrollYear
    });

    if (existingPayroll) {
      return res.status(409).json({
        success: false,
        message: 'Payroll already exists for this employee and month'
      });
    }

    // Calculate attendance ratio
    const attendanceRatio = presentDays / workingDays;

    // Calculate basic earnings
    let basicEarnings;

    if (salaryStructure.salaryType === 'daily') {
      basicEarnings = salaryStructure.basicSalary * presentDays;
    } else {
      basicEarnings = salaryStructure.basicSalary * attendanceRatio;
    }

    // Calculate allowances and incentives
    const monthlyAllowances =
      salaryStructure.hra +
      salaryStructure.travelAllowance +
      salaryStructure.otherAllowances;

    const totalAllowances = monthlyAllowances * attendanceRatio;

    const incentives = salaryStructure.incentive * attendanceRatio;

    // Calculate overtime pay
    const hourlyRate =
      salaryStructure.salaryType === 'daily'
        ? salaryStructure.basicSalary / 8
        : salaryStructure.basicSalary / (workingDays * 8);

    const overtimePay =
      hourlyRate * overtimeHours * overtimeMultiplier;

    // Calculate gross salary
    const grossSalary =
      basicEarnings +
      totalAllowances +
      incentives +
      overtimePay;

    // Calculate deductions proportionally
    const monthlyDeductions =
      salaryStructure.pfDeduction +
      salaryStructure.taxDeduction +
      salaryStructure.otherDeductions;

    const totalDeductions = monthlyDeductions * attendanceRatio;

    // Calculate final take-home wages
    const netSalary = grossSalary - totalDeductions;

    if (netSalary < 0) {
      return res.status(400).json({
        success: false,
        message: 'Calculated deductions exceed gross earnings'
      });
    }

    const absentDays = workingDays - presentDays;

    // Save payroll record
    const payroll = await Payroll.create({
      employee: employeeId,
      salaryStructure: salaryStructure._id,
      payrollMonth,
      payrollYear,
      workingDays,
      presentDays,
      absentDays,
      overtimeHours,
      basicEarnings: Number(basicEarnings.toFixed(2)),
      totalAllowances: Number(totalAllowances.toFixed(2)),
      incentives: Number(incentives.toFixed(2)),
      overtimePay: Number(overtimePay.toFixed(2)),
      grossSalary: Number(grossSalary.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      netSalary: Number(netSalary.toFixed(2)),
      status: 'draft'
    });
    // Notify the employee that their monthly payroll was generated.
await createNotification({
  recipient: user._id,
  title: 'Payroll Generated',
  message: `Your payroll for ${payrollMonth}/${payrollYear} has been generated. Net salary: ₹${payroll.netSalary.toFixed(2)}. Status: Draft.`,
  type: 'payroll',
  relatedId: payroll._id
});
// Record payroll generation in the audit logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'GENERATE',
  module: 'Payroll',
  description: `Generated payroll for ${user.name} (${employee.employeeId}) for ${payrollMonth}/${payrollYear}`,
  targetId: payroll._id,
  details: {
    employeeId: employee.employeeId,
    payrollMonth,
    payrollYear,
    grossSalary: payroll.grossSalary,
    netSalary: payroll.netSalary
  }
});
    return res.status(201).json({
      success: true,
      message: 'Payroll generated successfully',
      payroll
    });

  } catch (error) {
    console.error('Generate payroll error:', error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Payroll already exists for this employee and month'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate payroll',
      error: error.message
    });
  }
};

module.exports = {
  generatePayroll
};
