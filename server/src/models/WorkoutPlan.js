const mongoose = require('mongoose');

const planDaySchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6 },
  dayName: { type: String },
  isRestDay: { type: Boolean, default: false },
  workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' },
  workoutName: { type: String },
}, { _id: false });

const workoutPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  goal: { type: String },
  daysPerWeek: { type: Number, min: 1, max: 7 },
  duration: { type: Number }, // weeks
  days: [planDaySchema],
  isActive: { type: Boolean, default: true },
  startDate: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
