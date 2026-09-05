const express = require('express');
const router = express.Router();
const { generateEventDescription } = require('../controllers/aiController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// POST /api/ai/generate-description  (organizer only)
router.post('/generate-description', protect, authorizeRoles('organizer'), generateEventDescription);

module.exports = router;
