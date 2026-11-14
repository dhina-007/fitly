const mongoose = require('mongoose');

const foodEntrySchema = new mongoose.Schema({
  foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: false, default: null },
  foodName: { type: String, required: true },
  servingSize: { type: Number, required: true },
  servingUnit: { type: String, default: 'g' },
  quantity: { type: Number, default: 1 },
  // Calculated for this serving
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now },
}, { _id: true });

const foodLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // firebase uid
  date: { type: String, required: true }, // YYYY-MM-DD
  mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'], required: true },
  entries: [foodEntrySchema],
  // Daily totals (updated on each add/edit/delete)
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFat: { type: Number, default: 0 },
  totalFiber: { type: Number, default: 0 },
}, { timestamps: true });

foodLogSchema.index({ userId: 1, date: 1, mealType: 1 }, { unique: true });
foodLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('FoodLog', foodLogSchema);
