const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FoodItem = require('../models/FoodItem');
const FoodLog = require('../models/FoodLog');
const { calculateNutritionForWeight, calculateNutritionForServingOption } = require('../services/nutritionCalculator');
const { calculateRecipeNutrition } = require('../services/recipeCalculator');

describe('Food Database & Nutrition Calculator Tests', () => {
  before(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthfit';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  after(async () => {
    await mongoose.disconnect();
  });

  it('Food items exist in database', async () => {
    const count = await FoodItem.countDocuments();
    assert(count > 0, 'Food items count must be > 0');
  });

  it('Serving Size Math Conversions scale idli calories accurately by weight', async () => {
    const testIdli = await FoodItem.findOne({ foodId: 'XLS-004' }) || await FoodItem.findOne({ name: /^idli$/i });
    assert(testIdli, 'Idli food item must exist');

    const base100 = testIdli.caloriesKcal ?? testIdli.nutritionPer100g?.calories;
    // 1 serving (40g Excel idli) -> 58 kcal
    const idliServing = calculateNutritionForWeight(testIdli, testIdli.servingWeightGrams || 40, 1);
    assert.strictEqual(idliServing.calories, Math.round(base100 * ((testIdli.servingWeightGrams || 40) / 100)));

    // 2 x 50g (100g) -> base per-100g kcal
    const idli100g = calculateNutritionForWeight(testIdli, 50, 2);
    assert.strictEqual(idli100g.calories, Math.round(base100));
  });

  it('Transliteration & regional search terms match canonical foods', async () => {
    const testCases = [
      { search: 'idli', expectedPattern: /idli/i },
      { search: 'dosa', expectedPattern: /dosa/i },
      { search: 'biryani', expectedPattern: /biryani/i }
    ];

    for (const tc of testCases) {
      const regexPattern = new RegExp(tc.search, 'i');
      const found = await FoodItem.findOne({
        $or: [
          { canonicalName: regexPattern },
          { displayName: regexPattern },
          { name: regexPattern },
          { transliterations: regexPattern },
          { alternateNames: regexPattern },
          { 'regionalNames.ta': regexPattern }
        ]
      });
      assert(found, `Search term "${tc.search}" must match a record`);
    }
  });

  it('Custom recipe nutrition calculator correctly yields per serving metrics', async () => {
    const rice = await FoodItem.findOne({ name: /rice/i });
    const sambar = await FoodItem.findOne({ name: /sambar/i });
    assert(rice, 'Rice food item must exist');
    assert(sambar, 'Sambar food item must exist');

    const recipeResult = calculateRecipeNutrition(
      [
        { foodItem: rice, weightGrams: 200 },
        { foodItem: sambar, weightGrams: 150 }
      ],
      350,
      2
    );

    assert(recipeResult.perServing.calories > 0, 'Calories must be > 0');
    assert.strictEqual(recipeResult.numberOfServings, 2);
  });

  it('Food journal logging calculates total calories accurately', async () => {
    const testUid = 'test-user-node-test-123';
    const testDate = '2026-10-12';

    await FoodLog.deleteMany({ userId: testUid });

    const idliFood = await FoodItem.findOne({ foodId: 'XLS-004' }) || await FoodItem.findOne({ name: /^idli$/i });
    assert(idliFood, 'Idli must exist');

    const base100 = Math.round(idliFood.caloriesKcal ?? idliFood.nutritionPer100g?.calories);
    const entryCal = calculateNutritionForWeight(idliFood, 50, 2);

    const newLog = await FoodLog.create({
      userId: testUid,
      date: testDate,
      mealType: 'Breakfast',
      entries: [{
        foodItem: idliFood._id,
        foodName: idliFood.name,
        servingSize: 50,
        servingUnit: 'Piece',
        quantity: 2,
        calories: entryCal.calories,
        protein: entryCal.protein,
        carbs: entryCal.carbs,
        fat: entryCal.fat,
        fiber: entryCal.fiber
      }],
      totalCalories: entryCal.calories,
      totalProtein: entryCal.protein,
      totalCarbs: entryCal.carbs,
      totalFat: entryCal.fat,
      totalFiber: entryCal.fiber
    });

    assert.strictEqual(newLog.totalCalories, base100);

    // Clean up
    await FoodLog.deleteMany({ userId: testUid });
  });

  it('All 269 Excel Indian food entries exist with zero duplicate food names', async () => {
    const xlsCount = await FoodItem.countDocuments({ foodId: /^XLS-/ });
    assert.strictEqual(xlsCount, 269);

    const allFoods = await FoodItem.find({}, 'name').lean();
    const seen = new Set();
    const dups = [];
    for (const f of allFoods) {
      const norm = (f.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(norm)) dups.push(f.name);
      seen.add(norm);
    }
    assert.deepStrictEqual(dups, [], `Duplicate food names found: ${dups.join(', ')}`);

    const whiteRice = await FoodItem.findOne({ foodId: 'XLS-001' });
    assert(whiteRice, 'XLS-001 White rice, cooked must exist');
    const riceCup = calculateNutritionForWeight(whiteRice, whiteRice.servingWeightGrams, 1);
    assert(Math.abs(riceCup.calories - 205) <= 1, `Expected ~205 kcal, got ${riceCup.calories}`);

    const proteinShake = await FoodItem.findOne({ foodId: 'XLS-269' });
    assert(proteinShake, 'XLS-269 Protein shake, prepared with water must exist');
    const shakeServing = calculateNutritionForWeight(proteinShake, proteinShake.servingWeightGrams, 1);
    assert(Math.abs(shakeServing.calories - 120) <= 1, `Expected ~120 kcal, got ${shakeServing.calories}`);
  });
});
