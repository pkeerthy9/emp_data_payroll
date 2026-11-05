
const Leave = require('../models/leave');
const Employee = require('../models/employee');
const { createNotification } = require('./notificationController');
// Imports the helper used to record leave activities.
const { createAuditLog } = require('./auditLogController');

// Calculate inclusive calendar days between two dates.
const calculateLeaveDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

// Employee applies for leave.
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all leave details'
      });
    }

    const validTypes = ['casual', 'sick', 'earned', 'unpaid'];

    if (!validTypes.includes(leaveType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave type'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start.toISOString().slice(0, 10) !== startDate ||
      end.toISOString().slice(0, 10) !== endDate ||
      start > end
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid leave dates'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Leave cannot start in the past'
      });
    }

    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const overlappingLeave = await Leave.findOne({
      employee: employee._id,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (overlappingLeave) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending or approved leave during these dates'
      });
    }

    const leave = await Leave.create({
      employee: employee._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays: calculateLeaveDays(start, end),
      reason: reason.trim()
    });
    // Record the employee's leave application in Audit Logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'APPLY',
  module: 'Leave',
  description: `${req.user.name} applied for ${leaveType} leave`,
  targetId: leave._id,
  details: {
    leaveType,
    startDate,
    endDate,
    totalDays: leave.totalDays
  }
});
    // Notify the assigned manager about the new leave request.
if (employee.manager) {
  await createNotification({
    recipient: employee.manager,
    title: 'New Leave Request',
    message: `${req.user.name} has submitted a ${leaveType} leave request.`,
    type: 'leave',
    relatedId: leave._id
  });
}

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave
    });
  } catch (error) {
    console.error('Apply leave error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to submit leave application'
    });
  }
};

// Employee views their own leave history.
const getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const leaves = await Leave.find({ employee: employee._id })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves
    });
  } catch (error) {
    console.error('Get my leaves error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch leave history'
    });
  }
};

// Employee cancels their own pending leave.
const cancelLeave = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const leave = await Leave.findOne({
      _id: req.params.id,
      employee: employee._id
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave applications can be cancelled'
      });
    }

    leave.status = 'cancelled';
    await leave.save();
    // Record the leave cancellation in Audit Logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'CANCEL',
  module: 'Leave',
  description: `${req.user.name} cancelled a leave application`,
  targetId: leave._id,
  details: {
    leaveType: leave.leaveType,
    startDate: leave.startDate,
    endDate: leave.endDate
  }
});
    return res.status(200).json({
      success: true,
      message: 'Leave application cancelled',
      leave
    });
  } catch (error) {
    console.error('Cancel leave error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to cancel leave application'
    });
  }
};

// Manager views leave applications from their assigned employees.
const getTeamLeaves = async (req, res) => {
  try {
    const team = await Employee.find({
      manager: req.user._id
    }).select('_id');

    const employeeIds = team.map(employee => employee._id);

    const leaves = await Leave.find({
      employee: { $in: employeeIds }
    })
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves
    });
  } catch (error) {
    console.error('Get team leaves error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch team leave applications'
    });
  }
};

// Admin views all leave applications.
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves
    });
  } catch (error) {
    console.error('Get all leaves error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch leave applications'
    });
  }
};

// Manager or admin approves/rejects a leave application.
const reviewLeave = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected'
      });
    }

    if (
      status === 'rejected' &&
      (!rejectionReason || !rejectionReason.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection'
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be reviewed'
      });
    }

    if (req.user.role === 'manager') {
      const employee = await Employee.findById(leave.employee);

      if (!employee || String(employee.manager) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'You can only review leave requests from your assigned team'
        });
      }
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.rejectionReason =
      status === 'rejected' ? rejectionReason.trim() : '';

    await leave.save();
    // Record the leave approval or rejection in Audit Logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: status === 'approved' ? 'APPROVE' : 'REJECT',
  module: 'Leave',
  description: `${req.user.name} ${status} a leave application`,
  targetId: leave._id,
  details: {
    leaveType: leave.leaveType,
    startDate: leave.startDate,
    endDate: leave.endDate,
    rejectionReason: leave.rejectionReason
  }
});
    // Find the employee who submitted the leave request.
const employeeForNotification = await Employee.findById(leave.employee)
  .select('user');

// Notify the employee about the leave decision.
if (employeeForNotification?.user) {
  await createNotification({
    recipient: employeeForNotification.user,
    title: status === 'approved' ? 'Leave Approved' : 'Leave Rejected',
    message:
      status === 'approved'
        ? 'Your leave request has been approved.'
        : `Your leave request has been rejected. Reason: ${leave.rejectionReason}`,
    type: 'leave',
    relatedId: leave._id
  });
}

    return res.status(200).json({
      success: true,
      message: `Leave application ${status}`,
      leave
    });
  } catch (error) {
    console.error('Review leave error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to review leave application'
    });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getTeamLeaves,
  getAllLeaves,
  reviewLeave
};
