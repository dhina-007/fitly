const mongoose = require('mongoose');
const User = require('../models/User');
const FoodLog = require('../models/FoodLog');
const FoodItem = require('../models/FoodItem');
const ActivityLog = require('../models/ActivityLog');
const AIConversation = require('../models/AIConversation');
const { calculateNutritionForWeight } = require('./nutritionCalculator');

/**
 * Standard Indian and global household measures conversion table
 */
const HOUSEHOLD_MEASURES = {
  katori: { defaultWeightGrams: 150, unit: 'katori' },
  katoris: { defaultWeightGrams: 150, unit: 'katori' },
  bowl: { defaultWeightGrams: 180, unit: 'bowl' },
  bowls: { defaultWeightGrams: 180, unit: 'bowl' },
  cup: { defaultWeightGrams: 160, unit: 'cup' },
  cups: { defaultWeightGrams: 160, unit: 'cup' },
  glass: { defaultWeightGrams: 240, unit: 'glass' },
  glasses: { defaultWeightGrams: 240, unit: 'glass' },
  tumbler: { defaultWeightGrams: 200, unit: 'tumbler' },
  tumblers: { defaultWeightGrams: 200, unit: 'tumbler' },
  spoon: { defaultWeightGrams: 15, unit: 'spoon' },
  spoons: { defaultWeightGrams: 15, unit: 'spoon' },
  tbsp: { defaultWeightGrams: 15, unit: 'tbsp' },
  tablespoon: { defaultWeightGrams: 15, unit: 'tbsp' },
  tsp: { defaultWeightGrams: 5, unit: 'tsp' },
  teaspoon: { defaultWeightGrams: 5, unit: 'tsp' },
  ladle: { defaultWeightGrams: 80, unit: 'ladle' },
  ladles: { defaultWeightGrams: 80, unit: 'ladle' },
  scoop: { defaultWeightGrams: 32, unit: 'scoop' },
  scoops: { defaultWeightGrams: 32, unit: 'scoop' },
  piece: { defaultWeightGrams: null, unit: 'piece' },
  pieces: { defaultWeightGrams: null, unit: 'piece' },
  slice: { defaultWeightGrams: 30, unit: 'slice' },
  slices: { defaultWeightGrams: 30, unit: 'slice' },
  plate: { defaultWeightGrams: 300, unit: 'plate' },
  plates: { defaultWeightGrams: 300, unit: 'plate' },
  serving: { defaultWeightGrams: null, unit: 'serving' },
  servings: { defaultWeightGrams: null, unit: 'serving' },
  g: { defaultWeightGrams: 1, unit: 'g', isDirectWeight: true },
  gram: { defaultWeightGrams: 1, unit: 'g', isDirectWeight: true },
  grams: { defaultWeightGrams: 1, unit: 'g', isDirectWeight: true },
  gm: { defaultWeightGrams: 1, unit: 'g', isDirectWeight: true },
  gms: { defaultWeightGrams: 1, unit: 'g', isDirectWeight: true },
  kg: { defaultWeightGrams: 1000, unit: 'g', isDirectWeight: true },
  kilo: { defaultWeightGrams: 1000, unit: 'g', isDirectWeight: true },
  kilos: { defaultWeightGrams: 1000, unit: 'g', isDirectWeight: true },
  ml: { defaultWeightGrams: 1, unit: 'ml', isDirectWeight: true },
  l: { defaultWeightGrams: 1000, unit: 'ml', isDirectWeight: true },
  liter: { defaultWeightGrams: 1000, unit: 'ml', isDirectWeight: true },
  liters: { defaultWeightGrams: 1000, unit: 'ml', isDirectWeight: true },
};

const UNIT_PATTERNS = '(?:pieces?|servings?|bowls?|katoris?|cups?|glasses?|tumblers?|plates?|spoons?|tbsp|tablespoons?|tsp|teaspoons?|ladles?|scoops?|slices?|kilos?|kg|kilograms?|grams?|gms?|gm|g|ml|litres?|liters?|l|items?|nos?)';

/**
 * Common culinary aliases mapping directly to canonical database food names
 */
