const mongoose = require('mongoose');
const crypto = require('crypto');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    geofenceRadius: {
      type: Number,
      required: [true, 'Geofence radius is required'],
      default: 100, // meters
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
    qrCode: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// --------------- Hooks ---------------

// Generate a unique qrCode before saving (only on creation)
eventSchema.pre('save', function (next) {
  if (this.isNew && !this.qrCode) {
    this.qrCode = crypto.randomUUID();
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
