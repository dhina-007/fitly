const mongoose = require('mongoose');
require('dotenv').config();

const FoodItem = require('../models/FoodItem');
const Exercise = require('../models/Exercise');
const Recipe = require('../models/Recipe');
const Workout = require('../models/Workout');

const rawFoods = [
  // Existing Base Foods
  { name: 'Roti / Chapati', cat: 'grains', cal: 120, pro: 3.5, carb: 22, fat: 2.5, fib: 3.5, weight: 40 },
  { name: 'Paneer Butter Masala', cat: 'other', cal: 340, pro: 14, carb: 12, fat: 26, fib: 2, weight: 200 },
  { name: 'Dal Tadka (Yellow Lentils)', cat: 'legumes', cal: 180, pro: 9, carb: 24, fat: 6, fib: 5, weight: 150 },
  { name: 'Steamed Basmati Rice', cat: 'grains', cal: 205, pro: 4.2, carb: 45, fat: 0.5, fib: 0.6, weight: 150 },
  { name: 'Moong Dal Chila', cat: 'legumes', cal: 150, pro: 9.5, carb: 20, fat: 3, fib: 4.5, weight: 100 },
  { name: 'Idli', cat: 'grains', cal: 78, pro: 2.2, carb: 17, fat: 0.2, fib: 0.8, weight: 50 },
  { name: 'Masala Dosa', cat: 'grains', cal: 310, pro: 6.5, carb: 48, fat: 10, fib: 3, weight: 150 },
  { name: 'Sambar', cat: 'legumes', cal: 110, pro: 4, carb: 18, fat: 2.5, fib: 4, weight: 200 },
  { name: 'Chicken Biryani', cat: 'grains', cal: 480, pro: 28, carb: 54, fat: 18, fib: 2.5, weight: 300 },
  { name: 'Grilled Chicken Breast', cat: 'protein', cal: 165, pro: 31, carb: 0, fat: 3.6, fib: 0, weight: 100 },
  { name: 'Boiled Egg', cat: 'protein', cal: 78, pro: 6.3, carb: 0.6, fat: 5.3, fib: 0, weight: 50 },
  { name: 'Greek Yogurt (Plain)', cat: 'dairy', cal: 100, pro: 17, carb: 6, fat: 0.7, fib: 0, weight: 170 },
  { name: 'Oats with Almond Milk', cat: 'grains', cal: 210, pro: 7, carb: 36, fat: 4.5, fib: 5, weight: 250 },
  { name: 'Palak Paneer', cat: 'dairy', cal: 280, pro: 15, carb: 10, fat: 20, fib: 4, weight: 200 },
  { name: 'Sprouted Moong Salad', cat: 'legumes', cal: 140, pro: 8.5, carb: 22, fat: 1.5, fib: 6, weight: 150 },
  { name: 'Roasted Makhana', cat: 'snacks', cal: 110, pro: 3, carb: 20, fat: 2, fib: 2.5, weight: 30 },

  // Indian Snacks
  { name: 'Samosa (Potato Stuffed)', cat: 'snacks', cal: 260, pro: 3.5, carb: 32, fat: 13, fib: 2.5, weight: 85 },
  { name: 'Kachori (Dal Stuffed)', cat: 'snacks', cal: 190, pro: 4, carb: 22, fat: 10, fib: 2, weight: 60 },
  { name: 'Bhel Puri', cat: 'snacks', cal: 280, pro: 5, carb: 55, fat: 4, fib: 4.5, weight: 150 },
  { name: 'Pani Puri (Golgappa)', cat: 'snacks', cal: 160, pro: 3, carb: 30, fat: 2.5, fib: 2, weight: 120 },
  { name: 'Vada Pav', cat: 'snacks', cal: 290, pro: 6, carb: 42, fat: 10, fib: 3, weight: 120 },
  { name: 'Dhokla (Khaman)', cat: 'snacks', cal: 160, pro: 6, carb: 28, fat: 2.5, fib: 3, weight: 100 },
  { name: 'Khandvi', cat: 'snacks', cal: 210, pro: 7, carb: 25, fat: 9, fib: 4, weight: 100 },
  { name: 'Mathri', cat: 'snacks', cal: 160, pro: 2, carb: 14, fat: 11, fib: 1, weight: 30 },
  { name: 'Aloo Tikki', cat: 'snacks', cal: 220, pro: 3, carb: 35, fat: 8, fib: 3.5, weight: 100 },
  { name: 'Bhujia / Sev', cat: 'snacks', cal: 170, pro: 4, carb: 12, fat: 12, fib: 1.5, weight: 30 },
  { name: 'Chakli / Murukku', cat: 'snacks', cal: 150, pro: 2.5, carb: 16, fat: 9, fib: 1.5, weight: 30 },
  { name: 'Roasted Chana', cat: 'snacks', cal: 110, pro: 6, carb: 17, fat: 1.5, fib: 5, weight: 30 },
  { name: 'Peanut Chikki', cat: 'snacks', cal: 140, pro: 4, carb: 15, fat: 8, fib: 2, weight: 25 },
  
  // Regional / Lesser-Known Foods
  { name: 'Pesarattu (Green Gram Dosa)', cat: 'grains', cal: 210, pro: 10, carb: 32, fat: 4, fib: 6, weight: 120 },
  { name: 'Poha (Flattened Rice)', cat: 'grains', cal: 250, pro: 5, carb: 45, fat: 6, fib: 2, weight: 150 },
  { name: 'Upma (Semolina)', cat: 'grains', cal: 260, pro: 6, carb: 42, fat: 8, fib: 3, weight: 150 },
  { name: 'Thepla (Methi)', cat: 'grains', cal: 110, pro: 3, carb: 16, fat: 3.5, fib: 2.5, weight: 40 },
  { name: 'Sabudana Khichdi', cat: 'grains', cal: 330, pro: 4, carb: 58, fat: 9, fib: 1, weight: 150 },
  { name: 'Litti Chokha', cat: 'other', cal: 340, pro: 12, carb: 54, fat: 8, fib: 9, weight: 200 },
  { name: 'Appam (Rice Hopper)', cat: 'grains', cal: 120, pro: 2, carb: 26, fat: 0.5, fib: 1, weight: 60 },
  { name: 'Puttu', cat: 'grains', cal: 280, pro: 5, carb: 58, fat: 4, fib: 4, weight: 150 },
  { name: 'Bisi Bele Bath', cat: 'grains', cal: 310, pro: 9, carb: 48, fat: 10, fib: 6, weight: 200 },
  { name: 'Misal Pav', cat: 'other', cal: 410, pro: 14, carb: 62, fat: 13, fib: 9, weight: 250 },
  { name: 'Akki Roti', cat: 'grains', cal: 160, pro: 3, carb: 32, fat: 2, fib: 2, weight: 60 },
  { name: 'Thalipeeth', cat: 'grains', cal: 180, pro: 6, carb: 28, fat: 5, fib: 5, weight: 70 },
  { name: 'Misi Roti', cat: 'grains', cal: 150, pro: 6, carb: 22, fat: 4, fib: 4, weight: 50 },
  { name: 'Pongal (Ven Pongal)', cat: 'grains', cal: 320, pro: 8, carb: 46, fat: 12, fib: 3, weight: 200 },
  { name: 'Neer Dosa', cat: 'grains', cal: 90, pro: 1.5, carb: 18, fat: 1, fib: 0.5, weight: 50 },
  { name: 'Paniyaram (Kuzhi)', cat: 'snacks', cal: 180, pro: 4, carb: 32, fat: 4, fib: 2, weight: 100 },
  
  // Curries & Meals
  { name: 'Chhole Bhature', cat: 'other', cal: 550, pro: 14, carb: 68, fat: 24, fib: 8, weight: 300 },
  { name: 'Rajma Chawal', cat: 'other', cal: 420, pro: 14, carb: 75, fat: 8, fib: 12, weight: 350 },
  { name: 'Butter Chicken', cat: 'protein', cal: 450, pro: 26, carb: 14, fat: 32, fib: 2, weight: 250 },
  { name: 'Mutton Rogan Josh', cat: 'protein', cal: 410, pro: 28, carb: 10, fat: 28, fib: 1.5, weight: 250 },
  { name: 'Fish Curry', cat: 'protein', cal: 320, pro: 24, carb: 12, fat: 20, fib: 2, weight: 200 },
  { name: 'Baingan Bharta', cat: 'vegetables', cal: 140, pro: 3, carb: 18, fat: 6, fib: 6, weight: 150 },
  { name: 'Bhindi Masala', cat: 'vegetables', cal: 160, pro: 3, carb: 15, fat: 10, fib: 5, weight: 150 },
  { name: 'Aloo Gobi', cat: 'vegetables', cal: 180, pro: 4, carb: 24, fat: 8, fib: 6, weight: 150 },

  // Indian Sweets
  { name: 'Gulab Jamun', cat: 'sweets', cal: 150, pro: 2, carb: 22, fat: 6, fib: 0, weight: 40 },
  { name: 'Rasgulla', cat: 'sweets', cal: 110, pro: 2, carb: 25, fat: 0.5, fib: 0, weight: 40 },
  { name: 'Jalebi', cat: 'sweets', cal: 200, pro: 1, carb: 35, fat: 6, fib: 0, weight: 50 },
  { name: 'Kaju Katli', cat: 'sweets', cal: 140, pro: 3, carb: 12, fat: 9, fib: 0.5, weight: 30 },
  { name: 'Payasam / Kheer', cat: 'sweets', cal: 220, pro: 5, carb: 32, fat: 8, fib: 1, weight: 150 },
  { name: 'Mysore Pak', cat: 'sweets', cal: 240, pro: 2, carb: 20, fat: 17, fib: 0, weight: 40 },
  { name: 'Gajar Ka Halwa', cat: 'sweets', cal: 280, pro: 4, carb: 38, fat: 12, fib: 3, weight: 100 },

  // Added More Varieties
  { name: 'Chicken Tikka Masala', cat: 'protein', cal: 380, pro: 28, carb: 12, fat: 24, fib: 2, weight: 200 },
  { name: 'Paneer Tikka', cat: 'dairy', cal: 260, pro: 16, carb: 8, fat: 18, fib: 2, weight: 150 },
  { name: 'Tandoori Chicken', cat: 'protein', cal: 260, pro: 35, carb: 3, fat: 10, fib: 0.5, weight: 150 },
  { name: 'Garlic Naan', cat: 'grains', cal: 220, pro: 5, carb: 35, fat: 7, fib: 2, weight: 70 },
  { name: 'Butter Naan', cat: 'grains', cal: 240, pro: 4.5, carb: 36, fat: 9, fib: 1.5, weight: 70 },
  { name: 'Poori Bhaji', cat: 'other', cal: 450, pro: 8, carb: 60, fat: 20, fib: 5, weight: 200 },
  { name: 'Uttapam', cat: 'grains', cal: 180, pro: 4, carb: 32, fat: 4, fib: 3, weight: 120 },
  { name: 'Plain Dosa', cat: 'grains', cal: 140, pro: 3, carb: 24, fat: 3.5, fib: 1, weight: 100 },
  { name: 'Medu Vada', cat: 'snacks', cal: 220, pro: 5, carb: 20, fat: 14, fib: 3, weight: 60 },
  { name: 'Pav Bhaji', cat: 'other', cal: 400, pro: 10, carb: 55, fat: 18, fib: 8, weight: 250 },
  { name: 'Hyderabadi Haleem', cat: 'protein', cal: 350, pro: 22, carb: 28, fat: 16, fib: 4, weight: 200 }
];

const sampleFoods = rawFoods.map(item => {
  const factor = 100 / item.weight;
  return {
    name: item.name,
    canonicalName: item.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    category: item.cat,
    servingSize: item.weight,
    servingUnit: 'g',
    isVerified: true,
    nutrition: {
      calories: item.cal,
      protein: item.pro,
      carbs: item.carb,
      fat: item.fat,
      fiber: item.fib
    },
    nutritionPer100g: {
      calories: Math.round(item.cal * factor),
      protein: Math.round(item.pro * factor * 10) / 10,
      carbs: Math.round(item.carb * factor * 10) / 10,
      fat: Math.round(item.fat * factor * 10) / 10,
      fiber: Math.round(item.fib * factor * 10) / 10
    }
  };
});

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
