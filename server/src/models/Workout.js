const mongoose = require('mongoose');

const workoutExerciseSchema = new mongoose.Schema({
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  exerciseName: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number },
  duration: { type: Number }, // seconds (for timed exercises)
  weight: { type: Number }, // kg
  restSeconds: { type: Number, default: 60 },
  notes: { type: String },
}, { _id: true });

const workoutSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['strength', 'weight_loss', 'muscle_building', 'cardio', 'hiit', 'home', 'gym', 'beginner', 'full_body', 'upper_body', 'lower_body', 'core', 'mobility', 'stretching'], required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  duration: { type: Number }, // minutes
  exercises: [workoutExerciseSchema],
  totalCalories: { type: Number },
  image: { type: String },
  isPublic: { type: Boolean, default: true },
  createdBy: { type: String }, // null for system workouts
  equipment: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Workout', workoutSchema);
