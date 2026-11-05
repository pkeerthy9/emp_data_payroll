import { useEffect, useState } from 'react';
import api from '../services/api';
import './TaskManagement.css';

function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = JSON.parse(localStorage.getItem('trackpay_user') || '{}');
  const role = user.role;

  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: ''
  });

  const [completionNotes, setCompletionNotes] = useState({});

  const loadTasks = async () => {
  try {
    setLoading(true);
    setError('');

    // Load tasks according to the logged-in user's role.
    const taskEndpoint =
      role === 'employee' ? '/tasks/my' : '/tasks/assigned';

    const taskResponse = await api.get(taskEndpoint);
    setTasks(taskResponse.data.tasks || []);

    // Admins load all employees; managers load only their assigned team.
    if (role !== 'employee') {
      const employeeEndpoint =
        role === 'manager' ? '/manager/team' : '/employees';

      const employeeResponse = await api.get(employeeEndpoint);
      setEmployees(employeeResponse.data.employees || []);
    }
  } catch (err) {
    setError(
      err.response?.data?.message || 'Unable to load tasks.'
    );
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    loadTasks();
  }, []);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createTask = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccess('');

      await api.post('/tasks', form);

      setSuccess('Task assigned successfully!');
      setForm({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: ''
      });

      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create task.');
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      setError('');
      setSuccess('');

      await api.patch(`/tasks/${taskId}/status`, {
        status,
        completionNote: completionNotes[taskId] || ''
      });

      setSuccess('Task status updated successfully!');
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update task.');
    }
  };

  const getEmployeeName = (task) => {
    return (
      task.assignedTo?.user?.name ||
      task.assignedTo?.employeeId ||
      'Employee'
    );
  };

  const getPriorityClass = (priority) => {
    return `task-priority ${priority}`;
  };

  const getStatusClass = (status) => {
    return `task-status ${status}`;
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === 'completed'
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === 'in-progress'
  ).length;
  const pendingTasks = tasks.filter(
    (task) => task.status === 'todo'
  ).length;

  return (
    <div className="task-page">
      <div className="task-header">
        <div>
          <span className="task-eyebrow">WORKFORCE MANAGEMENT</span>
          <h1>Task Management</h1>
          <p>Assign work, track progress and manage team productivity.</p>
        </div>

        <button className="task-refresh" onClick={loadTasks}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="task-alert error">{error}</div>}
      {success && <div className="task-alert success">{success}</div>}

      <div className="task-stats">
        <div className="task-stat-card">
          <span>Total Tasks</span>
          <strong>{totalTasks}</strong>
        </div>

        <div className="task-stat-card">
          <span>To Do</span>
          <strong>{pendingTasks}</strong>
        </div>

        <div className="task-stat-card">
          <span>In Progress</span>
          <strong>{inProgressTasks}</strong>
        </div>

        <div className="task-stat-card">
          <span>Completed</span>
          <strong>{completedTasks}</strong>
        </div>
      </div>

      {(role === 'admin' || role === 'manager') && (
        <section className="task-panel">
          <div className="task-panel-heading">
            <h2>Assign New Task</h2>
            <p>Create and assign work to your employees.</p>
          </div>

          <form className="task-form" onSubmit={createTask}>
            <div className="task-form-grid">
              <div className="task-field">
                <label>Task Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="task-field">
                <label>Assign Employee</label>
                <select
                  name="assignedTo"
                  value={form.assignedTo}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.user?.name || employee.employeeId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="task-field">
                <label>Priority</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleFormChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="task-field">
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleFormChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="task-field full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Describe the task..."
                  rows="3"
                  required
                />
              </div>
            </div>

            <button className="task-submit" type="submit">
              + Assign Task
            </button>
          </form>
        </section>
      )}

      <section className="task-panel">
        <div className="task-panel-heading">
          <h2>{role === 'employee' ? 'My Tasks' : 'Assigned Tasks'}</h2>
          <p>
            {role === 'employee'
              ? 'View your work and update task progress.'
              : 'Monitor tasks assigned to employees.'}
          </p>
        </div>

        {loading ? (
          <div className="task-empty">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="task-empty">No tasks found.</div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <article className="task-card" key={task._id}>
                <div className="task-card-top">
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                  </div>

                  <span className={getPriorityClass(task.priority)}>
                    {task.priority}
                  </span>
                </div>

                <div className="task-meta">
                  {role !== 'employee' && (
                    <span>
                      Employee: <strong>{getEmployeeName(task)}</strong>
                    </span>
                  )}

                  <span>
                    Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong>
                  </span>

                  <span>
                    Assigned by: <strong>{task.assignedBy?.name || 'Manager'}</strong>
                  </span>
                </div>

                <div className="task-card-bottom">
                  <span className={getStatusClass(task.status)}>
                    {task.status.replace('-', ' ')}
                  </span>

                  {role === 'employee' && task.status !== 'completed' && (
                    <div className="task-update">
                      {task.status !== 'completed' && (
                        <input
                          value={completionNotes[task._id] || ''}
                          onChange={(e) =>
                            setCompletionNotes({
                              ...completionNotes,
                              [task._id]: e.target.value
                            })
                          }
                          placeholder="Completion note (optional)"
                        />
                      )}

                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateStatus(task._id, e.target.value)
                        }
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  )}
                </div>

                {task.completionNote && (
                  <div className="task-completion-note">
                    <strong>Completion note:</strong> {task.completionNote}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default TaskManagement;