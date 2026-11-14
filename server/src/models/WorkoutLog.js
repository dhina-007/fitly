const mongoose = require('mongoose');

const loggedSetSchema = new mongoose.Schema({
  reps: { type: Number },
  weight: { type: Number },
  duration: { type: Number },
  completed: { type: Boolean, default: false },
}, { _id: false });

const loggedExerciseSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId },
  exerciseName: { type: String, required: true },
  sets: [loggedSetSchema],
}, { _id: true });

const workoutLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' },
  workoutName: { type: String, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  durationMinutes: { type: Number },
  exercises: [loggedExerciseSchema],
  caloriesBurned: { type: Number },
  notes: { type: String },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

workoutLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
