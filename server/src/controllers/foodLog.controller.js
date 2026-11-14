const mongoose = require('mongoose');
const FoodLog = require('../models/FoodLog');
const FoodItem = require('../models/FoodItem');
const { calculateNutritionForWeight } = require('../services/nutritionCalculator');

function recalcTotals(log) {
  const totals = log.entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein: acc.protein + (e.protein || 0),
    carbs: acc.carbs + (e.carbs || 0),
    fat: acc.fat + (e.fat || 0),
    fiber: acc.fiber + (e.fiber || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  
  log.totalCalories = Math.round(totals.calories);
  log.totalProtein = Math.round(totals.protein * 10) / 10;
  log.totalCarbs = Math.round(totals.carbs * 10) / 10;
  log.totalFat = Math.round(totals.fat * 10) / 10;
  log.totalFiber = Math.round(totals.fiber * 10) / 10;
}

async function getDayLog(req, res, next) {
  try {
    const { date } = req.params;
    const uid = req.user.uid;

    const logs = await FoodLog.find({ userId: uid, date })
      .populate('entries.foodItem', 'canonicalName displayName name image category servingOptions')
      .lean();

    // Aggregate daily totals
    const dailyTotals = logs.reduce((acc, log) => ({
      calories: acc.calories + log.totalCalories,
      protein: acc.protein + log.totalProtein,
      carbs: acc.carbs + log.totalCarbs,
      fat: acc.fat + log.totalFat,
      fiber: acc.fiber + log.totalFiber,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    res.json({ success: true, data: { logs, dailyTotals } });
  } catch (err) {
    next(err);
  }
}

async function addFoodEntry(req, res, next) {
  try {
    const uid = req.user.uid;
    const {
      date,
      mealType,
      foodItemId,
      foodItem,
      servingSize,
      servingUnit,
      quantity = 1,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      caloriesIsTotal = false,
    } = req.body;

    let targetFoodId = foodItemId || foodItem;
    let targetFood = null;

    if (targetFoodId && mongoose.Types.ObjectId.isValid(targetFoodId)) {
      targetFood = await FoodItem.findById(targetFoodId);
    }

    let calculated;
    const actualQuantity = parseFloat(quantity) || 1;
    const actualServingWeight = parseFloat(servingSize) || targetFood?.servingWeightGrams || 100;

    if (targetFood) {
      calculated = calculateNutritionForWeight(targetFood, actualServingWeight, actualQuantity);
    } else {
      const mult = caloriesIsTotal ? 1 : actualQuantity;
      // Fallback for custom entries sent directly from client
      calculated = {
        calories: Math.round((parseFloat(calories) || 0) * mult),
        protein: Math.round((parseFloat(protein) || 0) * mult * 10) / 10,
        carbs: Math.round((parseFloat(carbs) || 0) * mult * 10) / 10,
        fat: Math.round((parseFloat(fat) || 0) * mult * 10) / 10,
        fiber: Math.round((parseFloat(fiber) || 0) * mult * 10) / 10,
      };
    }

    const entry = {
      foodItem: targetFood ? targetFood._id : null,
      foodName: targetFood
        ? (targetFood.displayName || targetFood.canonicalName || targetFood.name)
        : (req.body.foodName || req.body.name || 'Custom Food'),
      servingSize: actualServingWeight,
      servingUnit: servingUnit || targetFood?.servingUnit || 'g',
      quantity: actualQuantity,
      calories: calculated.calories,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fat: calculated.fat,
      fiber: calculated.fiber || 0,
    };

    // Normalize mealType capitalization (e.g. 'breakfast' -> 'Breakfast')
    const formattedMealType = mealType ? (mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase()) : 'Breakfast';

    let log = await FoodLog.findOne({ userId: uid, date, mealType: formattedMealType });
    if (!log) {
      log = new FoodLog({ userId: uid, date, mealType: formattedMealType, entries: [] });
    }

    log.entries.push(entry);
    recalcTotals(log);
    await log.save();

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

async function deleteFoodEntry(req, res, next) {
  try {
    const uid = req.user.uid;
    const { logId, entryId } = req.params;

    const log = await FoodLog.findOne({ _id: logId, userId: uid });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });

    log.entries = log.entries.filter(e => e._id.toString() !== entryId);
    recalcTotals(log);
    await log.save();

    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDayLog, addFoodEntry, deleteFoodEntry };

