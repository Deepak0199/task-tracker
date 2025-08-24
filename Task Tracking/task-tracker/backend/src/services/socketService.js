const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor(io) {
    this.io = io;
    this.setupSocketAuth();
    this.setupSocketEvents();
  }

  setupSocketAuth() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId)
          .select('-password -refreshTokens')
          .populate('teams', '_id');
        
        if (!user || !user.isActive) {
          return next(new Error('Authentication error'));
        }

        socket.userId = user._id.toString();
        socket.organizationId = user.organizationId.toString();
        socket.userTeams = user.teams.map(team => team._id.toString());
        
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected`);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      // Join user to their teams' rooms
      socket.userTeams.forEach(teamId => {
        socket.join(`team_${teamId}`);
      });

      // Join organization room
      socket.join(`org_${socket.organizationId}`);

      // Handle typing events
      socket.on('typing_start', (data) => {
        socket.to(`task_${data.taskId}`).emit('user_typing', {
          userId: socket.userId,
          taskId: data.taskId,
          typing: true
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(`task_${data.taskId}`).emit('user_typing', {
          userId: socket.userId,
          taskId: data.taskId,
          typing: false
        });
      });

      // Handle task updates
      socket.on('join_task', (taskId) => {
        socket.join(`task_${taskId}`);
      });

      socket.on('leave_task', (taskId) => {
        socket.leave(`task_${taskId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });
    });
  }
}

module.exports = SocketService;