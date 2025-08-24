import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Set up axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo'
  });

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // If API is not available, show sample data
      setTasks([
        {
          _id: '1',
          title: 'Connect to your backend',
          description: 'Make sure your backend server is running on port 5000',
          priority: 'high',
          status: 'todo',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const response = await axios.post('/api/tasks', newTask);
      setTasks([response.data, ...tasks]);
      setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
    } catch (error) {
      console.error('Error creating task:', error);
      // Fallback: add task locally if API fails
      const task = {
        _id: Date.now().toString(),
        ...newTask,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        createdAt: new Date().toISOString()
      };
      setTasks([task, ...tasks]);
      setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(task => 
        task._id === taskId ? response.data : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      // Fallback: update locally if API fails
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      // Fallback: delete locally if API fails
      setTasks(tasks.filter(task => task._id !== taskId));
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'todo': return '📋';
      case 'in-progress': return '⚡';
      case 'review': return '👀';
      case 'done': return '✅';
      default: return '📝';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '2rem' }}>🎯</div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Task Tracker
              </h1>
            </div>
            <div style={{ 
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Add Task Form */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Create New Task
            </h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  📝 Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  style={{
                    width: '100%',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter task title"
                  required
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  🎯 Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  style={{
                    width: '100%',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    outline: 'none',
                    background: 'rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🟠 High Priority</option>
                  <option value="critical">🔴 Critical</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '8px'
              }}>
                📄 Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '100px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter task description (optional)"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            
            <button
              type="submit"
              style={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              ✨ Add Task
            </button>
          </form>
        </div>

        {/* Tasks List */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '24px 32px', 
            borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
            background: 'linear-gradient(45deg, #f8fafc, #e2e8f0)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Your Tasks
              </h2>
            </div>
          </div>
          
          {loading ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ fontSize: '16px', margin: 0 }}>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📝</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                No tasks yet
              </h3>
              <p style={{ margin: 0 }}>Create your first task above to get started!</p>
            </div>
          ) : (
            <div>
              {tasks.map((task, index) => {
                const priorityColors = getPriorityColor(task.priority);
                const statusColors = getStatusColor(task.status);
                
                return (
                  <div 
                    key={task._id} 
                    style={{ 
                      padding: '24px 32px',
                      borderBottom: index < tasks.length - 1 ? '1px solid rgba(229, 231, 235, 0.3)' : 'none',
                      transition: 'all 0.2s',
                      cursor: 'default'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.03)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <h3 style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: '600', 
                            color: '#1f2937',
                            margin: 0,
                            lineHeight: '1.4'
                          }}>
                            {task.title}
                          </h3>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: `1px solid ${priorityColors.border}`,
                            background: priorityColors.bg,
                            color: priorityColors.text
                          }}>
                            {getPriorityIcon(task.priority)} {task.priority}
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: `1px solid ${statusColors.border}`,
                            background: statusColors.bg,
                            color: statusColors.text
                          }}>
                            {getStatusIcon(task.status)} {task.status.replace('-', ' ')}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p style={{ 
                            color: '#6b7280', 
                            marginBottom: '16px',
                            lineHeight: '1.6',
                            fontSize: '15px',
                            margin: '0 0 16px 0'
                          }}>
                            {task.description}
                          </p>
                        )}
                        
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#9ca3af',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>📅</span>
                          Created: {new Date(task.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                          style={{
                            fontSize: '14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            outline: 'none',
                            background: 'white',
                            cursor: 'pointer',
                            minWidth: '120px'
                          }}
                        >
                          <option value="todo">📋 To Do</option>
                          <option value="in-progress">⚡ In Progress</option>
                          <option value="review">👀 Review</option>
                          <option value="done">✅ Done</option>
                        </select>
                        
                        <button
                          onClick={() => deleteTask(task._id)}
                          style={{
                            background: 'linear-gradient(45deg, #ef4444, #dc2626)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}

export default App;