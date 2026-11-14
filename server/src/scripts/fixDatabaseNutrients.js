const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FoodItem = require('../models/FoodItem');

async function fixDatabaseNutrients() {
  console.log('=====================================================');
  console.log('  HealthFit — Database Nutrient Repair & Enrichment  ');
  console.log('=====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthfit';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const allFoods = await FoodItem.find({});
  console.log(`Found ${allFoods.length} total food records in database.`);

  let updatedCount = 0;

  for (const food of allFoods) {
    let changed = false;

    // Determine base nutrition values from all potential field locations
    const cal = food.caloriesKcal ?? food.nutritionPer100g?.calories ?? food.nutrition?.calories ?? 0;
    const pro = food.proteinG ?? food.nutritionPer100g?.protein ?? food.nutrition?.protein ?? 0;
    const carb = food.carbohydratesG ?? food.nutritionPer100g?.carbs ?? food.nutrition?.carbs ?? 0;
    const fat = food.totalFatG ?? food.nutritionPer100g?.fat ?? food.nutrition?.fat ?? 0;
    const fib = food.fiberG ?? food.nutritionPer100g?.fiber ?? food.nutrition?.fiber ?? 0;

    if (food.caloriesKcal === null || food.caloriesKcal === undefined) {
      food.caloriesKcal = cal;
      changed = true;
    }
    if (food.proteinG === null || food.proteinG === undefined) {
      food.proteinG = pro;
      changed = true;
    }
    if (food.carbohydratesG === null || food.carbohydratesG === undefined) {
      food.carbohydratesG = carb;
      changed = true;
    }
    if (food.totalFatG === null || food.totalFatG === undefined) {
      food.totalFatG = fat;
      changed = true;
    }
    if (food.fiberG === null || food.fiberG === undefined) {
      food.fiberG = fib;
      changed = true;
    }

    if (!food.canonicalName && food.name) {
      food.canonicalName = food.name;
      changed = true;
    }

    if (!food.displayName && food.canonicalName) {
      food.displayName = food.canonicalName;
      changed = true;
    }

    if (!food.servingOptions || food.servingOptions.length === 0) {
      const weight = food.servingWeightGrams || food.servingSize || 100;
      const unit = food.servingUnit || 'g';
      food.servingOptions = [{
        name: unit === 'g' ? 'Gram' : unit,
        weightGrams: weight,
        description: `${weight}${unit}`,
        isDefault: true
      }];
      changed = true;
    }

    if (changed) {
      await food.save();
      updatedCount++;
    }
  }

  console.log(`\nSuccessfully updated & enriched ${updatedCount} food records in MongoDB.`);
  await mongoose.disconnect();
  console.log('Done.');
}

fixDatabaseNutrients().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
