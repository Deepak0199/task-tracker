import React, { useState, useEffect } from 'react';

// Real team members data with provided credentials
const TEAM_MEMBERS = [
  { 
    id: 1, 
    name: 'Deepak Kumar Singh', 
    email: 'deepakcollab1999@gmail.com', 
    avatar: '👨‍💼', 
    password: 'Deep#1998',
    role: 'admin'
  },
  { 
    id: 2, 
    name: 'Yashwant Kumar Singh', 
    email: 'yashwantcollab@gmail.com', 
    avatar: '👨‍💻', 
    password: 'yashwantcollab1997',
    role: 'user'
  },
  { 
    id: 3, 
    name: 'Aditya Sharma', 
    email: 'adityacollab1998@gmail.com', 
    avatar: '👨‍🎨', 
    password: '9611686029ab',
    role: 'user'
  },
  { 
    id: 4, 
    name: 'Kaiwalya Kulkarni', 
    email: 'kaiwalyacollab1993@gmail.com', 
    avatar: '👨‍🚀', 
    password: 'Kaiwalyacollab',
    role: 'admin'
  }
];

// Database simulation class
class TaskDatabase {
  constructor() {
    this.initializeDB();
  }

  initializeDB() {
    // Initialize empty database if not exists
    if (!localStorage.getItem('taskTracker_database')) {
      const initialDB = {
        users: TEAM_MEMBERS.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: new Date().toISOString()
        })),
        tasks: [],
        nextTaskId: 1,
        nextSubtaskId: 1
      };
      localStorage.setItem('taskTracker_database', JSON.stringify(initialDB));
    }
  }

  getDB() {
    return JSON.parse(localStorage.getItem('taskTracker_database'));
  }

  saveDB(db) {
    localStorage.setItem('taskTracker_database', JSON.stringify(db));
  }

  // Task CRUD operations
  createTask(taskData) {
    const db = this.getDB();
    const task = {
      ...taskData,
      id: db.nextTaskId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: []
    };
    db.tasks.push(task);
    db.nextTaskId += 1;
    this.saveDB(db);
    return task;
  }

  getUserTasks(userId, isAdmin = false) {
    const db = this.getDB();
    if (isAdmin) {
      return db.tasks; // Admins can see all tasks
    }
    return db.tasks.filter(task => 
      task.createdBy === userId || task.assignedTo?.id === userId
    );
  }

  getAllTasks() {
    const db = this.getDB();
    return db.tasks;
  }

  updateTask(taskId, updates) {
    const db = this.getDB();
    const taskIndex = db.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      db.tasks[taskIndex] = {
        ...db.tasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveDB(db);
      return db.tasks[taskIndex];
    }
    return null;
  }

  deleteTask(taskId) {
    const db = this.getDB();
    db.tasks = db.tasks.filter(task => task.id !== taskId);
    this.saveDB(db);
  }

  addSubtask(taskId, subtaskData) {
    const db = this.getDB();
    const taskIndex = db.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const subtask = {
        ...subtaskData,
        id: db.nextSubtaskId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.tasks[taskIndex].subtasks.push(subtask);
      db.tasks[taskIndex].updatedAt = new Date().toISOString();
      db.nextSubtaskId += 1;
      this.saveDB(db);
      return subtask;
    }
    return null;
  }

  updateSubtask(taskId, subtaskId, updates) {
    const db = this.getDB();
    const taskIndex = db.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const subtaskIndex = db.tasks[taskIndex].subtasks.findIndex(s => s.id === subtaskId);
      if (subtaskIndex !== -1) {
        db.tasks[taskIndex].subtasks[subtaskIndex] = {
          ...db.tasks[taskIndex].subtasks[subtaskIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        db.tasks[taskIndex].updatedAt = new Date().toISOString();
        this.saveDB(db);
        return db.tasks[taskIndex].subtasks[subtaskIndex];
      }
    }
    return null;
  }

  deleteSubtask(taskId, subtaskId) {
    const db = this.getDB();
    const taskIndex = db.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      db.tasks[taskIndex].subtasks = db.tasks[taskIndex].subtasks.filter(s => s.id !== subtaskId);
      db.tasks[taskIndex].updatedAt = new Date().toISOString();
      this.saveDB(db);
    }
  }

  getTaskStats(userId = null, isAdmin = false) {
    const tasks = userId && !isAdmin ? this.getUserTasks(userId) : this.getAllTasks();
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      byUser: isAdmin ? this.getTasksByUser() : null
    };
  }

  getTasksByUser() {
    const db = this.getDB();
    const userStats = {};
    
    db.users.forEach(user => {
      const userTasks = db.tasks.filter(task => task.createdBy === user.id);
      const assignedTasks = db.tasks.filter(task => task.assignedTo?.id === user.id);
      const userSubtasks = db.tasks.flatMap(t => t.subtasks || []).filter(s => s.assignedTo?.id === user.id);
      
      userStats[user.id] = {
        ...user,
        createdTasks: userTasks.length,
        assignedTasks: assignedTasks.length,
        subtasks: userSubtasks.length,
        totalTasks: userTasks.length + assignedTasks.length
      };
    });
    
    return userStats;
  }
}

