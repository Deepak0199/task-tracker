const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 
      'mongodb+srv://dksingh0199_db_user:Vjg2a8LzMUGUwxqs@datadb.tikfqms.mongodb.net/';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected: ' + mongoose.connection.host);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Mongoose Models (inline to avoid compilation issues)
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  createdBy: {
    type: String,
    required: true
  },
  assignedTo: {
    id: String,
    name: String,
    email: String,
    avatar: String
  },
  dueDate: Date,
  completedAt: Date,
  estimatedHours: Number,
  actualHours: Number,
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    assignedTo: {
      id: String,
      name: String,
      email: String
    },
    dueDate: Date,
    completedAt: Date,
    createdBy: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    userId: String,
    userName: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Create Task model with error handling
let Task;
try {
  Task = mongoose.model('Task');
} catch {
  Task = mongoose.model('Task', taskSchema);
}

// Trust proxy for development environments
app.set('trust proxy', 1);

// CORS configuration - Updated for GitHub Codespaces
app.use(cors({
  origin: [
    'http://localhost:3000',
    /\.app\.github\.dev$/,
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - disabled in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  skip: () => process.env.NODE_ENV === 'development'
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Task Tracker API with MongoDB!',
    status: 'Server is running',
    version: '1.0.0',
    database: 'MongoDB Connected',
    endpoints: {
      health: '/health',
      api: '/api',
      test: '/api/test',
      tasks: '/api/tasks',
      auth: '/api/auth',
      stats: '/api/stats'
    },
    documentation: 'Task Tracker API with full MongoDB integration'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Task Tracker API is running with MongoDB!',
    version: '1.0.0',
    database: 'Connected'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test route working!',
    ip: req.ip,
    timestamp: new Date().toISOString(),
    database: 'MongoDB Connected',
    headers: {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'user-agent': req.headers['user-agent']
    }
  });
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    const userData = {
      id: username,
      username,
      email: `${username}@example.com`,
      role: username === 'admin' ? 'admin' : 'user'
    };

    res.json({
      success: true,
      user: userData,
      token: 'demo-token',
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get all tasks for a user
app.get('/api/tasks', async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }
    
    let query = {};
    if (!isAdmin || isAdmin === 'false') {
      query = {
        $or: [
          { createdBy: userId },
          { 'assignedTo.id': userId }
        ]
      };
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// Get single task by ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message
    });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const taskData = req.body;
    
    if (!taskData.title || !taskData.createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Title and createdBy are required'
      });
    }
    
    const task = new Task(taskData);
    await task.save();

    console.log('Task created:', task.title);
    
    res.status(201).json({
      success: true,
      task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;

    const task = await Task.findByIdAndUpdate(
      taskId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      deletedTask: task
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

// Add subtask to a task
app.post('/api/tasks/:id/subtasks', async (req, res) => {
  try {
    const taskId = req.params.id;
    const subtaskData = req.body;

    if (!subtaskData.title) {
      return res.status(400).json({
        success: false,
        message: 'Subtask title is required'
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.subtasks.push(subtaskData);
    await task.save();

    res.status(201).json({
      success: true,
      task,
      message: 'Subtask added successfully'
    });
  } catch (error) {
    console.error('Error adding subtask:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to add subtask',
      error: error.message
    });
  }
});

// Update subtask
app.put('/api/tasks/:taskId/subtasks/:subtaskId', async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    Object.assign(subtask, updates, { updatedAt: new Date() });
    await task.save();

    res.json({
      success: true,
      task,
      message: 'Subtask updated successfully'
    });
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update subtask',
      error: error.message
    });
  }
});

// Delete subtask
app.delete('/api/tasks/:taskId/subtasks/:subtaskId', async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.subtasks.pull(subtaskId);
    await task.save();

    res.json({
      success: true,
      task,
      message: 'Subtask deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subtask',
      error: error.message
    });
  }
});

// Get task statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;
    
    let matchCondition = {};
    if (!isAdmin || isAdmin === 'false') {
      matchCondition = {
        $or: [
          { createdBy: userId },
          { 'assignedTo.id': userId }
        ]
      };
    }

    const stats = await Task.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      todo: 0,
      'in-progress': 0,
      review: 0,
      done: 0
    };

    stats.forEach(stat => {
      if (formattedStats.hasOwnProperty(stat._id)) {
        formattedStats[stat._id] = stat.count;
      }
    });

    const totalTasks = await Task.countDocuments(matchCondition);

    res.json({
      success: true,
      stats: formattedStats,
      totalTasks
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Database test route
app.get('/api/db-test', async (req, res) => {
  try {
    const taskCount = await Task.countDocuments();
    
    res.json({
      success: true,
      message: 'Database connection successful',
      taskCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Bulk operations
app.post('/api/tasks/bulk', async (req, res) => {
  try {
    const { operation, taskIds, updates } = req.body;
    
    if (!operation || !taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({
        success: false,
        message: 'Operation and taskIds array are required'
      });
    }

    let result;
    switch (operation) {
      case 'update':
        if (!updates) {
          return res.status(400).json({
            success: false,
            message: 'Updates object is required for bulk update'
          });
        }
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { ...updates, updatedAt: new Date() }
        );
        break;
        
      case 'delete':
        result = await Task.deleteMany({ _id: { $in: taskIds } });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation. Use "update" or "delete"'
        });
    }

    res.json({
      success: true,
      message: `Bulk ${operation} completed`,
      result: {
        matched: result.matchedCount || result.deletedCount,
        modified: result.modifiedCount || result.deletedCount
      }
    });
  } catch (error) {
    console.error('Bulk operation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk operation failed',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      '/',
      '/health', 
      '/api',
      '/api/test',
      '/api/tasks',
      '/api/auth/login',
      '/api/stats',
      '/api/db-test'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test route: http://localhost:${PORT}/api/test`);
  console.log(`Database test: http://localhost:${PORT}/api/db-test`);
  console.log(`Tasks API: http://localhost:${PORT}/api/tasks`);
  console.log(`Stats API: http://localhost:${PORT}/api/stats`);
  console.log(`Rate limiting: ${process.env.NODE_ENV === 'development' ? 'DISABLED (dev mode)' : 'ENABLED'}`);
  console.log(`Codespaces URL: Check the PORTS tab in VS Code`);
  console.log(`MongoDB: Connected and ready!`);
});

module.exports = app;