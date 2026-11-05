
const Payroll = require('../models/payroll');
const Employee = require('../models/employee');
const { createNotification } = require('./notificationController');
const { createAuditLog } = require('./auditLogController');

// Get payroll history with optional filters
const getPayrollHistory = async (req, res) => {
  try {
    const { month, year, status } = req.query;

    const filter = {};

    if (month !== undefined) {
      const monthNumber = Number(month);

      if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payroll month'
        });
      }

      filter.payrollMonth = monthNumber;
    }

    if (year !== undefined) {
      const yearNumber = Number(year);

      if (!Number.isInteger(yearNumber) || yearNumber < 2020 || yearNumber > 2100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payroll year'
        });
      }

      filter.payrollYear = yearNumber;
    }

    if (status !== undefined) {
      const allowedStatuses = ['draft', 'pending', 'approved', 'paid', 'rejected'];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payroll status'
        });
      }

      filter.status = status;
    }

    const payrolls = await Payroll.find(filter)
      .populate({
        path: 'employee',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ payrollYear: -1, payrollMonth: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payrolls.length,
      payrolls
    });

  } catch (error) {
    console.error('Payroll history error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payroll history'
    });
  }
};
// Get the logged-in employee's own payroll history.
const getMyPayrollHistory = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      user: req.user._id
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const payrolls = await Payroll.find({
      employee: employee._id,
      status: { $in: ['approved', 'paid'] }
    })
      .sort({
        payrollYear: -1,
        payrollMonth: -1
      });

    return res.status(200).json({
      success: true,
      count: payrolls.length,
      payrolls
    });

  } catch (error) {
    console.error('Employee payroll history error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve your payroll history.'
    });
  }
};
// Approve generated payroll
const approvePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (!['draft', 'pending'].includes(payroll.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only draft or pending payroll can be approved'
      });
    }

    payroll.status = 'approved';
    payroll.approvedAt = new Date();

    await payroll.save();
    // Find the employee's linked user account.
// Find the employee's linked user account.
const employee = await require('../models/employee')
  .findById(payroll.employee)
  .select('user');

// Record payroll approval in audit logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'APPROVE',
  module: 'Payroll',
  description: `Approved payroll for ${payroll.payrollMonth}/${payroll.payrollYear}`,
  targetId: payroll._id,
  details: {
    payrollMonth: payroll.payrollMonth,
    payrollYear: payroll.payrollYear,
    netSalary: payroll.netSalary
  }
});

// Notify the employee that payroll is approved.
if (employee?.user) {
  await createNotification({
    recipient: employee.user,
    title: 'Payroll Approved',
    message: `Your payroll for ${payroll.payrollMonth}/${payroll.payrollYear} has been approved. Net salary: ₹${payroll.netSalary.toFixed(2)}.`,
    type: 'payroll',
    relatedId: payroll._id
  });
}


    return res.status(200).json({
      success: true,
      message: 'Payroll approved successfully',
      payroll
    });

  } catch (error) {
    console.error('Approve payroll error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to approve payroll'
    });
  }
};

// Reject generated payroll
const rejectPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (!['draft', 'pending'].includes(payroll.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only draft or pending payroll can be rejected'
      });
    }

    payroll.status = 'rejected';

    await payroll.save();
// Record payroll rejection in audit logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'REJECT',
  module: 'Payroll',
  description: `Rejected payroll for ${payroll.payrollMonth}/${payroll.payrollYear}`,
  targetId: payroll._id,
  details: {
    payrollMonth: payroll.payrollMonth,
    payrollYear: payroll.payrollYear,
    netSalary: payroll.netSalary
  }
});
    return res.status(200).json({
      success: true,
      message: 'Payroll rejected successfully',
      payroll
    });

  } catch (error) {
    console.error('Reject payroll error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to reject payroll'
    });
  }
};

// Mark approved payroll as paid
const markPayrollAsPaid = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved payroll can be marked as paid'
      });
    }

    payroll.status = 'paid';
    payroll.paidAt = new Date();

    await payroll.save();
    // Record payroll payment status in audit logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'MARK_AS_PAID',
  module: 'Payroll',
  description: `Marked payroll as paid for ${payroll.payrollMonth}/${payroll.payrollYear}`,
  targetId: payroll._id,
  details: {
    payrollMonth: payroll.payrollMonth,
    payrollYear: payroll.payrollYear,
    netSalary: payroll.netSalary
  }
});

    return res.status(200).json({
      success: true,
      message: 'Payroll marked as paid successfully',
      payroll
    });

  } catch (error) {
    console.error('Mark payroll paid error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to mark payroll as paid'
    });
  }
};

module.exports = {
  getPayrollHistory,
  getMyPayrollHistory,
  approvePayroll,
  rejectPayroll,
  markPayrollAsPaid
};
