
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },

    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed'],
      default: 'todo'
    },

    dueDate: {
      type: Date,
      required: true
    },

    completionNote: {
      type: String,
      trim: true,
      default: ''
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
