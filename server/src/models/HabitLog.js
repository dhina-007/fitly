const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('HabitLog', habitLogSchema);
