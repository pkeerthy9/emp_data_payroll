
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    checkIn: {
      time: {
        type: Date,
        default: null
      },
      location: {
        latitude: Number,
        longitude: Number,
        accuracy: Number
      }
    },

    checkOut: {
      time: {
        type: Date,
        default: null
      },
      location: {
        latitude: Number,
        longitude: Number,
        accuracy: Number
      }
    },

    workingHours: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ['present', 'late', 'half-day', 'absent'],
      default: 'present'
    },

    isTrackingActive: {
      type: Boolean,
      default: false
    },

    locationConsent: {
      type: Boolean,
      default: false
    },
    // Stores whether the employee was inside the permitted office boundary.
geofence: {
  isWithinOffice: {
    type: Boolean,
    default: null
  },
  distanceFromOffice: {
    type: Number,
    default: null
  }
},

    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// One attendance record per employee per calendar date.
attendanceSchema.index(
  { employee: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
