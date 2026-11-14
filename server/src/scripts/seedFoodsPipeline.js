const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FoodItem = require('../models/FoodItem');

/**
 * Validates a food record before inserting or updating.
 */
function validateFoodRecord(food) {
  const errors = [];

  if (!food.canonicalName && !food.name) {
    errors.push('Missing canonicalName or name');
  }
  if (!food.category) {
    errors.push('Missing category');
  }

  // Check nutrient bounds if present
  if (food.caloriesKcal !== null && food.caloriesKcal < 0) errors.push('Negative caloriesKcal');
  if (food.proteinG !== null && food.proteinG < 0) errors.push('Negative proteinG');
  if (food.carbohydratesG !== null && food.carbohydratesG < 0) errors.push('Negative carbohydratesG');
  if (food.totalFatG !== null && food.totalFatG < 0) errors.push('Negative totalFatG');

  // Check plausible per-100g energy (cannot exceed ~900 kcal/100g pure fat)
  if (food.caloriesKcal > 900) errors.push('Plausibility error: caloriesKcal > 900 per 100g');

  return errors;
}

async function runSeedingPipeline(options = {}) {
  const shouldDisconnect = options.disconnect !== false;
  console.log('=====================================================');
  console.log('  HealthFit — Indian Food Database Seeding Pipeline  ');
  console.log('=====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthfit';
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
  }

  const datasetPath = path.join(__dirname, 'data/indian_foods_seed_dataset.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`Error: Seed file not found at ${datasetPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(datasetPath, 'utf8');
  const dataset = JSON.parse(rawData);

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let validationErrorsCount = 0;

  for (const item of dataset) {
    const errors = validateFoodRecord(item);
    if (errors.length > 0) {
      console.warn(`[VALIDATION WARN] Skipping "${item.canonicalName || item.name}": ${errors.join(', ')}`);
      validationErrorsCount++;
      skippedCount++;
      continue;
    }

    const canonicalName = item.canonicalName || item.name;
    const foodId = item.foodId || `FOOD-${canonicalName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    // Clean up any legacy duplicates with the same canonicalName or name lacking foodId
    await FoodItem.deleteMany({
      _id: { $ne: null },
      foodId: { $exists: false },
      $or: [
        { canonicalName: { $regex: new RegExp(`^${canonicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { name: { $regex: new RegExp(`^${canonicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });

    // Look for existing record by foodId or canonicalName
    const existing = await FoodItem.findOne({
      $or: [
        { foodId },
        { canonicalName: { $regex: new RegExp(`^${canonicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });

    const updatePayload = {
      ...item,
      foodId,
      canonicalName,
      name: item.name || canonicalName,
      displayName: item.displayName || item.name || canonicalName,
      updatedAt: new Date(),
    };

    if (existing) {
      await FoodItem.updateOne({ _id: existing._id }, { $set: updatePayload });
      updatedCount++;
    } else {
      await FoodItem.create({
        ...updatePayload,
        createdAt: new Date(),
      });
      insertedCount++;
    }
  }


  const totalInDB = await FoodItem.countDocuments();

  console.log('\n--- SEEDING PIPELINE SUMMARY ---');
  console.log(`Total Dataset Records Processed: ${dataset.length}`);
  console.log(`Newly Inserted: ${insertedCount}`);
  console.log(`Updated Existing: ${updatedCount}`);
  console.log(`Skipped / Validation Failed: ${skippedCount}`);
  console.log(`Total Valid Food Records in Database: ${totalInDB}`);
  console.log('-----------------------------------------------------\n');

  if (shouldDisconnect) {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB. Seeding completed successfully.');
  }
}


if (require.main === module) {
  runSeedingPipeline().catch(err => {
    console.error('Fatal error during seeding pipeline:', err);
    process.exit(1);
  });
}

module.exports = { runSeedingPipeline, validateFoodRecord };
