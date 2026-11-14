const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: '⭐' },
  category: { type: String, enum: ['nutrition', 'fitness', 'sleep', 'hydration', 'wellness', 'custom'], default: 'custom' },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  targetDays: [{ type: Number }], // 0=Sun, 1=Mon, ..., 6=Sat
  reminderTime: { type: String }, // HH:MM
  isActive: { type: Boolean, default: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  color: { type: String, default: '#00BFA5' },
}, { timestamps: true });

module.exports = mongoose.model('Habit', habitSchema);
