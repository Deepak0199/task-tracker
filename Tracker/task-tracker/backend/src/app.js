const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Trust proxy for development environments
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Security headers
app.use(helmet());

// Simple rate limiting - disabled in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  // Disable rate limiting in development to avoid proxy issues
  skip: () => process.env.NODE_ENV === 'development'
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root route - THIS IS THE MISSING PIECE!
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Task Tracker API! 🎉',
    status: 'Server is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      test: '/api/test'
    },
    documentation: 'Add your API documentation here'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Task Tracker API is running!' });
});

// Test route to check if everything works
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test route working!',
    ip: req.ip,
    timestamp: new Date().toISOString(),
    headers: {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'user-agent': req.headers['user-agent']
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: ['/', '/health', '/api', '/api/test']
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
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test route: http://localhost:${PORT}/api/test`);
  console.log(`🔒 Rate limiting: ${process.env.NODE_ENV === 'development' ? 'DISABLED (dev mode)' : 'ENABLED'}`);
  console.log(`🌐 Codespaces URL: Check the PORTS tab in VS Code`);
});

module.exports = app;