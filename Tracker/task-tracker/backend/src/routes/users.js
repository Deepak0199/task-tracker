const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Placeholder for user routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Users endpoint' });
});

module.exports = router;