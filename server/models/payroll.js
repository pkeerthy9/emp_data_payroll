
const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },

    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: true
    },

    payrollMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    payrollYear: {
      type: Number,
      required: true
    },

    workingDays: {
      type: Number,
      default: 0,
      min: 0
    },

    presentDays: {
      type: Number,
      default: 0,
      min: 0
    },

    absentDays: {
      type: Number,
      default: 0,
      min: 0
    },

    overtimeHours: {
      type: Number,
      default: 0,
      min: 0
    },

    basicEarnings: {
      type: Number,
      required: true,
      min: 0
    },

    totalAllowances: {
      type: Number,
      default: 0,
      min: 0
    },

    incentives: {
      type: Number,
      default: 0,
      min: 0
    },

    overtimePay: {
      type: Number,
      default: 0,
      min: 0
    },

    grossSalary: {
      type: Number,
      required: true,
      min: 0
    },

    totalDeductions: {
      type: Number,
      default: 0,
      min: 0
    },

    netSalary: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'paid', 'rejected'],
      default: 'draft'
    },

    generatedAt: {
      type: Date,
      default: Date.now
    },

    approvedAt: {
      type: Date,
      default: null
    },

    paidAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// One payroll record per employee per month
payrollSchema.index(
  { employee: 1, payrollMonth: 1, payrollYear: 1 },
  { unique: true }
);

module.exports = mongoose.model('Payroll', payrollSchema);
