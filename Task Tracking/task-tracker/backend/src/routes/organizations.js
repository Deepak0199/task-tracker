const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Placeholder for organization routes
router.get('/current', (req, res) => {
  res.json({ success: true, message: 'Organizations endpoint' });
});

module.exports = router;