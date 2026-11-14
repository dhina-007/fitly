const mongoose = require('mongoose');

const sleepLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  bedtime: { type: Date, required: true },
  wakeTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // hours
  quality: { type: Number, min: 1, max: 5 },
  notes: { type: String },
  source: { type: String, enum: ['manual', 'healthkit', 'health_connect'], default: 'manual' },
}, { timestamps: true });

sleepLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('SleepLog', sleepLogSchema);
