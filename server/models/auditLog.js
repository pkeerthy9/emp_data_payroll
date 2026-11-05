const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    // User who performed the action.
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Role of the user at the time of the action.
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      required: true
    },

    // Type of action performed.
    action: {
      type: String,
      required: true,
      trim: true
    },

    // Module where the action happened.
    module: {
      type: String,
      required: true,
      trim: true
    },

    // Human-readable explanation of the action.
    description: {
      type: String,
      required: true,
      trim: true
    },

    // ID of the affected record, if applicable.
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    // Additional information about the action.
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Index logs by date and user for faster searches.
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);