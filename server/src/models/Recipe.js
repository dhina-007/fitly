const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number },
  unit: { type: String },
  notes: { type: String },
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  image: { type: String },
  category: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack', 'drink', 'dessert'] },
  cuisine: { type: String, default: 'indian' },
  servings: { type: Number, default: 1 },
  prepTime: { type: Number }, // minutes
  cookTime: { type: Number }, // minutes
  totalTime: { type: Number },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  ingredients: [ingredientSchema],
  instructions: [{ type: String }],
  // Nutrition per serving
  calories: { type: Number },
  protein: { type: Number },
  carbs: { type: Number },
  fat: { type: Number },
  fiber: { type: Number },
  tags: [{ type: String }],
  dietaryFlags: {
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
  },
  isPublic: { type: Boolean, default: true },
  createdBy: { type: String },
}, { timestamps: true });

recipeSchema.index({ name: 'text', tags: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);