const FOOD_ALIASES = {
  'roti': 'Chapati, whole wheat',
  'rotis': 'Chapati, whole wheat',
  'chapati': 'Chapati, whole wheat',
  'chapatis': 'Chapati, whole wheat',
  'phulka': 'Chapati, whole wheat',
  'phulkas': 'Chapati, whole wheat',
  'dal': 'Dal tadka',
  'daal': 'Dal tadka',
  'curd': 'Curd, plain',
  'dahi': 'Curd, plain',
  'yogurt': 'Curd, plain',
  'yoghurt': 'Curd, plain',
  'rice': 'Basmati rice, cooked',
  'white rice': 'Basmati rice, cooked',
  'steamed rice': 'Basmati rice, cooked',
  'sambar rice': 'Sambar rice',
  'curd rice': 'Curd rice',
  'ghee': 'Desi cow ghee',
  'badam milk': 'Badam milk, sweetened',
  'almond milk': 'Badam milk, sweetened',
  'paneer': 'Paneer, fresh',
  'idli': 'Idli',
  'idlis': 'Idli',
  'dosa': 'Plain dosa',
  'dosas': 'Plain dosa',
  'egg': 'Boiled egg, whole',
  'eggs': 'Boiled egg, whole',
  'chai': 'Tea with milk and sugar',
  'tea': 'Tea with milk and sugar',
  'coffee': 'Filter coffee with milk and sugar',
};

/**
 * Normalizes quantity and unit
 */
function normalizeUnitAndQuantity(rawAmountStr, rawUnitStr) {
  const amount = parseFloat(rawAmountStr) || 1;
  const unit = (rawUnitStr || '').toLowerCase().trim();

  if (['g', 'gram', 'grams', 'gm', 'gms'].includes(unit)) {
    return { quantity: 1, weightGrams: amount, unit: 'g', isWeightOrVolume: true };
  }
  if (['kg', 'kilo', 'kilos', 'kilogram', 'kilograms'].includes(unit)) {
    return { quantity: 1, weightGrams: amount * 1000, unit: 'g', isWeightOrVolume: true };
  }
  if (['ml', 'milliliter', 'milliliters'].includes(unit)) {
    return { quantity: 1, weightGrams: amount, unit: 'ml', isWeightOrVolume: true };
  }
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(unit)) {
    return { quantity: 1, weightGrams: amount * 1000, unit: 'ml', isWeightOrVolume: true };
  }

  if (HOUSEHOLD_MEASURES[unit]) {
    return {
      quantity: amount,
      weightGrams: HOUSEHOLD_MEASURES[unit].defaultWeightGrams ? HOUSEHOLD_MEASURES[unit].defaultWeightGrams * amount : null,
      unit: HOUSEHOLD_MEASURES[unit].unit,
      isWeightOrVolume: false,
    };
  }

  return {
    quantity: amount,
    weightGrams: null,
    unit: unit || 'serving',
    isWeightOrVolume: false,
  };
}

/**
 * Recalculate totals for a FoodLog document
 */
