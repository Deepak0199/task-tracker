import React, { useState, useEffect } from 'react';
import apiService from './services/api';

// Real team members data with provided credentials
const TEAM_MEMBERS = [
  { 
    id: 'deepak_admin', 
    name: 'Deepak Kumar Singh', 
    email: 'deepakcollab1999@gmail.com', 
    avatar: '👨‍💼', 
    password: 'Deep#1998',
    role: 'admin'
  },
  { 
    id: 'yashwant_user', 
    name: 'Yashwant Kumar Singh', 
    email: 'yashwantcollab@gmail.com', 
    avatar: '👨‍💻', 
    password: 'yashwantcollab1997',
    role: 'user'
  },
  { 
    id: 'aditya_user', 
    name: 'Aditya Sharma', 
    email: 'adityacollab1998@gmail.com', 
    avatar: '👨‍🎨', 
    password: '9611686029ab',
    role: 'user'
  },
  { 
    id: 'kaiwalya_admin', 
    name: 'Kaiwalya Kulkarni', 
    email: 'kaiwalyacollab1993@gmail.com', 
    avatar: '👨‍🚀', 
    password: 'Kaiwalyacollab',
    role: 'admin'
  }
];


function App() {
  // Use imported apiService for all API calls
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    'in-progress': 0,
    review: 0,
    done: 0
  });
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assignedTo: null
  });
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    assignedTo: null,
    status: 'todo'
  });
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [showSubtaskForm, setShowSubtaskForm] = useState(null);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    showPassword: false
  });
  const [loginError, setLoginError] = useState('');

  // Load user session and tasks
  useEffect(() => {
    const savedUser = localStorage.getItem('taskTracker_currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        loadUserData(user);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('taskTracker_currentUser');
      }
    }
  }, []);

  // Load user tasks and stats from MongoDB
  const loadUserData = async (user) => {
    setLoading(true);
    try {
      const isAdmin = user.role === 'admin';
      
      // Load tasks and stats in parallel
      const [tasksResponse, statsResponse] = await Promise.all([
  apiService.getTasks(user.id, isAdmin),
  apiService.getStats(user.id, isAdmin)
      ]);

      setTasks(tasksResponse.tasks || []);
      setStats({
        total: statsResponse.totalTasks || 0,
        todo: statsResponse.stats?.todo || 0,
        'in-progress': statsResponse.stats?.['in-progress'] || 0,
        review: statsResponse.stats?.review || 0,
        done: statsResponse.stats?.done || 0,
        byUser: statsResponse.byUser || null
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(true);
      try {
        const isAdmin = user.role === 'admin';
        // Load tasks and stats in parallel
        const [tasksResponse, statsResponse] = await Promise.all([
          apiService.getTasks(user.id, isAdmin),
          apiService.getStats(user.id, isAdmin)
        ]);

        console.log('DEBUG: getTasks response:', tasksResponse);
        console.log('DEBUG: getStats response:', statsResponse);

        setTasks(tasksResponse.tasks || []);
        setStats({
          total: statsResponse.totalTasks || 0,
          todo: statsResponse.stats?.todo || 0,
          'in-progress': statsResponse.stats?.['in-progress'] || 0,
          review: statsResponse.stats?.review || 0,
          done: statsResponse.stats?.done || 0,
          byUser: statsResponse.byUser || null
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        setTasks([]);
        setStats({
          total: 0,
          todo: 0,
          'in-progress': 0,
          review: 0,
          done: 0
        });
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      // Backend expects username, not email
      const response = await apiService.login({ username: loginForm.email, password: loginForm.password });
      if (response.success) {
        const userSession = response.user;
        setCurrentUser(userSession);
        localStorage.setItem('taskTracker_currentUser', JSON.stringify(userSession));
        await loadUserData(userSession);
        setLoginForm({ email: '', password: '', showPassword: false });
      }
    } catch (error) {
      setLoginError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setTasks([]);
    setStats({
      total: 0,
      todo: 0,
      'in-progress': 0,
      review: 0,
      done: 0
    });
    localStorage.removeItem('taskTracker_currentUser');
    setActiveTab('dashboard');
  };

  // Handle task submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setLoading(true);
    try {
      // Removed broken duplicate renderTasks function and all stray code after it.
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  function handleEditSubmit(e) {
    e.preventDefault();
    // TODO: Implement edit logic
  }

  const startEditing = (task) => {
    setEditingTask({ ...task });
  };

  const addSubtask = async (taskId) => {
    if (!newSubtask.title.trim()) return;

    setLoading(true);
    try {
      const subtaskData = {
        title: newSubtask.title.trim(),
        status: newSubtask.status,
        assignedTo: newSubtask.assignedTo,
        createdBy: currentUser.id
      };

  await apiService.addSubtask(taskId, subtaskData);
      await loadUserData(currentUser); // Refresh data
      
      setNewSubtask({ title: '', assignedTo: null, status: 'todo' });
      setShowSubtaskForm(null);
    } catch (error) {
      console.error('Error adding subtask:', error);
      alert('Failed to add subtask: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
  await apiService.updateTask(taskId, { status: newStatus });
      await loadUserData(currentUser); // Refresh data
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status: ' + error.message);
    }
  };

  const updateSubtaskStatus = async (taskId, subtaskId, newStatus) => {
    try {
  await apiService.updateSubtask(taskId, subtaskId, { status: newStatus });
      await loadUserData(currentUser); // Refresh data
    } catch (error) {
      console.error('Error updating subtask status:', error);
      alert('Failed to update subtask status: ' + error.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    setLoading(true);
    try {
  await apiService.deleteTask(taskId);
      await loadUserData(currentUser); // Refresh data
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubtask = async (taskId, subtaskId) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) return;
    
    try {
  await apiService.deleteSubtask(taskId, subtaskId);
      await loadUserData(currentUser); // Refresh data
    } catch (error) {
      console.error('Error deleting subtask:', error);
      alert('Failed to delete subtask: ' + error.message);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'medium': return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
      case 'high': return { bg: '#fef3c7', text: '#d97706', border: '#fed7aa' };
      case 'critical': return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
      case 'in-progress': return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };
      case 'review': return { bg: '#f3e8ff', text: '#7c3aed', border: '#e9d5ff' };
      case 'done': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  // Login form component
  const renderLogin = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎯</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            Kollab Task Tracker
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>
            Now with MongoDB Database! 🚀
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={loginForm.showPassword ? 'text' : 'password'}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 40px 10px 12px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setLoginForm({ ...loginForm, showPassword: !loginForm.showPassword })}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
                disabled={loading}
              >
                {loginForm.showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {loginError && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
              border: '1px solid #fecaca'
            }}>
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Demo Credentials:
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            <div>Admin: deepakcollab1999@gmail.com / Deep#1998</div>
            <div>User: yashwantcollab@gmail.com / yashwantcollab1997</div>
          </div>
        </div>
      </div>
    </div>
  );

  // If not logged in, show login page
  if (!currentUser) {
    return renderLogin();
  }

  const isAdmin = currentUser.role === 'admin';

  const StatCard = ({ title, count, icon, color }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: color || '#1f2937', marginBottom: '4px' }}>
        {count}
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>{title}</div>
    </div>
  );

  const renderDashboard = () => (
    <div>
      {/* Connection Status */}
      <div style={{
        background: '#dcfce7',
        color: '#166534',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #bbf7d0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '1.2rem' }}>🗄️</span>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>
          Connected to MongoDB Database
        </span>
      </div>

      {/* Task Statistics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
          📊 {isAdmin ? 'All Tasks Overview' : 'My Tasks Overview'}
        </h2>
        {isAdmin && (
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            👑 Admin View - You can see and manage all tasks across the organization
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <StatCard title="Total Tasks" count={stats.total} icon="📋" color="#1f2937" />
          <StatCard title="To Do" count={stats.todo} icon="📝" color="#475569" />
          <StatCard title="In Progress" count={stats['in-progress']} icon="⚡" color="#3730a3" />
          <StatCard title="In Review" count={stats.review} icon="👀" color="#7c3aed" />
          <StatCard title="Completed" count={stats.done} icon="✅" color="#166534" />
        </div>
      </div>

      {/* Recent Tasks */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          📝 Recent Tasks
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            Loading tasks from MongoDB...
          </div>
        ) : tasks.slice(0, 5).map(task => {
          const statusColors = getStatusColor(task.status);
          const creator = TEAM_MEMBERS.find(m => m.id === task.createdBy);
          return (
            <div key={task._id || task.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>{task.title}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Created by {creator?.name} • {new Date(task.createdAt).toLocaleDateString()}
                  {task.assignedTo && ` • Assigned to ${task.assignedTo.name}`}
                </div>
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                border: `1px solid ${statusColors.border}`,
                background: statusColors.bg,
                color: statusColors.text
              }}>
                {task.status.replace('-', ' ')}
              </span>
            </div>
          );
        })}
        {!loading && tasks.length === 0 && (
          <p style={{ color: '#6b7280', textAlign: 'center', margin: 0 }}>
            No tasks yet. Create your first task!
          </p>
        )}
      </div>
    </div>
  );

  const renderTaskForm = (isEdit = false, task = null) => {
    const formData = isEdit ? editingTask : newTask;
    const setFormData = isEdit ? setEditingTask : setNewTask;
    const handleFormSubmit = isEdit ? handleEditSubmit : handleSubmit;

    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '1.5rem' }}>{isEdit ? '✏️' : '✨'}</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            {isEdit ? 'Edit Task' : 'Create New Task'}
          </h2>
          {isEdit && (
            <button
              onClick={() => setEditingTask(null)}
              style={{
                marginLeft: 'auto',
                background: '#f3f4f6',
                color: '#6b7280',
              }}
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleFormSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Enter task title"
              required
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                minHeight: '80px',
                background: 'white',
                boxSizing: 'border-box'
              }}
              placeholder="Enter task description (optional)"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Assign To
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            >
              <option value="">Unassigned</option>
              {TEAM_MEMBERS.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : (isEdit ? '💾 Save Changes' : '✨ Create Task')}
          </button>
        </form>
      </div>
    );
  };

  const renderCreateTask = () => renderTaskForm(false);

  const renderTasks = () => {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            {isAdmin ? `All Tasks (${tasks.length})` : `My Tasks (${tasks.length})`}
          </h2>
        </div>
        <div>
          {tasks.map((task, index) => (
            <div key={task._id || task.id} style={{ padding: '20px 24px', borderBottom: index < tasks.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              {/* Task Title and Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{task.title}</h3>
                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', border: `1px solid ${getPriorityColor(task.priority).border}`, background: getPriorityColor(task.priority).bg, color: getPriorityColor(task.priority).text }}>{task.priority}</span>
                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', border: `1px solid ${getStatusColor(task.status).border}`, background: getStatusColor(task.status).bg, color: getStatusColor(task.status).text }}>{task.status.replace('-', ' ')}</span>
                <span style={{ fontSize: '12px', padding: '2px 8px', background: '#f3f4f6', color: '#374151', borderRadius: '8px' }}>{TEAM_MEMBERS.find(m => m.id === task.createdBy)?.name}</span>
              </div>
              {/* Subtask Form */}
              {showSubtaskForm === (task._id || task.id) && (
                <div style={{ margin: '12px 0' }}>
                  <input type="text" value={newSubtask.title} onChange={e => setNewSubtask({ ...newSubtask, title: e.target.value })} placeholder="Subtask title" style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 10px', fontSize: '14px', outline: 'none', minWidth: '130px', marginRight: '8px' }} />
                  <select value={newSubtask.assignedTo} onChange={e => setNewSubtask({ ...newSubtask, assignedTo: e.target.value })} style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 10px', fontSize: '14px', outline: 'none', minWidth: '130px', marginRight: '8px' }}>
                    <option value="">Unassigned</option>
                    {TEAM_MEMBERS.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                  <button onClick={() => addSubtask(task._id || task.id)} disabled={!newSubtask.title.trim() || loading} style={{ background: (!newSubtask.title.trim() || loading) ? '#9ca3af' : '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', cursor: (!newSubtask.title.trim() || loading) ? 'not-allowed' : 'pointer', marginRight: '8px' }}>Add</button>
                  <button onClick={() => setShowSubtaskForm(null)} disabled={loading} style={{ background: loading ? '#9ca3af' : '#6b7280', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>Cancel</button>
                </div>
              )}
              {/* Subtasks List */}
              {expandedTasks.has(task._id || task.id) && task.subtasks && task.subtasks.length > 0 && (
                <div style={{ marginTop: '12px', paddingLeft: '16px', borderLeft: '2px solid #e5e7eb' }}>
                  {task.subtasks.map(subtask => (
                    <div key={subtask._id || subtask.id} style={{ padding: '8px 12px', margin: '6px 0', background: 'white', borderRadius: '6px', border: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>{subtask.title}</span>
                          <span style={{ padding: '1px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: '600', border: `1px solid ${getStatusColor(subtask.status).border}`, background: getStatusColor(subtask.status).bg, color: getStatusColor(subtask.status).text }}>{subtask.status.replace('-', ' ')}</span>
                          {subtask.assignedTo && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', background: '#f3f4f6', color: '#374151', borderRadius: '8px' }}>{subtask.assignedTo.name}</span>
                          )}
                          <span style={{ fontSize: '9px', padding: '1px 4px', background: '#e5e7eb', color: '#6b7280', borderRadius: '6px' }}>by {TEAM_MEMBERS.find(m => m.id === subtask.createdBy)?.name}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select value={subtask.status} onChange={e => updateSubtaskStatus(task._id || task.id, subtask._id || subtask.id, e.target.value)} disabled={loading} style={{ fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', outline: 'none', background: 'white', cursor: 'pointer', opacity: 1 }}>
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                        <button onClick={() => deleteSubtask(task._id || task.id, subtask._id || subtask.id)} disabled={loading} style={{ background: loading ? '#9ca3af' : '#ef4444', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', cursor: loading ? 'not-allowed' : 'pointer' }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Task Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <select value={task.status} onChange={e => updateTaskStatus(task._id || task.id, e.target.value)} disabled={loading} style={{ fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 8px', outline: 'none', background: 'white', cursor: 'pointer', minWidth: '100px', opacity: 1 }}>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
                <button onClick={() => startEditing(task)} disabled={loading} style={{ background: loading ? '#9ca3af' : '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer' }}>✏️ Edit</button>
                <button onClick={() => setShowSubtaskForm(showSubtaskForm === (task._id || task.id) ? null : (task._id || task.id))} disabled={loading} style={{ background: loading ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer' }}>+ Sub</button>
                <button onClick={() => deleteTask(task._id || task.id)} disabled={loading} style={{ background: loading ? '#9ca3af' : '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '1.8rem' }}>🎯</div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Kollab Task Tracker
              </h1>
              <span style={{
                background: '#10b981',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                MongoDB
              </span>
            </div>
            
            {/* Navigation Tabs */}
            <nav style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'dashboard', label: '📊 Dashboard' },
                { id: 'create', label: '✨ Create' },
                { id: 'tasks', label: '📋 Tasks' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#374151',
                    border: activeTab === tab.id ? 'none' : '1px solid #d1d5db',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* User Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>{currentUser.avatar}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {currentUser.name}
                    {isAdmin && <span style={{ fontSize: '12px' }}>👑</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} • {isAdmin ? 'Admin' : 'User'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'create' && renderCreateTask()}
        {activeTab === 'tasks' && renderTasks()}
      </div>
    </div>
  );
}

export default App;
