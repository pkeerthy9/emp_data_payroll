
const Task = require('../models/task');
const Employee = require('../models/employee');
// Imports the helper used to record task activities in Audit Logs.
const { createAuditLog } = require('./auditLogController');
const { createNotification } = require('./notificationController');
// Create and assign a task to an employee.
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;

    if (!title || !description || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required task details.'
      });
    }

    const employee = await Employee.findById(assignedTo)
      .populate('user', 'name isActive');

    if (!employee || !employee.user || !employee.user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Active employee not found.'
      });
    }

    // Managers can assign tasks only to their own team.
    if (
      req.user.role === 'manager' &&
      String(employee.manager) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can assign tasks only to your team.'
      });
    }

    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid due date.'
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      assignedTo: employee._id,
      assignedBy: req.user._id,
      priority: priority || 'medium',
      dueDate: parsedDueDate
    });
    // Record task creation in Audit Logs.
await createAuditLog({
  performedBy: req.user._id,
  role: req.user.role,
  action: 'CREATE',
  module: 'Task',
  description: `${req.user.name} assigned a task: ${task.title}`,
  targetId: task._id,
  details: {
    employeeId: employee.employeeId,
    priority: task.priority,
    dueDate: task.dueDate
  }
});
    // Notify the employee about the new task.
await createNotification({
  recipient: employee.user._id,
  title: 'New Task Assigned',
  message: `You have been assigned a new task: ${task.title}`,
  type: 'task',
  relatedId: task._id
});
    return res.status(201).json({
      success: true,
      message: 'Task assigned successfully.',
      task
    });

  } catch (error) {
    console.error('Create task error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to create task.'
    });
  }
};

// Get tasks assigned to the logged-in employee.
const getMyTasks = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      user: req.user._id
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const tasks = await Task.find({
      assignedTo: employee._id
    })
      .populate('assignedBy', 'name email role')
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    console.error('Get employee tasks error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch your tasks.'
    });
  }
};

// Get tasks assigned by the logged-in admin or manager.
const getAssignedTasks = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'manager') {
      filter.assignedBy = req.user._id;
    }

    const tasks = await Task.find(filter)
      .populate({
        path: 'assignedTo',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    console.error('Get assigned tasks error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch assigned tasks.'
    });
  }
};

// Allow an employee to update the status of their own task.
const updateTaskStatus = async (req, res) => {
  try {
    const { status, completionNote } = req.body;

    const allowedStatuses = ['todo', 'in-progress', 'completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status.'
      });
    }

    const employee = await Employee.findOne({
      user: req.user._id
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: employee._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to you.'
      });
    }

    task.status = status;

    if (completionNote !== undefined) {
      task.completionNote = completionNote;
    }

    task.completedAt = status === 'completed' ? new Date() : null;

    await task.save();
    // Record task completion in Audit Logs.
if (status === 'completed') {
  await createAuditLog({
    performedBy: req.user._id,
    role: req.user.role,
    action: 'COMPLETE',
    module: 'Task',
    description: `${req.user.name} completed the task: ${task.title}`,
    targetId: task._id,
    details: {
      employeeId: employee.employeeId,
      completionNote: task.completionNote,
      completedAt: task.completedAt
    }
  });
}
    // Notify the assigned manager when an employee completes a task.
if (status === 'completed') {
  const employeeWithManager = await Employee.findById(employee._id)
    .select('manager');

  if (employeeWithManager?.manager) {
    await createNotification({
      recipient: employeeWithManager.manager,
      title: 'Task Completed',
      message: `${req.user.name} has completed the task: ${task.title}`,
      type: 'task',
      relatedId: task._id
    });
  }
}

    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully.',
      task
    });

  } catch (error) {
    console.error('Update task error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to update task status.'
    });
  }
};

module.exports = {
  createTask,
  getMyTasks,
  getAssignedTasks,
  updateTaskStatus
};
