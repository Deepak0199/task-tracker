const express = require('express');
const taskController = require('../controllers/taskController');
const { validateTask } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

router.post('/', validateTask, taskController.createTask);
router.get('/', taskController.getTasks);
router.put('/:taskId', taskController.updateTask);
router.post('/:taskId/comments', taskController.addComment);

module.exports = router;