function App() {
  const [db] = useState(new TaskDatabase());
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
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
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      loadUserTasks(user);
    }
  }, [db]); // Added db as dependency

  // Load user tasks from database
  const loadUserTasks = (user) => {
    setLoading(true);
    try {
      const isAdmin = user.role === 'admin';
      const userTasks = db.getUserTasks(user.id, isAdmin);
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
    setLoading(false);
  };

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    const user = TEAM_MEMBERS.find(member => 
      member.email === loginForm.email && member.password === loginForm.password
    );
    
    if (user) {
      const userSession = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      };
      
      setCurrentUser(userSession);
      localStorage.setItem('taskTracker_currentUser', JSON.stringify(userSession));
      loadUserTasks(userSession);
      setLoginForm({ email: '', password: '', showPassword: false });
    } else {
      setLoginError('Invalid email or password');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setTasks([]);
    localStorage.removeItem('taskTracker_currentUser');
    setActiveTab('dashboard');
  };

  // Handle task submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        status: newTask.status,
        assignedTo: newTask.assignedTo,
        createdBy: currentUser.id
      };
      
      const createdTask = db.createTask(taskData);
      console.log('Task created:', createdTask); // Use the variable
      loadUserTasks(currentUser); // Refresh tasks
      
      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'medium', 
        status: 'todo', 
        assignedTo: null
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Handle edit task
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingTask.title.trim()) return;

    try {
      db.updateTask(editingTask.id, {
        title: editingTask.title.trim(),
        description: editingTask.description.trim(),
        priority: editingTask.priority,
        status: editingTask.status,
        assignedTo: editingTask.assignedTo
      });
      
      loadUserTasks(currentUser); // Refresh tasks
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const startEditing = (task) => {
    setEditingTask({ ...task });
  };

  const addSubtask = (taskId) => {
    if (!newSubtask.title.trim()) return;

    try {
      const subtaskData = {
        title: newSubtask.title.trim(),
        status: newSubtask.status,
        assignedTo: newSubtask.assignedTo,
        createdBy: currentUser.id
      };

      db.addSubtask(taskId, subtaskData);
      loadUserTasks(currentUser); // Refresh tasks
      
      setNewSubtask({ title: '', assignedTo: null, status: 'todo' });
      setShowSubtaskForm(null);
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const updateTaskStatus = (taskId, newStatus) => {
    try {
      db.updateTask(taskId, { status: newStatus });
      loadUserTasks(currentUser); // Refresh tasks
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const updateSubtaskStatus = (taskId, subtaskId, newStatus) => {
    try {
      db.updateSubtask(taskId, subtaskId, { status: newStatus });
      loadUserTasks(currentUser); // Refresh tasks
    } catch (error) {
      console.error('Error updating subtask status:', error);
    }
  };

  const deleteTask = (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      db.deleteTask(taskId);
      loadUserTasks(currentUser); // Refresh tasks
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const deleteSubtask = (taskId, subtaskId) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) return;
    
    try {
      db.deleteSubtask(taskId, subtaskId);
      loadUserTasks(currentUser); // Refresh tasks
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const toggleTaskExpansion = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
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
            Sign in with your team credentials
          </p>
        </div>

        <div onSubmit={handleLogin}>
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
            onClick={handleLogin}
            style={{
              width: '100%',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );

  // If not logged in, show login page
  if (!currentUser) {
    return renderLogin();
  }

  const isAdmin = currentUser.role === 'admin';
  const stats = db.getTaskStats(currentUser.id, isAdmin);

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
          <StatCard title="In Progress" count={stats.inProgress} icon="⚡" color="#3730a3" />
          <StatCard title="In Review" count={stats.review} icon="👀" color="#7c3aed" />
          <StatCard title="Completed" count={stats.done} icon="✅" color="#166534" />
        </div>
      </div>

      {/* Team Overview for Admins */}
      {isAdmin && stats.byUser && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            👥 Team Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {Object.values(stats.byUser).map(user => (
              <div key={user.id} style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: user.role === 'admin' ? '#fef3c7' : '#f9fafb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{user.avatar}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {user.name}
                      {user.role === 'admin' && <span style={{ fontSize: '12px' }}>👑</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  Created: {user.createdTasks} • Assigned: {user.assignedTasks} • Subtasks: {user.subtasks}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        {tasks.slice(0, 5).map(task => {
          const statusColors = getStatusColor(task.status);
          const creator = TEAM_MEMBERS.find(m => m.id === task.createdBy);
          return (
            <div key={task.id} style={{
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
        {tasks.length === 0 && (
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
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Task Title *
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
                  background: 'white',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter task title"
              />
            </div>

            <div>
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
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Assign To
              </label>
              <select
                value={formData.assignedTo?.id || ''}
                onChange={(e) => {
                  const member = TEAM_MEMBERS.find(m => m.id === parseInt(e.target.value));
                  setFormData({ ...formData, assignedTo: member || null });
                }}
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
              >
                <option value="">Select team member</option>
                {TEAM_MEMBERS.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.avatar} {member.name} {member.role === 'admin' ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              >
                <option value="todo">📋 To Do</option>
                <option value="in-progress">⚡ In Progress</option>
                <option value="review">👀 Review</option>
                <option value="done">✅ Done</option>
              </select>
            </div>
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
            />
          </div>

          <button
            onClick={handleFormSubmit}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isEdit ? '💾 Save Changes' : '✨ Create Task'}
          </button>
        </div>
      </div>
    );
  };

  const renderCreateTask = () => renderTaskForm(false);

  const renderTasks = () => (
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
        {isAdmin && (
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Admin view: Tasks from all team members
          </p>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', margin: 0, color: '#6b7280' }}>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
            No tasks yet
          </h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {isAdmin ? 'No tasks have been created by the team yet.' : 'Create your first task to get started!'}
          </p>
        </div>
      ) : (
        <div>
          {editingTask && renderTaskForm(true, editingTask)}
          
          {tasks.map((task, index) => {
            if (editingTask && task.id === editingTask.id) return null;
            
            const priorityColors = getPriorityColor(task.priority);
            const statusColors = getStatusColor(task.status);
            const isExpanded = expandedTasks.has(task.id);
            const creator = TEAM_MEMBERS.find(m => m.id === task.createdBy);
            const canEdit = isAdmin || task.createdBy === currentUser.id;

            return (
              <div
                key={task.id}
                style={{
                  padding: '20px 24px',
                  borderBottom: index < tasks.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {task.title}
                      </h3>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${priorityColors.border}`,
                        background: priorityColors.bg,
                        color: priorityColors.text
                      }}>
                        {task.priority}
                      </span>
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
                      {task.assignedTo && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: '#f3f4f6',
                          color: '#374151'
                        }}>
                          {task.assignedTo.avatar} {task.assignedTo.name}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p style={{
                        color: '#6b7280',
                        marginBottom: '12px',
                        fontSize: '14px',
                        margin: '0 0 12px 0'
                      }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <span>👤 {creator?.name}</span>
                      <span>📅 {new Date(task.createdAt).toLocaleDateString()}</span>
                      {task.subtasks && task.subtasks.length > 0 && (
                        <span>📚 {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>

                    {task.subtasks && task.subtasks.length > 0 && (
                      <button
                        onClick={() => toggleTaskExpansion(task.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '2px 0'
                        }}
                      >
                        {isExpanded ? '▼ Hide Subtasks' : '▶ Show Subtasks'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      disabled={!canEdit}
                      style={{
                        fontSize: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        outline: 'none',
                        background: canEdit ? 'white' : '#f9fafb',
                        cursor: canEdit ? 'pointer' : 'not-allowed',
                        minWidth: '100px',
                        opacity: canEdit ? 1 : 0.6
                      }}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>

                    {canEdit && (
                      <>
                        <button
                          onClick={() => startEditing(task)}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          onClick={() => setShowSubtaskForm(showSubtaskForm === task.id ? null : task.id)}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          + Sub
                        </button>

                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Add Subtask Form */}
                {showSubtaskForm === task.id && canEdit && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px' }}>Add Subtask</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newSubtask.title}
                        onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                        placeholder="Subtask title"
                        style={{
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <select
                        value={newSubtask.assignedTo?.id || ''}
                        onChange={(e) => {
                          const member = TEAM_MEMBERS.find(m => m.id === parseInt(e.target.value));
                          setNewSubtask({ ...newSubtask, assignedTo: member || null });
                        }}
                        style={{
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '14px',
                          outline: 'none',
                          minWidth: '130px'
                        }}
                      >
                        <option value="">Unassigned</option>
                        {TEAM_MEMBERS.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => addSubtask(task.id)}
                        disabled={!newSubtask.title.trim()}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          opacity: !newSubtask.title.trim() ? 0.5 : 1
                        }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowSubtaskForm(null)}
                        style={{
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Subtasks List */}
                {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    paddingLeft: '16px',
                    borderLeft: '2px solid #e5e7eb'
                  }}>
                    {task.subtasks.map(subtask => {
                      const subtaskStatusColors = getStatusColor(subtask.status);
                      const subtaskCreator = TEAM_MEMBERS.find(m => m.id === subtask.createdBy);
                      const canEditSubtask = isAdmin || subtask.createdBy === currentUser.id || task.createdBy === currentUser.id;
                      
                      return (
                        <div
                          key={subtask.id}
                          style={{
                            padding: '8px 12px',
                            margin: '6px 0',
                            background: 'white',
                            borderRadius: '6px',
                            border: '1px solid #f3f4f6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '500' }}>{subtask.title}</span>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: '600',
                                border: `1px solid ${subtaskStatusColors.border}`,
                                background: subtaskStatusColors.bg,
                                color: subtaskStatusColors.text
                              }}>
                                {subtask.status.replace('-', ' ')}
                              </span>
                              {subtask.assignedTo && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  background: '#f3f4f6',
                                  color: '#374151',
                                  borderRadius: '8px'
                                }}>
                                  {subtask.assignedTo.name}
                                </span>
                              )}
                              <span style={{
                                fontSize: '9px',
                                padding: '1px 4px',
                                background: '#e5e7eb',
                                color: '#6b7280',
                                borderRadius: '6px'
                              }}>
                                by {subtaskCreator?.name}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select
                              value={subtask.status}
                              onChange={(e) => updateSubtaskStatus(task.id, subtask.id, e.target.value)}
                              disabled={!canEditSubtask}
                              style={{
                                fontSize: '11px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                outline: 'none',
                                background: canEditSubtask ? 'white' : '#f9fafb',
                                cursor: canEditSubtask ? 'pointer' : 'not-allowed',
                                opacity: canEditSubtask ? 1 : 0.6
                              }}
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="done">Done</option>
                            </select>
                            {canEditSubtask && (
                              <button
                                onClick={() => deleteSubtask(task.id, subtask.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

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
