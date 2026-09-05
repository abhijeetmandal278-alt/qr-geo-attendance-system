const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getEventAttendance,
  getAttendanceStats,
  exportAttendanceCSV,
} = require('../controllers/attendanceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// POST /api/attendance/mark  (any authenticated user)
router.post('/mark', protect, markAttendance);

// GET /api/attendance/event/:eventId  (organizer only)
router.get('/event/:eventId', protect, authorizeRoles('organizer'), getEventAttendance);

// GET /api/attendance/event/:eventId/stats  (organizer only)
router.get('/event/:eventId/stats', protect, authorizeRoles('organizer'), getAttendanceStats);

// GET /api/attendance/event/:eventId/export  (organizer only)
router.get('/event/:eventId/export', protect, authorizeRoles('organizer'), exportAttendanceCSV);

module.exports = router;