// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'https://stunning-broccoli-7vp5t4pqxgrcr2wj-5000.app.github.dev/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

// API Service Class
class ApiService {
  // Authentication
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  // Tasks
  async getTasks(userId, isAdmin = false) {
    try {
      const response = await api.get('/tasks', {
        params: { userId, isAdmin }
      });
      return response.tasks || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async createTask(taskData) {
    try {
      const response = await api.post('/tasks', taskData);
      return response.task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(taskId, updates) {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates);
      return response.task;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      await api.delete(`/tasks/${taskId}`);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Subtasks
  async addSubtask(taskId, subtaskData) {
    try {
      const response = await api.post(`/tasks/${taskId}/subtasks`, subtaskData);
      return response.task;
    } catch (error) {
      console.error('Error adding subtask:', error);
      throw error;
    }
  }

  async updateSubtask(taskId, subtaskId, updates) {
    try {
      const response = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, updates);
      return response.task;
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  }

  async deleteSubtask(taskId, subtaskId) {
    try {
      const response = await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
      return response.task;
    } catch (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  }

  // Statistics
  async getStats(userId, isAdmin = false) {
    try {
      const response = await api.get('/stats', {
        params: { userId, isAdmin }
      });
      return response.stats || {};
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {};
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;