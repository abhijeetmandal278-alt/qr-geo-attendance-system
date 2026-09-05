const express = require('express');
const router = express.Router();
const {
  createEvent,
  getMyEvents,
  getUpcomingEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// POST /api/events  (organizer only)
router.post('/', protect, authorizeRoles('organizer'), createEvent);

// GET /api/events/mine  (organizer only)
router.get('/mine', protect, authorizeRoles('organizer'), getMyEvents);

// GET /api/events/upcoming  (any authenticated user)
router.get('/upcoming', protect, getUpcomingEvents);

// GET /api/events/:id  (any authenticated user)
router.get('/:id', protect, getEventById);

// PUT /api/events/:id  (organizer only)
router.put('/:id', protect, authorizeRoles('organizer'), updateEvent);

// DELETE /api/events/:id  (organizer only)
router.delete('/:id', protect, authorizeRoles('organizer'), deleteEvent);

module.exports = router;
