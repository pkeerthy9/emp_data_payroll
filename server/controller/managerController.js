const Employee = require('../models/employee');
const Attendance = require('../models/attendance');

// Get employees assigned to the logged-in manager.
const getMyTeam = async (req, res) => {
  try {
    const employees = await Employee.find({
      manager: req.user._id
    })
      .populate('user', 'name email isActive')
      .sort({ createdAt: -1 });

    const activeEmployees = employees.filter(
      employee => employee.user && employee.user.isActive
    );

    return res.status(200).json({
      success: true,
      count: activeEmployees.length,
      employees: activeEmployees
    });

  } catch (error) {
    console.error('Manager team error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch your team.'
    });
  }
};

// Get today's attendance for employees assigned to the manager.
const getTeamAttendance = async (req, res) => {
  try {
    const employees = await Employee.find({
      manager: req.user._id
    }).populate('user', 'name email isActive');

    const activeEmployees = employees.filter(
      employee => employee.user && employee.user.isActive
    );

    const employeeIds = activeEmployees.map(
      employee => employee._id
    );

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const attendanceRecords = await Attendance.find({
      employee: { $in: employeeIds },
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate({
      path: 'employee',
      populate: {
        path: 'user',
        select: 'name email isActive'
      }
    });

    return res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      attendance: attendanceRecords
    });

  } catch (error) {
    console.error('Manager attendance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch team attendance.'
    });
  }
};

// Get the manager's dashboard summary.
const getManagerDashboard = async (req, res) => {
  try {
    const employees = await Employee.find({
      manager: req.user._id
    }).populate('user', 'name email isActive');

    const activeEmployees = employees.filter(
      employee => employee.user && employee.user.isActive
    );

    const employeeIds = activeEmployees.map(
      employee => employee._id
    );

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const attendanceRecords = await Attendance.find({
      employee: { $in: employeeIds },
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const presentEmployees = attendanceRecords.filter(
      record =>
        ['present', 'late', 'half-day'].includes(record.status)
    ).length;

    const activeSessions = attendanceRecords.filter(
      record => record.isTrackingActive
    ).length;

    const completedSessions = attendanceRecords.filter(
      record => record.checkIn?.time && record.checkOut?.time
    ).length;

    const totalWorkingHours = Number(
      attendanceRecords.reduce(
        (total, record) => total + (record.workingHours || 0),
        0
      ).toFixed(2)
    );

    return res.status(200).json({
      success: true,
      summary: {
        totalEmployees: activeEmployees.length,
        presentEmployees,
        notCheckedIn: Math.max(
          0,
          activeEmployees.length - attendanceRecords.length
        ),
        activeSessions,
        completedSessions,
        totalWorkingHours
      }
    });

  } catch (error) {
    console.error('Manager dashboard error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to load manager dashboard.'
    });
  }
};

module.exports = {
  getMyTeam,
  getTeamAttendance,
  getManagerDashboard
};