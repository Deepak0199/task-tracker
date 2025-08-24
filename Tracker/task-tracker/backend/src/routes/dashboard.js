const express = require('express');
const { auth } = require('../middleware/auth');
const Task = require('../models/Task');
const Team = require('../models/Team');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    // Get user's teams
    const userTeams = await Team.find({
      organizationId: req.user.organizationId,
      'members.userId': req.user.userId
    }).select('_id name');

    const teamIds = userTeams.map(team => team._id);

    // Get dashboard statistics
    const [
      totalTasks,
      tasksByStatus,
      recentTasks
    ] = await Promise.all([
      // Total tasks count
      Task.countDocuments({ teamId: { $in: teamIds } }),
      
      // Tasks by status
      Task.aggregate([
        { $match: { teamId: { $in: teamIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Recent tasks
      Task.find({ teamId: { $in: teamIds } })
        .populate('assignedTo', 'firstName lastName email avatar')
        .populate('teamId', 'name')
        .sort({ updatedAt: -1 })
        .limit(10)
    ]);

    // My assigned tasks
    const myTasks = await Task.find({
      assignedTo: req.user.userId,
      status: { $ne: 'done' }
    })
      .populate('teamId', 'name')
      .sort({ dueDate: 1 })
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        summary: {
          totalTasks,
          totalTeams: userTeams.length,
          myActiveTasks: myTasks.length
        },
        charts: {
          tasksByStatus
        },
        recentActivity: recentTasks,
        myTasks
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

module.exports = router;