function recalcFoodLogTotals(log) {
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

/**
 * Database food matching
 */
async function findMatchingFoodItem(foodQuery) {
  if (!foodQuery) return null;
  const cleanQuery = foodQuery.trim();
  const lowerQuery = cleanQuery.toLowerCase();

  // 0. Alias check
  if (FOOD_ALIASES[lowerQuery]) {
    const aliasItem = await FoodItem.findOne({
      $or: [
        { canonicalName: new RegExp(`^${FOOD_ALIASES[lowerQuery]}$`, 'i') },
        { name: new RegExp(`^${FOOD_ALIASES[lowerQuery]}$`, 'i') },
        { displayName: new RegExp(`^${FOOD_ALIASES[lowerQuery]}$`, 'i') },
      ],
    }).lean();
    if (aliasItem) return aliasItem;
  }

  // 1. Exact match
  let item = await FoodItem.findOne({
    $or: [
      { canonicalName: new RegExp(`^${cleanQuery}$`, 'i') },
      { name: new RegExp(`^${cleanQuery}$`, 'i') },
      { displayName: new RegExp(`^${cleanQuery}$`, 'i') },
    ],
  }).lean();
  if (item) return item;

  // 2. Transliterations
  item = await FoodItem.findOne({
    transliterations: new RegExp(`^${cleanQuery}$`, 'i'),
  }).lean();
  if (item) return item;

  // 3. Stemmed check
  const stemmed = lowerQuery.replace(/ies$/, 'y').replace(/es$/, '').replace(/s$/, '');
  if (stemmed !== lowerQuery && FOOD_ALIASES[stemmed]) {
    const aliasItem = await FoodItem.findOne({
      $or: [
        { canonicalName: new RegExp(`^${FOOD_ALIASES[stemmed]}$`, 'i') },
        { name: new RegExp(`^${FOOD_ALIASES[stemmed]}$`, 'i') },
      ],
    }).lean();
    if (aliasItem) return aliasItem;
  }

  // 4. Plain <query>
  item = await FoodItem.findOne({
    $or: [
      { name: new RegExp(`^plain\\s+${cleanQuery}`, 'i') },
      { canonicalName: new RegExp(`^plain\\s+${cleanQuery}`, 'i') },
    ],
  }).lean();
  if (item) return item;

  // 5. Compound match (e.g. "rice with sambar" -> "sambar rice")
  const compoundMatch = cleanQuery.match(/^(.+?)\s+(?:with|and|&)\s+(.+)$/i);
  if (compoundMatch) {
    const p1 = compoundMatch[1].trim();
    const p2 = compoundMatch[2].trim();
    for (const cand of [`${p2} ${p1}`, `${p1} ${p2}`, p1, p2]) {
      item = await FoodItem.findOne({
        $or: [
          { canonicalName: new RegExp(`^${cand}$`, 'i') },
          { name: new RegExp(`^${cand}$`, 'i') },
          { displayName: new RegExp(`^${cand}$`, 'i') },
        ],
      }).lean();
      if (item) return item;
    }
  }

  // 6. Fuzzy regex
  item = await FoodItem.findOne({
    $or: [
      { name: new RegExp(cleanQuery, 'i') },
      { canonicalName: new RegExp(cleanQuery, 'i') },
      { displayName: new RegExp(cleanQuery, 'i') },
      { transliterations: new RegExp(cleanQuery, 'i') },
    ],
  }).sort({ verificationStatus: 1, isVerified: -1 }).lean();

  return item;
}

/**
 * RAG Pre-Retrieval
 */
async function getRAGFoodMatches(text) {
  try {
    const rawTokens = text
      .toLowerCase()
      .replace(/\b(please|add|log|track|record|i|had|ate|drank|eaten|for|as|in|to|breakfast|lunch|dinner|snacks?|of|my|with|and|the|a|an)\b/g, ' ')
      .replace(/[0-9]+(\.[0-9]+)?\s*(?:katoris?|bowls?|cups?|glasses?|tumblers?|plates?|spoons?|tbsp|tablespoons?|tsp|teaspoons?|ladles?|scoops?|slices?|kilos?|kg|kilograms?|grams?|gms?|gm|g|ml|litres?|liters?|l|items?|nos?)\b/g, ' ')
      .replace(/[0-9]+/g, ' ')
      .split(/[,+;&]+|\s{2,}/)
      .map(t => t.trim())
      .filter(t => t.length >= 2);

    if (rawTokens.length === 0) return [];

    const searchTerms = [];
    for (const tok of rawTokens) {
      searchTerms.push(tok);
      const stemmed = tok.replace(/ies$/, 'y').replace(/es$/, '').replace(/s$/, '');
      if (stemmed.length >= 2 && stemmed !== tok) searchTerms.push(stemmed);
      if (FOOD_ALIASES[tok]) searchTerms.push(FOOD_ALIASES[tok]);
    }

    const orClauses = searchTerms.map(term => ({
      $or: [
        { canonicalName: new RegExp(`^${term}`, 'i') },
        { canonicalName: new RegExp(term, 'i') },
        { displayName: new RegExp(term, 'i') },
        { name: new RegExp(term, 'i') },
        { transliterations: new RegExp(term, 'i') },
      ]
    }));

    const items = await FoodItem.find({ $or: orClauses.flatMap(c => c.$or) })
      .select('canonicalName displayName servingOptions servingWeightGrams caloriesKcal proteinG carbohydratesG totalFatG fiberG')
      .limit(8)
      .lean();

    return items;
  } catch (err) {
    console.warn('[RAG] Error fetching food matches:', err.message);
    return [];
  }
}

/**
 * Execute tool: search_food_database
 */
async function toolSearchFoodDatabase(query) {
  const matches = await getRAGFoodMatches(query);
  if (matches.length > 0) {
    return matches.map(m => ({
      name: m.canonicalName,
      displayName: m.displayName || m.canonicalName,
      servingWeightGrams: m.servingWeightGrams || 100,
      caloriesKcalPer100g: m.caloriesKcal,
      proteinG: m.proteinG,
      carbsG: m.carbohydratesG,
      fatG: m.totalFatG,
      fiberG: m.fiberG,
      servingOptions: m.servingOptions?.map(s => `${s.name} (${s.weightGrams}g)`) || []
    }));
  }
  const item = await findMatchingFoodItem(query);
  if (item) {
    return [{
      name: item.canonicalName,
      displayName: item.displayName || item.canonicalName,
      servingWeightGrams: item.servingWeightGrams || 100,
      caloriesKcalPer100g: item.caloriesKcal,
      proteinG: item.proteinG,
      carbsG: item.carbohydratesG,
      fatG: item.totalFatG,
      fiberG: item.fiberG,
      servingOptions: item.servingOptions?.map(s => `${s.name} (${s.weightGrams}g)`) || []
    }];
  }
  return { message: `No exact database match found for "${query}". Estimated standard cooked density ~1.3 kcal/g applies.` };
}

/**
 * Execute tool: get_user_progress_and_logs
 */
async function toolGetUserProgressAndLogs(userUid, logDate, userCalorieTarget = 2000, userProteinTarget = 130) {
  const todayFoodLogs = await FoodLog.find({ userId: userUid, date: logDate }).lean();
  const caloriesConsumed = todayFoodLogs.reduce((sum, l) => sum + (l.totalCalories || 0), 0);
  const proteinConsumed = Math.round(todayFoodLogs.reduce((sum, l) => sum + (l.totalProtein || 0), 0) * 10) / 10;
  const carbsConsumed = Math.round(todayFoodLogs.reduce((sum, l) => sum + (l.totalCarbs || 0), 0) * 10) / 10;
  const fatConsumed = Math.round(todayFoodLogs.reduce((sum, l) => sum + (l.totalFat || 0), 0) * 10) / 10;
  const caloriesRemaining = Math.max(0, userCalorieTarget - caloriesConsumed);

  const meals = todayFoodLogs.map(log => ({
    mealType: log.mealType,
    totalCalories: log.totalCalories,
    entries: log.entries.map(e => `${e.quantity}x ${e.servingSize || ''}${e.servingUnit || ''} ${e.foodName} (${e.calories} kcal)`)
  }));

  let activity = null;
  try {
    const act = await ActivityLog.findOne({ userId: userUid, date: logDate }).lean();
    if (act) {
      activity = {
        steps: act.steps || 0,
        waterIntakeMl: act.waterIntakeMl || 0,
        caloriesBurned: act.caloriesBurned || 0,
        workoutSummary: act.workoutSummary || 'None'
      };
    }
  } catch (_) {}

  return {
    date: logDate,
    dailyCalorieTarget: userCalorieTarget,
    dailyProteinTarget: userProteinTarget,
    caloriesConsumed,
    caloriesRemaining,
    macrosConsumed: {
      proteinG: proteinConsumed,
      carbsG: carbsConsumed,
      fatG: fatConsumed,
    },
    mealsLogged: meals,
    activity: activity || { steps: 0, waterIntakeMl: 0, caloriesBurned: 0 }
  };
}

/**
 * Execute tool: log_food_to_tracker
 */
async function toolLogFoodToTracker(userUid, logDate, userCalorieTarget, items, mealType = 'Breakfast') {
  if (!Array.isArray(items) || items.length === 0) return null;

  let foodLog = await FoodLog.findOne({ userId: userUid, date: logDate, mealType });
  if (!foodLog) {
    foodLog = new FoodLog({ userId: userUid, date: logDate, mealType, entries: [] });
  }

  const loggedEntries = [];

  for (const rawItem of items) {
    const foodQuery = rawItem.food || rawItem.name || rawItem.foodName || 'Food';
    const matchedFood = await findMatchingFoodItem(foodQuery);

    let quantity = parseFloat(rawItem.quantity) || 1;
    let unit = (rawItem.unit || 'serving').toLowerCase().trim();
    let servingWeightGrams = 100;
    let calculated = null;
    let foodDisplayName = foodQuery;

    const isDirectWeight = ['g', 'gram', 'grams', 'gm', 'gms', 'kg', 'ml', 'l'].includes(unit) ||
      (rawItem.isWeightOrVolume && !!rawItem.weightGrams);

    if (matchedFood) {
      foodDisplayName = matchedFood.displayName || matchedFood.canonicalName || matchedFood.name;

      if (rawItem.weightGrams && rawItem.weightGrams > 0 && (isDirectWeight || quantity === 1)) {
        servingWeightGrams = rawItem.weightGrams;
        calculated = calculateNutritionForWeight(matchedFood, servingWeightGrams, 1);
        quantity = 1;
        unit = isDirectWeight ? 'g' : unit;
      } else {
        let matchedOption = matchedFood.servingOptions?.find(o => 
          o.name.toLowerCase() === unit ||
          (unit.startsWith('katori') && o.name.toLowerCase().includes('katori')) ||
          (unit.startsWith('bowl') && o.name.toLowerCase().includes('bowl')) ||
          (unit.startsWith('cup') && o.name.toLowerCase().includes('cup')) ||
          (unit.startsWith('glass') && o.name.toLowerCase().includes('glass')) ||
          (unit.startsWith('piece') && o.name.toLowerCase().includes('piece')) ||
          (unit.startsWith('plate') && o.name.toLowerCase().includes('plate')) ||
          (unit.startsWith('serving') && o.name.toLowerCase().includes('serving'))
        );

        if (matchedOption && matchedOption.weightGrams > 0) {
          servingWeightGrams = matchedOption.weightGrams;
          calculated = calculateNutritionForWeight(matchedFood, servingWeightGrams, quantity);
        } else if (HOUSEHOLD_MEASURES[unit]?.defaultWeightGrams) {
          servingWeightGrams = HOUSEHOLD_MEASURES[unit].defaultWeightGrams;
          calculated = calculateNutritionForWeight(matchedFood, servingWeightGrams, quantity);
        } else {
          servingWeightGrams = matchedFood.servingWeightGrams || 100;
          calculated = calculateNutritionForWeight(matchedFood, servingWeightGrams, quantity);
        }
      }
    } else {
      if (rawItem.weightGrams && rawItem.weightGrams > 0) {
        servingWeightGrams = rawItem.weightGrams;
        calculated = {
          calories: rawItem.estimatedCalories || Math.round(servingWeightGrams * 1.3),
          protein: Math.round(servingWeightGrams * 0.04 * 10) / 10,
          carbs: Math.round(servingWeightGrams * 0.22 * 10) / 10,
          fat: Math.round(servingWeightGrams * 0.025 * 10) / 10,
          fiber: Math.round(servingWeightGrams * 0.02 * 10) / 10,
        };
        quantity = 1;
      } else {
        const unitWeight = HOUSEHOLD_MEASURES[unit]?.defaultWeightGrams || 100;
        servingWeightGrams = unitWeight;
        const totalGrams = unitWeight * quantity;
        calculated = {
          calories: rawItem.estimatedCalories || Math.round(totalGrams * 1.3),
          protein: Math.round(totalGrams * 0.04 * 10) / 10,
          carbs: Math.round(totalGrams * 0.22 * 10) / 10,
          fat: Math.round(totalGrams * 0.025 * 10) / 10,
          fiber: Math.round(totalGrams * 0.02 * 10) / 10,
        };
      }
    }

    // Calorie sanity guard per item
    if (calculated.calories > 3500) {
      if (servingWeightGrams > 50) {
        calculated.calories = Math.min(2500, Math.round(servingWeightGrams * 1.3));
      } else {
        calculated.calories = Math.min(2500, Math.round(calculated.calories / 100));
      }
    }

    const newEntry = {
      foodItem: matchedFood ? matchedFood._id : null,
      foodName: foodDisplayName,
      servingSize: servingWeightGrams,
      servingUnit: unit || 'serving',
      quantity,
      calories: calculated.calories,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fat: calculated.fat,
      fiber: calculated.fiber || 0,
    };

    foodLog.entries.push(newEntry);
    loggedEntries.push({
      foodDisplayName,
      quantity,
      servingWeightGrams,
      servingUnit: unit,
      calories: calculated.calories,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fat: calculated.fat,
    });
  }

  recalcFoodLogTotals(foodLog);
  await foodLog.save();

  const allDayLogs = await FoodLog.find({ userId: userUid, date: logDate }).lean();
  const totalCaloriesToday = allDayLogs.reduce((sum, l) => sum + (l.totalCalories || 0), 0);
  const remainingCalories = Math.max(0, (userCalorieTarget || 2000) - totalCaloriesToday);

  const batchCalories = loggedEntries.reduce((sum, e) => sum + e.calories, 0);
  const batchProtein = Math.round(loggedEntries.reduce((sum, e) => sum + e.protein, 0) * 10) / 10;
  const batchCarbs = Math.round(loggedEntries.reduce((sum, e) => sum + e.carbs, 0) * 10) / 10;
  const batchFat = Math.round(loggedEntries.reduce((sum, e) => sum + e.fat, 0) * 10) / 10;

  return {
    itemCount: loggedEntries.length,
    items: loggedEntries,
    foodDisplayName: loggedEntries.length === 1 ? loggedEntries[0].foodDisplayName : `${loggedEntries.length} items (${loggedEntries.map(i => i.foodDisplayName).join(', ')})`,
    quantity: loggedEntries.length === 1 ? loggedEntries[0].quantity : loggedEntries.length,
    servingWeightGrams: loggedEntries.length === 1 ? loggedEntries[0].servingWeightGrams : null,
    servingUnit: loggedEntries.length === 1 ? loggedEntries[0].servingUnit : 'items',
    calories: batchCalories,
    protein: batchProtein,
    carbs: batchCarbs,
    fat: batchFat,
    mealType,
    date: logDate,
    totalCaloriesToday,
    remainingCalories,
    summaryTitle: loggedEntries.length === 1
      ? `Added to ${mealType} (${batchCalories} kcal)`
      : `Added ${loggedEntries.length} items to ${mealType} (${batchCalories} kcal)`,
  };
}

/**
 * Conversation Memory Manager
 */
async function getOrCreateConversation(userId) {
  let conv = await AIConversation.findOne({ userId }).sort({ lastMessageAt: -1 });
  if (!conv) {
    conv = new AIConversation({
      userId,
      title: 'Fitness Coaching Session',
      messages: []
    });
    await conv.save();
  }
  return conv;
}

async function appendUserMessage(conv, content) {
  conv.messages.push({
    role: 'user',
    content,
    timestamp: new Date()
  });
  conv.lastMessageAt = new Date();
  await conv.save();
}

async function appendAssistantMessage(conv, content, action = null, loggedEntry = null, toolCalls = []) {
  conv.messages.push({
    role: 'assistant',
    content,
    action,
    loggedEntry,
    toolCalls,
    timestamp: new Date()
  });
  conv.lastMessageAt = new Date();
  await conv.save();
}

/**
 * Groq completions call helper
 */
async function callGroq(messages, maxTokens = 600) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const candidateModels = [
    process.env.GROQ_MODEL,
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
  ].filter(Boolean);

  for (const model of candidateModels) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.2,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        console.warn(`[Groq] Model ${model} returned HTTP ${resp.status}:`, errJson?.error?.message || resp.statusText);
        continue;
      }

      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && typeof content === 'string' && content.trim().length > 0) {
        return { content: content.trim(), modelUsed: model };
      }
    } catch (err) {
      console.warn(`[Groq] Network/fetch error with model ${model}:`, err.message);
    }
  }

  return null;
}

module.exports = {
  findMatchingFoodItem,
  getRAGFoodMatches,
  toolSearchFoodDatabase,
  toolGetUserProgressAndLogs,
  toolLogFoodToTracker,
  getOrCreateConversation,
  appendUserMessage,
  appendAssistantMessage,
  callGroq,
  normalizeUnitAndQuantity,
  HOUSEHOLD_MEASURES,
  UNIT_PATTERNS,
  FOOD_ALIASES,
};
