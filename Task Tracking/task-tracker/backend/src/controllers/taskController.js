const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const { validationResult } = require('express-validator');

class TaskController {
  async createTask(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        title,
        description,
        priority,
        assignedTo,
        teamId,
        dueDate,
        estimatedHours,
        tags
      } = req.body;

      // Verify team exists and user has access
      const team = await Team.findOne({
        _id: teamId,
        organizationId: req.user.organizationId,
        'members.userId': req.user.userId
      });

      if (!team) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or team not found'
        });
      }

      // Create task
      const task = new Task({
        title,
        description,
        priority,
        assignedTo,
        teamId,
        organizationId: req.user.organizationId,
        createdBy: req.user.userId,
        dueDate,
        estimatedHours,
        tags,
        history: [{
          action: 'created',
          userId: req.user.userId,
          newValue: 'Task created'
        }]
      });

      const savedTask = await task.save();
      
      // Populate the saved task
      await savedTask.populate([
        { path: 'assignedTo', select: 'firstName lastName email avatar' },
        { path: 'createdBy', select: 'firstName lastName email avatar' },
        { path: 'teamId', select: 'name' }
      ]);

      // Emit real-time event
      req.io.to(`team_${teamId}`).emit('task_created', {
        task: savedTask,
        createdBy: {
          id: req.user.userId,
          name: `${req.user.firstName} ${req.user.lastName}`
        }
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        task: savedTask
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error creating task'
      });
    }
  }

  async getTasks(req, res) {
    try {
      const {
        teamId,
        status,
        assignedTo,
        priority,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filter = {
        organizationId: req.user.organizationId
      };

      // Build filter based on query params
      if (teamId) {
        const team = await Team.findOne({
          _id: teamId,
          organizationId: req.user.organizationId,
          'members.userId': req.user.userId
        });
        
        if (!team) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this team'
          });
        }
        
        filter.teamId = teamId;
      } else {
        // Get all teams user is member of
        const userTeams = await Team.find({
          organizationId: req.user.organizationId,
          'members.userId': req.user.userId
        }).select('_id');
        
        filter.teamId = { $in: userTeams.map(team => team._id) };
      }

      if (status) filter.status = status;
      if (assignedTo) filter.assignedTo = assignedTo;
      if (priority) filter.priority = priority;

      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [tasks, totalCount] = await Promise.all([
        Task.find(filter)
          .populate('assignedTo', 'firstName lastName email avatar')
          .populate('createdBy', 'firstName lastName email avatar')
          .populate('teamId', 'name')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        Task.countDocuments(filter)
      ]);

      res.json({
        success: true,
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: skip + tasks.length < totalCount,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error fetching tasks'
      });
    }
  }

  async updateTask(req, res) {
    try {
      const { taskId } = req.params;
      const updates = req.body;

      const task = await Task.findOne({
        _id: taskId,
        organizationId: req.user.organizationId
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Check access
      const hasAccess = await Team.findOne({
        _id: task.teamId,
        'members.userId': req.user.userId
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Track changes for history
      const changes = [];
      const allowedUpdates = [
        'title', 'description', 'status', 'priority', 
        'assignedTo', 'dueDate', 'estimatedHours', 'actualHours', 'tags'
      ];

      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined && updates[field] !== task[field]) {
          changes.push({
            action: `updated_${field}`,
            userId: req.user.userId,
            previousValue: task[field]?.toString() || '',
            newValue: updates[field]?.toString() || ''
          });
        }
      });

      // Update task
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          task[key] = updates[key];
        }
      });

      // Add history entries
      task.history.push(...changes);

      const updatedTask = await task.save();
      await updatedTask.populate([
        { path: 'assignedTo', select: 'firstName lastName email avatar' },
        { path: 'createdBy', select: 'firstName lastName email avatar' },
        { path: 'teamId', select: 'name' }
      ]);

      // Emit real-time event
      req.io.to(`team_${task.teamId}`).emit('task_updated', {
        task: updatedTask,
        updatedBy: {
          id: req.user.userId,
          name: `${req.user.firstName} ${req.user.lastName}`
        },
        changes
      });

      res.json({
        success: true,
        message: 'Task updated successfully',
        task: updatedTask
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error updating task'
      });
    }
  }

  async addComment(req, res) {
    try {
      const { taskId } = req.params;
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment message is required'
        });
      }

      const task = await Task.findOne({
        _id: taskId,
        organizationId: req.user.organizationId
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Add comment
      const comment = {
        userId: req.user.userId,
        message: message.trim(),
        createdAt: new Date()
      };

      task.comments.push(comment);
      await task.save();

      // Populate the new comment
      await task.populate('comments.userId', 'firstName lastName email avatar');
      const newComment = task.comments[task.comments.length - 1];

      // Emit real-time event
      req.io.to(`team_${task.teamId}`).emit('comment_added', {
        taskId,
        comment: newComment
      });

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment: newComment
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error adding comment'
      });
    }
  }
}

module.exports = new TaskController();