const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event is required'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  status: {
    type: String,
    enum: ['present'],
    default: 'present',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  verifiedLocation: {
    latitude: {
      type: Number,
      required: [true, 'Verified latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Verified longitude is required'],
    },
  },
});

// --------------- Indexes ---------------

// Compound unique index — the database itself rejects duplicate attendance.
// Even if the application-level check is bypassed by a race condition,
// MongoDB will throw a duplicate-key error (code 11000).
attendanceSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
