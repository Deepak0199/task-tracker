const express = require('express');
const { auth } = require('../middleware/auth');
const Team = require('../models/Team');
const { validateTeam } = require('../middleware/validation');

const router = express.Router();
router.use(auth);

// Get all teams for user
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find({
      organizationId: req.user.organizationId,
      'members.userId': req.user.userId
    }).populate('members.userId', 'firstName lastName email avatar');

    res.json({
      success: true,
      teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching teams'
    });
  }
});

// Create new team
router.post('/', validateTeam, async (req, res) => {
  try {
    const { name, description } = req.body;

    const team = new Team({
      name,
      description,
      organizationId: req.user.organizationId,
      createdBy: req.user.userId,
      members: [{
        userId: req.user.userId,
        role: 'lead'
      }]
    });

    const savedTeam = await team.save();
    await savedTeam.populate('members.userId', 'firstName lastName email avatar');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: savedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating team'
    });
  }
});

module.exports = router;