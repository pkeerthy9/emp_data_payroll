
const Attendance = require('../models/attendance');
const Employee = require('../models/employee');
// Imports the helper used to record attendance activities.
const { createAuditLog } = require('./auditLogController');

// Get the beginning of today's date using the server's local timezone.
// TrackPay demo office location: Gachibowli, Hyderabad.
// TrackPay demo office location: Gachibowli, Hyderabad.
const OFFICE_LOCATION = {
  latitude: 17.4311926,
  longitude: 78.3403626
};

// Employees must be within 200 metres of the office.
const GEOFENCE_RADIUS = 200;

// Calculate the distance between two GPS coordinates in metres.
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371000;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lon2 - lon1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

// Get the beginning of today's date using the server's local timezone.
const getToday = () => {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
};
// Find the employee profile linked to the logged-in user.
const getEmployeeProfile = async (userId) => {
  return Employee.findOne({ user: userId });
};

// Employee checks in and grants location permission.
const checkIn = async (req, res) => {
  try {
    const employee = await getEmployeeProfile(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const { latitude, longitude, accuracy, locationConsent } = req.body;

    if (locationConsent !== true) {
      return res.status(400).json({
        success: false,
        message: 'Location permission is required for GPS attendance.'
      });
    }

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(accuracy) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      accuracy < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid GPS coordinates and accuracy are required.'
      });
    }

    const today = getToday();

    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: today
    });

    if (attendance?.checkIn?.time && !attendance.checkOut?.time) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in and your work session is active.'
      });
    }

    if (attendance?.checkOut?.time) {
      return res.status(400).json({
        success: false,
        message: 'You have already completed attendance for today.'
      });
    }
    // Calculate the employee's distance from the TrackPay office.
const distanceFromOffice = calculateDistance(
  latitude,
  longitude,
  OFFICE_LOCATION.latitude,
  OFFICE_LOCATION.longitude
);

// Reject check-in when the employee is outside the 200-metre boundary.
if (distanceFromOffice > GEOFENCE_RADIUS) {
  return res.status(403).json({
    success: false,
    message: 'You are outside the permitted office location.',
    distanceFromOffice: Math.round(distanceFromOffice),
    allowedRadius: GEOFENCE_RADIUS
  });
}
    if (!attendance) {
      attendance = new Attendance({
        employee: employee._id,
        date: today
      });
    }

    attendance.checkIn = {
      time: new Date(),
      location: {
        latitude,
        longitude,
        accuracy
      }
    };

    attendance.locationConsent = true;
    attendance.isTrackingActive = true;
    // Save the employee's geofence verification result.
attendance.geofence = {
  isWithinOffice: true,
  distanceFromOffice: Number(distanceFromOffice.toFixed(2))
};
   // Mark employees late when they check in after 9:45 AM.
const checkInTime = new Date();
const lateTime = new Date(today);
lateTime.setHours(9, 45, 0, 0);

attendance.status =
  checkInTime > lateTime ? 'late' : 'present';
    await attendance.save();
    // Record the employee check-in in Audit Logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'CHECK_IN',
  module: 'Attendance',
  description: `${req.user.name} checked in`,
  targetId: attendance._id,
  details: {
    employeeId: employee.employeeId,
    status: attendance.status,
    checkInTime: attendance.checkIn.time
  }
});

    return res.status(201).json({
      success: true,
      message: 'Check-in successful. Your work-session GPS tracking is active.',
      attendance
    });

  } catch (error) {
    console.error('Check-in error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to check in.'
    });
  }
};

// Employee checks out and ends GPS tracking.
const checkOut = async (req, res) => {
  try {
    const employee = await getEmployeeProfile(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const { latitude, longitude, accuracy } = req.body;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(accuracy) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      accuracy < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid GPS coordinates and accuracy are required.'
      });
    }

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: getToday()
    });

    if (!attendance || !attendance.checkIn?.time) {
      return res.status(400).json({
        success: false,
        message: 'Please check in before checking out.'
      });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out.'
      });
    }

    const now = new Date();

    attendance.checkOut = {
      time: now,
      location: {
        latitude,
        longitude,
        accuracy
      }
    };

    
    // Calculate actual working time, excluding the lunch break.
const checkInTime = new Date(attendance.checkIn.time);

const totalMinutes = Math.max(
  0,
  (now.getTime() - checkInTime.getTime()) / (1000 * 60)
);

// Lunch break: 1:00 PM to 2:00 PM.
const lunchStart = new Date(checkInTime);
lunchStart.setHours(13, 0, 0, 0);

const lunchEnd = new Date(checkInTime);
lunchEnd.setHours(14, 0, 0, 0);

// Subtract only the lunch minutes that overlap the work session.
const lunchOverlap = Math.max(
  0,
  Math.min(now.getTime(), lunchEnd.getTime()) -
  Math.max(checkInTime.getTime(), lunchStart.getTime())
) / (1000 * 60);

const workingMinutes = Math.max(0, totalMinutes - lunchOverlap);

attendance.workingHours = Number(
  (workingMinutes / 60).toFixed(2)
);

// Less than four working hours is a half-day.
if (workingMinutes < 240) {
  attendance.status = 'half-day';
}

    attendance.isTrackingActive = false;

    await attendance.save();
    // Record the employee check-out in Audit Logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'CHECK_OUT',
  module: 'Attendance',
  description: `${req.user.name} checked out`,
  targetId: attendance._id,
  details: {
    employeeId: employee.employeeId,
    workingHours: attendance.workingHours,
    status: attendance.status,
    checkOutTime: attendance.checkOut.time
  }
});

    return res.status(200).json({
      success: true,
      message: 'Check-out successful. GPS tracking has stopped.',
      attendance
    });

  } catch (error) {
    console.error('Check-out error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to check out.'
    });
  }
};

