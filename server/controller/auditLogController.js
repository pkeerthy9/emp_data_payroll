const AuditLog = require('../models/auditLog');

// Save a new audit log entry.
const createAuditLog = async ({
  performedBy,
  role,
  action,
  module,
  description,
  targetId = null,
  details = {}
}) => {
  try {
    return await AuditLog.create({
      performedBy,
      role,
      action,
      module,
      description,
      targetId,
      details
    });
  } catch (error) {
    console.error('Audit log creation failed:', error.message);
    return null;
  }
};

// Get audit logs with optional filters.
const getAuditLogs = async (req, res) => {
  try {
    const { module, action, startDate, endDate } = req.query;

    const filter = {};

    if (module) filter.module = module;
    if (action) filter.action = action;

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs',
      error: error.message
    });
  }
};

module.exports = {
  createAuditLog,
  getAuditLogs
};