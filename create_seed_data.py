import os

seed_script_content = '''const mongoose = require('mongoose');
require('dotenv').config();

const FoodItem = require('../models/FoodItem');
const Exercise = require('../models/Exercise');
const Recipe = require('../models/Recipe');
const Workout = require('../models/Workout');

const sampleFoods = [
  { name: 'Roti / Chapati (Whole Wheat)', category: 'Indian Breads', calories: 120, protein: 3.5, carbs: 22, fat: 2.5, fiber: 3.5, servingSize: '1 roti (40g)', isIndianFood: true, verified: true },
  { name: 'Paneer Butter Masala', category: 'Curries', calories: 340, protein: 14, carbs: 12, fat: 26, fiber: 2, servingSize: '1 bowl (200g)', isIndianFood: true, verified: true },
  { name: 'Dal Tadka (Yellow Lentils)', category: 'Dal & Pulses', calories: 180, protein: 9, carbs: 24, fat: 6, fiber: 5, servingSize: '1 bowl (150g)', isIndianFood: true, verified: true },
  { name: 'Steamed Basmati Rice', category: 'Grains & Rice', calories: 205, protein: 4.2, carbs: 45, fat: 0.5, fiber: 0.6, servingSize: '1 bowl (150g)', isIndianFood: true, verified: true },
  { name: 'Moong Dal Chila', category: 'Breakfast', calories: 150, protein: 9.5, carbs: 20, fat: 3, fiber: 4.5, servingSize: '2 chilas (100g)', isIndianFood: true, verified: true },
  { name: 'Idli (Steamed Rice & Lentil)', category: 'Breakfast', calories: 78, protein: 2.2, carbs: 17, fat: 0.2, fiber: 0.8, servingSize: '1 idli (50g)', isIndianFood: true, verified: true },
  { name: 'Masala Dosa', category: 'Breakfast', calories: 310, protein: 6.5, carbs: 48, fat: 10, fiber: 3, servingSize: '1 dosa (150g)', isIndianFood: true, verified: true },
  { name: 'Sambar', category: 'Soups & Curries', calories: 110, protein: 4, carbs: 18, fat: 2.5, fiber: 4, servingSize: '1 bowl (200g)', isIndianFood: true, verified: true },
  { name: 'Chicken Biryani (Hyderabadi)', category: 'Rice Dishes', calories: 480, protein: 28, carbs: 54, fat: 18, fiber: 2.5, servingSize: '1 bowl (300g)', isIndianFood: true, verified: true },
  { name: 'Grilled Chicken Breast', category: 'Poultry', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, servingSize: '100g', isIndianFood: false, verified: true },
  { name: 'Boiled Egg (Whole)', category: 'Eggs & Dairy', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0, servingSize: '1 large egg (50g)', isIndianFood: false, verified: true },
  { name: 'Greek Yogurt (Plain)', category: 'Dairy', calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0, servingSize: '1 cup (170g)', isIndianFood: false, verified: true },
  { name: 'Oats with Almond Milk', category: 'Breakfast', calories: 210, protein: 7, carbs: 36, fat: 4.5, fiber: 5, servingSize: '1 bowl (250g)', isIndianFood: false, verified: true },
  { name: 'Palak Paneer', category: 'Curries', calories: 280, protein: 15, carbs: 10, fat: 20, fiber: 4, servingSize: '1 bowl (200g)', isIndianFood: true, verified: true },
  { name: 'Sprouted Moong Salad', category: 'Salads & Snacks', calories: 140, protein: 8.5, carbs: 22, fat: 1.5, fiber: 6, servingSize: '1 bowl (150g)', isIndianFood: true, verified: true },
  { name: 'Roasted Makhana (Fox Nuts)', category: 'Snacks', calories: 110, protein: 3, carbs: 20, fat: 2, fiber: 2.5, servingSize: '1 bowl (30g)', isIndianFood: true, verified: true }
];

const sampleExercises = [
  { name: 'Push-ups', category: 'Strength', bodyPart: 'Chest', primaryMuscle: 'Pectoralis Major', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: ['Start in plank position', 'Lower body until chest touches floor', 'Push back up dynamically'] },
  { name: 'Bodyweight Squats', category: 'Strength', bodyPart: 'Legs', primaryMuscle: 'Quadriceps', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: ['Stand feet shoulder width', 'Lower hips as if sitting in chair', 'Keep chest high and push through heels'] },
  { name: 'Pull-ups', category: 'Strength', bodyPart: 'Back', primaryMuscle: 'Latissimus Dorsi', equipment: 'Pull-up Bar', difficulty: 'Intermediate', instructions: ['Grasp bar with overhand grip', 'Pull body upward until chin clears bar', 'Lower under control'] },
  { name: 'Dumbbell Bicep Curls', category: 'Strength', bodyPart: 'Arms', primaryMuscle: 'Biceps Brachii', equipment: 'Dumbbells', difficulty: 'Beginner', instructions: ['Hold dumbbells at sides', 'Curl weight upward keeping elbows locked', 'Squeeze bicep at peak'] },
  { name: 'Plank Hold', category: 'Core', bodyPart: 'Abs', primaryMuscle: 'Rectus Abdominis', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: ['Forearms on floor', 'Keep body in straight line', 'Engage core without letting lower back sag'] },
  { name: 'Jumping Jacks', category: 'Cardio', bodyPart: 'Full Body', primaryMuscle: 'Calves & Shoulders', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: ['Jump feet out while raising hands overhead', 'Return to starting position with tempo'] },
  { name: 'Barbell Bench Press', category: 'Strength', bodyPart: 'Chest', primaryMuscle: 'Pectoralis Major', equipment: 'Barbell', difficulty: 'Intermediate', instructions: ['Lie on bench', 'Lower bar to mid-chest', 'Press upward explosively'] },
  { name: 'Dumbbell Romanian Deadlift', category: 'Strength', bodyPart: 'Legs', primaryMuscle: 'Hamstrings', equipment: 'Dumbbells', difficulty: 'Intermediate', instructions: ['Hinge at hips with flat back', 'Lower dumbbells along shins until hamstring stretch', 'Return upright'] }
];

const sampleRecipes = [
  {
    name: 'High-Protein Moong Dal Chila',
    description: 'Crispy Indian savory pancake rich in plant protein and fiber.',
    category: 'Breakfast',
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'Easy',
    calories: 220,
    protein: 14,
    carbs: 28,
    fat: 5,
    fiber: 6,
    tags: ['High Protein', 'Vegetarian', 'Gluten-Free', 'Indian'],
    ingredients: [
      { name: 'Yellow Moong Dal (Soaked)', amount: '1 cup' },
      { name: 'Grated Paneer', amount: '50g' },
      { name: 'Green Chilies & Ginger', amount: '1 tsp chopped' },
      { name: 'Olive oil / Ghee', amount: '1 tsp' }
    ],
    instructions: [
      { step: 1, text: 'Blend soaked moong dal with ginger, chili, and water into a smooth batter.' },
      { step: 2, text: 'Heat a non-stick tawa, spread batter evenly in a circular motion.' },
      { step: 3, text: 'Top with grated paneer and coriander. Cook with minimal ghee until golden crisp.' }
    ]
  },
  {
    name: 'Grilled Herb Chicken & Quinoa Bowl',
    description: 'Lean chicken breast served with fluffy quinoa and roasted veggies.',
    category: 'Lunch',
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    difficulty: 'Easy',
    calories: 420,
    protein: 38,
    carbs: 42,
    fat: 9,
    fiber: 7,
    tags: ['High Protein', 'Weight Loss', 'Meal Prep'],
    ingredients: [
      { name: 'Chicken Breast', amount: '150g' },
      { name: 'Cooked Quinoa', amount: '1 cup' },
      { name: 'Mixed Veggies (Broccoli, Bell Peppers)', amount: '100g' }
    ],
    instructions: [
      { step: 1, text: 'Marinate chicken with oregano, garlic, salt, olive oil.' },
      { step: 2, text: 'Grill chicken for 6 mins per side until internal temperature reaches 75°C.' },
      { step: 3, text: 'Serve warm over cooked quinoa with steamed veggies.' }
    ]
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthfit';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    await FoodItem.deleteMany({});
    await Exercise.deleteMany({});
    await Recipe.deleteMany({});

    await FoodItem.insertMany(sampleFoods);
    await Exercise.insertMany(sampleExercises);
    await Recipe.insertMany(sampleRecipes);

    console.log('Successfully seeded 16 Food Items, 8 Exercises, and 2 Recipes!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
'''

with open('/Users/dhinagar/Documents/antigravity/Fitly/server/src/scripts/seedData.js', 'w') as f:
    f.write(seed_script_content)

print("seedData.js written successfully!")