// Get the logged-in employee's attendance history.
const getMyAttendanceHistory = async (req, res) => {
  try {
    const employee = await getEmployeeProfile(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const filter = {
      employee: employee._id
    };

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};

      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);

        if (Number.isNaN(startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid start date.'
          });
        }

        filter.date.$gte = startDate;
      }

      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);

        if (Number.isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid end date.'
          });
        }

        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    const attendanceRecords = await Attendance.find(filter)
      .sort({ date: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      attendance: attendanceRecords
    });

  } catch (error) {
    console.error('Attendance history error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch attendance history.'
    });
  }
};

// Get the logged-in employee's attendance summary for the current month.
const getMyAttendanceSummary = async (req, res) => {
  try {
    const employee = await getEmployeeProfile(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const now = new Date();

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const nextMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    const records = await Attendance.find({
      employee: employee._id,
      date: {
        $gte: monthStart,
        $lt: nextMonthStart
      }
    });

    const totalDays = records.length;

    const presentDays = records.filter(
      (record) => record.status === 'present'
    ).length;

    const lateDays = records.filter(
      (record) => record.status === 'late'
    ).length;

    const halfDays = records.filter(
      (record) => record.status === 'half-day'
    ).length;

    const totalWorkingHours = Number(
      records.reduce(
        (total, record) => total + (record.workingHours || 0),
        0
      ).toFixed(2)
    );

    const activeSessions = records.filter(
      (record) => record.isTrackingActive
    ).length;

    return res.status(200).json({
      success: true,
      summary: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        totalDays,
        presentDays,
        lateDays,
        halfDays,
        totalWorkingHours,
        activeSessions
      }
    });

  } catch (error) {
    console.error('Attendance summary error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch attendance summary.'
    });
  }
};

// Admin: Get today's attendance records for all employees.
// Admin: Get today's attendance for every active employee.
const getAllAttendanceToday = async (req, res) => {
  try {
    const today = getToday();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all employees and their linked active user accounts.
    const employees = await Employee.find()
      .populate({
        path: 'user',
        select: 'name email isActive'
      });

    // Keep employees whose user accounts are active.
    const activeEmployees = employees.filter(
      (employee) => employee.user && employee.user.isActive !== false
    );

    // Get today's attendance records.
    const attendanceRecords = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Match each employee with their attendance record.
    const attendanceMap = new Map(
      attendanceRecords.map((record) => [
        record.employee.toString(),
        record
      ])
    );

    // Include employees even when they have not checked in.
    const attendance = activeEmployees.map((employee) => {
      const record = attendanceMap.get(employee._id.toString());

      if (record) {
        return {
          ...record.toObject(),
          employee
        };
      }

      return {
        _id: employee._id,
        employee,
        date: today,
        checkIn: null,
        checkOut: null,
        workingHours: 0,
        status: 'not-checked-in',
        isTrackingActive: false,
        locationConsent: false
      };
    });

    // Put employees who checked in first, then sort by name.
    attendance.sort((a, b) => {
      const aCheckedIn = Boolean(a.checkIn?.time);
      const bCheckedIn = Boolean(b.checkIn?.time);

      if (aCheckedIn !== bCheckedIn) {
        return aCheckedIn ? -1 : 1;
      }

      return (a.employee.user?.name || '').localeCompare(
        b.employee.user?.name || ''
      );
    });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance
    });

  } catch (error) {
    console.error('Admin attendance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch all employee attendance.'
    });
  }
};
// Admin: Generate attendance reports for a selected date range.
const getAttendanceReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required.'
      });
    }

    // Validate the selected dates.
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid date range.'
      });
    }

    // Include the complete final day in the report.
    end.setDate(end.getDate() + 1);

    // Get active employees and their user accounts.
    const employees = await Employee.find()
      .populate({
        path: 'user',
        select: 'name email isActive'
      });

    const activeEmployees = employees.filter(
      (employee) =>
        employee.user &&
        employee.user.isActive !== false &&
        employee.joiningDate < end
    );

    const employeeIds = activeEmployees.map(
      (employee) => employee._id
    );

    // Fetch saved attendance records within the selected dates.
    const records = await Attendance.find({
      employee: { $in: employeeIds },
      date: {
        $gte: start,
        $lt: end
      }
    })
      .populate({
        path: 'employee',
        populate: {
          path: 'user',
          select: 'name email isActive'
        }
      })
      .sort({ date: -1 });

    // Calculate summary values from actual saved records.
    const summary = {
      totalEmployees: activeEmployees.length,
      totalRecords: records.length,
      presentDays: records.filter(
        (record) => record.status === 'present'
      ).length,
      lateDays: records.filter(
        (record) => record.status === 'late'
      ).length,
      halfDays: records.filter(
        (record) => record.status === 'half-day'
      ).length,
      absentRecords: records.filter(
        (record) => record.status === 'absent'
      ).length,
      totalWorkingHours: Number(
        records.reduce(
          (total, record) => total + (record.workingHours || 0),
          0
        ).toFixed(2)
      )
    };

    return res.status(200).json({
      success: true,
      startDate,
      endDate: end.toISOString().split('T')[0],
      summary,
      attendance: records
    });

  } catch (error) {
    console.error('Attendance reports error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to generate attendance reports.'
    });
  }
};
// Export all employee and admin attendance functions.
module.exports = {
  checkIn,
  checkOut,
  getMyAttendanceHistory,
  getMyAttendanceSummary,
  getAllAttendanceToday,
  getAttendanceReports
};