const mongoose = require('mongoose');

const bodyMeasurementSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  waist: { type: Number },    // cm
  chest: { type: Number },
  arms: { type: Number },
  hips: { type: Number },
  thighs: { type: Number },
  bodyFatPercentage: { type: Number, min: 0, max: 100 },
  notes: { type: String },
}, { timestamps: true });

bodyMeasurementSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('BodyMeasurement', bodyMeasurementSchema);
