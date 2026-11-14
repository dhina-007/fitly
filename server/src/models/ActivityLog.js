const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  steps: { type: Number, default: 0 },
  distance: { type: Number, default: 0 }, // km
  activeCalories: { type: Number, default: 0 },
  source: { type: String, enum: ['manual', 'healthkit', 'health_connect'], default: 'manual' },
}, { timestamps: true });

activityLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
