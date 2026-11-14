const mongoose = require('mongoose');

const waterEntrySchema = new mongoose.Schema({
  amount: { type: Number, required: true }, // ml
  time: { type: Date, default: Date.now },
}, { _id: true });

const waterLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  entries: [waterEntrySchema],
  totalAmount: { type: Number, default: 0 },
}, { timestamps: true });

waterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WaterLog', waterLogSchema);
