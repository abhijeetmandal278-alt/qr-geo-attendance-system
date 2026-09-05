const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Attendify API is running',
    timestamp: new Date().toISOString(),
  });
});

// Route modules
router.use('/auth', require('./auth.routes'));
router.use('/events', require('./event.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/ai', require('./ai.routes'));
module.exports = router;
