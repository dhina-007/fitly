const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: String },
  category: { type: String, enum: ['vegetables', 'fruits', 'protein', 'dairy', 'grains', 'spices', 'snacks', 'other'], default: 'other' },
  checked: { type: Boolean, default: false },
  checkedAt: { type: Date },
}, { _id: true });

const groceryListSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, default: 'Shopping List' },
  items: [groceryItemSchema],
  mealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan' },
}, { timestamps: true });

module.exports = mongoose.model('GroceryList', groceryListSchema);
