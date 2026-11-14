const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ['strength', 'cardio', 'flexibility', 'hiit', 'yoga', 'sports'], required: true },
  muscleGroups: [{ type: String }],
  equipment: [{ type: String }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  description: { type: String },
  instructions: [{ type: String }],
  image: { type: String },
  videoUrl: { type: String },
  caloriesPerMinute: { type: Number },
  isCompound: { type: Boolean, default: false },
}, { timestamps: true });

exerciseSchema.index({ name: 'text' });

module.exports = mongoose.model('Exercise', exerciseSchema);
