
const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true
    },

    salaryType: {
      type: String,
      enum: ['monthly', 'daily'],
      default: 'monthly',
      required: true
    },

    basicSalary: {
      type: Number,
      required: true,
      min: 0
    },

    hra: {
      type: Number,
      default: 0,
      min: 0
    },

    travelAllowance: {
      type: Number,
      default: 0,
      min: 0
    },

    otherAllowances: {
      type: Number,
      default: 0,
      min: 0
    },

    incentive: {
      type: Number,
      default: 0,
      min: 0
    },

    pfDeduction: {
      type: Number,
      default: 0,
      min: 0
    },

    taxDeduction: {
      type: Number,
      default: 0,
      min: 0
    },

    otherDeductions: {
      type: Number,
      default: 0,
      min: 0
    },

    effectiveFrom: {
      type: Date,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'SalaryStructure',
  salaryStructureSchema
);
