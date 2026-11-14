const mongoose = require('mongoose');

const plannedMealSchema = new mongoose.Schema({
  mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'], required: true },
  name: { type: String, required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  calories: { type: Number },
  protein: { type: Number },
  carbs: { type: Number },
  fat: { type: Number },
  notes: { type: String },
}, { _id: true });

const dayPlanSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun
  date: { type: String },
  meals: [plannedMealSchema],
  totalCalories: { type: Number },
}, { _id: false });

const mealPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, default: 'My Meal Plan' },
  startDate: { type: String, required: true },
  duration: { type: Number, enum: [1, 7], default: 7 },
  days: [dayPlanSchema],
  calorieTarget: { type: Number },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

mealPlanSchema.index({ userId: 1, startDate: -1 });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
