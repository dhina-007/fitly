const mongoose = require('mongoose');
require('dotenv').config();

const Exercise = require('../models/Exercise');
const Recipe = require('../models/Recipe');

const sampleExercises = [
  { name: 'Push-ups', category: 'strength', bodyPart: 'Chest', primaryMuscle: 'Pectoralis Major', equipment: ['Bodyweight'], difficulty: 'beginner', instructions: ['Start in plank position', 'Lower body until chest touches floor', 'Push back up dynamically'] },
  { name: 'Bodyweight Squats', category: 'strength', bodyPart: 'Legs', primaryMuscle: 'Quadriceps', equipment: ['Bodyweight'], difficulty: 'beginner', instructions: ['Stand feet shoulder width', 'Lower hips as if sitting in chair', 'Keep chest high and push through heels'] },
  { name: 'Pull-ups', category: 'strength', bodyPart: 'Back', primaryMuscle: 'Latissimus Dorsi', equipment: ['Pull-up Bar'], difficulty: 'intermediate', instructions: ['Grasp bar with overhand grip', 'Pull body upward until chin clears bar', 'Lower under control'] },
  { name: 'Dumbbell Bicep Curls', category: 'strength', bodyPart: 'Arms', primaryMuscle: 'Biceps Brachii', equipment: ['Dumbbells'], difficulty: 'beginner', instructions: ['Hold dumbbells at sides', 'Curl weight upward keeping elbows locked', 'Squeeze bicep at peak'] },
  { name: 'Plank Hold', category: 'strength', bodyPart: 'Abs', primaryMuscle: 'Rectus Abdominis', equipment: ['Bodyweight'], difficulty: 'beginner', instructions: ['Forearms on floor', 'Keep body in straight line', 'Engage core without letting lower back sag'] },
  { name: 'Jumping Jacks', category: 'cardio', bodyPart: 'Full Body', primaryMuscle: 'Calves & Shoulders', equipment: ['Bodyweight'], difficulty: 'beginner', instructions: ['Jump feet out while raising hands overhead', 'Return to starting position with tempo'] },
  { name: 'Barbell Bench Press', category: 'strength', bodyPart: 'Chest', primaryMuscle: 'Pectoralis Major', equipment: ['Barbell'], difficulty: 'intermediate', instructions: ['Lie on bench', 'Lower bar to mid-chest', 'Press upward explosively'] },
  { name: 'Dumbbell Romanian Deadlift', category: 'strength', bodyPart: 'Legs', primaryMuscle: 'Hamstrings', equipment: ['Dumbbells'], difficulty: 'intermediate', instructions: ['Hinge at hips with flat back', 'Lower dumbbells along shins until hamstring stretch', 'Return upright'] }
];

const sampleRecipes = [
  {
    name: 'High-Protein Moong Dal Chila',
    description: 'Crispy Indian savory pancake rich in plant protein and fiber.',
    category: 'breakfast',
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'easy',
    calories: 220,
    protein: 14,
    carbs: 28,
    fat: 5,
    fiber: 6,
    tags: ['High Protein', 'Vegetarian', 'Gluten-Free', 'Indian'],
    ingredients: [
      { name: 'Yellow Moong Dal (Soaked)', amount: 1, unit: 'cup' },
      { name: 'Grated Paneer', amount: 50, unit: 'g' },
      { name: 'Green Chilies & Ginger', amount: 1, unit: 'tsp' },
      { name: 'Olive oil / Ghee', amount: 1, unit: 'tsp' }
    ],
    instructions: [
      'Blend soaked moong dal with ginger, chili, and water into a smooth batter.',
      'Heat a non-stick tawa, spread batter evenly in a circular motion.',
      'Top with grated paneer and coriander. Cook with minimal ghee until golden crisp.'
    ]
  },
  {
    name: 'Grilled Herb Chicken & Quinoa Bowl',
    description: 'Lean chicken breast served with fluffy quinoa and roasted veggies.',
    category: 'lunch',
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    difficulty: 'easy',
    calories: 420,
    protein: 38,
    carbs: 42,
    fat: 9,
    fiber: 7,
    tags: ['High Protein', 'Weight Loss', 'Meal Prep'],
    ingredients: [
      { name: 'Chicken Breast', amount: 150, unit: 'g' },
      { name: 'Cooked Quinoa', amount: 1, unit: 'cup' },
      { name: 'Mixed Veggies', amount: 100, unit: 'g' }
    ],
    instructions: [
      'Marinate chicken with oregano, garlic, salt, olive oil.',
      'Grill chicken for 6 mins per side until internal temperature reaches 75°C.',
      'Serve warm over cooked quinoa with steamed veggies.'
    ]
  }
];

async function seedExercisesAndRecipes() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const ex of sampleExercises) {
    await Exercise.updateOne({ name: ex.name }, { $set: ex }, { upsert: true });
  }
  for (const rec of sampleRecipes) {
    await Recipe.updateOne({ name: rec.name }, { $set: rec }, { upsert: true });
  }
  console.log('Seeded exercises and recipes successfully!');
  await mongoose.disconnect();
}

if (require.main === module) {
  seedExercisesAndRecipes().catch(console.error);
}

module.exports = { seedExercisesAndRecipes };
