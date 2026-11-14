const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  weight: { type: Number, required: true, min: 10, max: 500 },
  unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
  notes: { type: String, maxlength: 500 },
  bmi: { type: Number },
  imageUrl: { type: String },
}, { timestamps: true });

weightLogSchema.index({ userId: 1, date: -1 });
weightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WeightLog', weightLogSchema);
