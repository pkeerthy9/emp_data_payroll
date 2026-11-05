
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    department: {
      type: String,
      required: true,
      trim: true
    },

    designation: {
      type: String,
      required: true,
      trim: true
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    joiningDate: {
      type: Date,
      required: true
    },

    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      default: 'full-time'
    },

    address: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
