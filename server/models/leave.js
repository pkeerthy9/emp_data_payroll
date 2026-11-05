
const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },

    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'earned', 'unpaid'],
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    totalDays: {
      type: Number,
      required: true,
      min: 1
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    reviewedAt: {
      type: Date,
      default: null
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
