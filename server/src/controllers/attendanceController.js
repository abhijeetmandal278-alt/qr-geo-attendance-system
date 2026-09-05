const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const User = require('../models/User');
const { calculateDistance } = require('../utils/geoUtils');

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance — validates QR code, checks geofence, prevents duplicates
 * @access  Private (any authenticated user)
 */
const markAttendance = async (req, res) => {
  try {
    const { qrCode, latitude, longitude } = req.body;

    // ---------- Input validation ----------
    if (!qrCode || latitude == null || longitude == null) {
      return res.status(400).json({
        error: 'All fields are required (qrCode, latitude, longitude)',
      });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Latitude and longitude must be valid numbers' });
    }

    // ---------- Look up event by QR code ----------
    const event = await Event.findOne({ qrCode });
    if (!event) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    // ---------- Duplicate check (application level) ----------
    const existingAttendance = await Attendance.findOne({
      event: event._id,
      user: req.user.id,
    });
    if (existingAttendance) {
      return res.status(409).json({ error: 'Attendance already marked for this event' });
    }

    // ---------- Geofence check ----------
    const distance = calculateDistance(
      latitude,
      longitude,
      event.latitude,
      event.longitude
    );
    const distanceRounded = Math.round(distance);

    if (distance > event.geofenceRadius) {
      return res.status(403).json({
        error: `You are outside the event location. Distance: ${distanceRounded}m, allowed: ${event.geofenceRadius}m`,
      });
    }

    // ---------- Mark attendance ----------
    const attendance = await Attendance.create({
      event: event._id,
      user: req.user.id,
      verifiedLocation: { latitude, longitude },
    });

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance: {
        id: attendance._id,
        event: event._id,
        eventName: event.name,
        timestamp: attendance.timestamp,
        distance: `${distanceRounded}m`,
        status: attendance.status,
      },
    });
  } catch (err) {
    // Handle race-condition duplicate: Mongo duplicate-key error code 11000
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Attendance already marked for this event' });
    }
    console.error('MarkAttendance error:', err.message);
    res.status(500).json({ error: 'Server error during attendance marking' });
  }
};

/**
 * @route   GET /api/attendance/event/:eventId
 * @desc    Get all attendance records for an event (owner organizer only)
 * @access  Private (organizer only)
 */
const getEventAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // ---------- Ownership check ----------
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden — you can only view attendance for your own events' });
    }

    const records = await Attendance.find({ event: event._id })
      .populate('user', 'name email registrationId')
      .sort({ timestamp: -1 });

    res.json({
      eventId: event._id,
      eventName: event.name,
      count: records.length,
      records,
    });
  } catch (err) {
    console.error('GetEventAttendance error:', err.message);
    res.status(500).json({ error: 'Server error fetching attendance records' });
  }
};

/**
 * @route   GET /api/attendance/event/:eventId/stats
 * @desc    Get attendance stats for an event (owner organizer only)
 * @access  Private (organizer only)
 */
const getAttendanceStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // ---------- Ownership check ----------
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden — you can only view stats for your own events' });
    }

    const totalAttendees = await Attendance.countDocuments({ event: event._id });

    // NOTE: totalRegistrations uses the count of all users with role "attendee"
    // as a placeholder. A proper registration/RSVP system (where attendees
    // explicitly sign up for specific events) is out of scope for this task.
    const totalRegistrations = await User.countDocuments({ role: 'attendee' });

    const attendancePercentage = totalRegistrations > 0
      ? Math.round((totalAttendees / totalRegistrations) * 1000) / 10  // 1 decimal place
      : 0;

    res.json({
      eventId: event._id,
      eventName: event.name,
      totalRegistrations,
      totalAttendees,
      attendancePercentage,
    });
  } catch (err) {
    console.error('GetAttendanceStats error:', err.message);
    res.status(500).json({ error: 'Server error fetching attendance stats' });
  }
};

// @desc    Export attendance records for an event as CSV
// @route   GET /api/attendance/event/:eventId/export
// @access  Private (organizer only, must own the event)
async function exportAttendanceCSV(req, res) {
  try {
    const Event = require("../models/Event");
    const Attendance = require("../models/Attendance");

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "You do not own this event" });
    }

    const records = await Attendance.find({ event: event._id })
      .populate("user", "name email registrationId")
      .sort({ timestamp: -1 });

    const header = ["Name", "Registration ID", "Email", "Attendance Status", "Timestamp"];
    const rows = records.map((r) => [
      r.user?.name || "",
      r.user?.registrationId || "",
      r.user?.email || "",
      r.status || "present",
      new Date(r.timestamp).toLocaleString(),
    ]);

    function escapeCsvField(field) {
      const str = String(field);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const csvLines = [header, ...rows].map((row) => row.map(escapeCsvField).join(","));
    const csvContent = csvLines.join("\n");

    const safeEventName = event.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${safeEventName}_attendance.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error("Export CSV error:", err.message);
    return res.status(500).json({ error: "Server error during export" });
  }
}

module.exports = { markAttendance, getEventAttendance, getAttendanceStats, exportAttendanceCSV };
