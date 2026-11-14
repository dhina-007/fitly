const mongoose = require('mongoose');
const User = require('../models/User');
const FoodLog = require('../models/FoodLog');
const FoodItem = require('../models/FoodItem');
const SleepLog = require('../models/SleepLog');
const ActivityLog = require('../models/ActivityLog');
const AIConversation = require('../models/AIConversation');
const { calculateNutritionForWeight } = require('../services/nutritionCalculator');
const {
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
} = require('../services/riaCoach.service');

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
 * Natural language intent parser for food tracking commands
 * Supports single foods and multi-item combos (e.g. "2 roti, 1 bowl dal, and curd for lunch")
 */
function parseFoodSubItem(rawPart) {
  const cleanPart = rawPart.replace(/^(and|\+|,)\s*/i, '').trim();
  const m = cleanPart.match(new RegExp('^(\\d+(?:\\.\\d+)?)\\s*(' + UNIT_PATTERNS + ')?\\s+(?:of\\s+)?(.+)', 'i'));
  if (m) {
    const norm = normalizeUnitAndQuantity(m[1], m[2]);
    return {
      food: m[3].trim(),
      quantity: norm.quantity,
      unit: norm.unit,
      weightGrams: norm.weightGrams,
      isWeightOrVolume: norm.isWeightOrVolume,
    };
  }
  return {
    food: cleanPart,
    quantity: 1,
    unit: 'serving',
    weightGrams: null,
    isWeightOrVolume: false,
  };
}

function parseFoodLoggingIntent(text) {
  if (!text || typeof text !== 'string') return null;

  let target = text.trim();
  if (target.includes('User says:')) {
    target = target.split('User says:')[1].trim();
  }

  // If text is a question, it is NEVER a food logging command
  if (/^(how|what|why|when|where|which|who|can|is|are|does|should|could|would)\b/i.test(target) || target.endsWith('?')) {
    return null;
  }

  // Remove trailing punctuations
  target = target.replace(/[.!?]+$/, '').trim();

  // Meal suffix check (as/for/in/to breakfast|lunch|dinner|snack)
  const mealMatch = target.match(/\s+(?:as|for|in|to)\s+(breakfast|lunch|dinner|snacks?)$/i);
  let mealType = null;
  let foodPortionText = target;
  if (mealMatch) {
    const rawMeal = mealMatch[1].toLowerCase();
    mealType = rawMeal.startsWith('snack') ? 'Snacks' : rawMeal.charAt(0).toUpperCase() + rawMeal.slice(1);
    foodPortionText = target.slice(0, mealMatch.index).trim();
  } else {
    // Prefix check: breakfast: ...
    const prefixMatch = target.match(/^(breakfast|lunch|dinner|snacks?)[:\-]\s*(.+)/i);
    if (prefixMatch) {
      const rawMeal = prefixMatch[1].toLowerCase();
      mealType = rawMeal.startsWith('snack') ? 'Snacks' : rawMeal.charAt(0).toUpperCase() + rawMeal.slice(1);
      foodPortionText = prefixMatch[2].trim();
    }
  }

  const hasLoggingVerb = /^(?:please\s+)?(?:add|track|log|record|i\s+had|i\s+ate|had|ate|drank|consumed)\b/i.test(foodPortionText);

  // Must have EITHER an explicit meal indicator OR an explicit logging verb!
  if (!mealMatch && !mealType && !hasLoggingVerb) {
    return null;
  }

  mealType = mealType || 'Breakfast';

  // Strip leading action verbs (add, track, log, record, ate, had, drank)
  foodPortionText = foodPortionText.replace(/^(?:please\s+)?(?:add|track|log|record|i\s+had|i\s+ate|had|ate|drank|consumed)\s+/i, '').trim();

  // Multi-item combo split: e.g. "2 roti, 1 bowl dal, and curd" or "2 dosa and 1 cup chai"
  const parts = foodPortionText.split(/,\s*|\s+and\s+|\s*\+\s*/i).filter(p => p.trim().length > 0);
  if (parts.length > 1) {
    const items = parts.map(p => ({
      ...parseFoodSubItem(p),
      mealType,
    }));
    return {
      isMultiItem: true,
      items,
      mealType,
      originalCommand: target,
    };
  }

  // Single item parsing
  const sub = parseFoodSubItem(foodPortionText);
  return {
    isMultiItem: false,
    items: [{ ...sub, mealType }],
    quantity: sub.quantity,
    weightGrams: sub.weightGrams,
    unit: sub.unit,
    isWeightOrVolume: sub.isWeightOrVolume,
    foodQuery: sub.food,
    mealType,
    originalCommand: target,
  };
}

/**
 * Call Groq chat completions with fallback across candidate models
 */
async function callGroqChat(messages, maxTokens = 600) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const candidateModels = [
    process.env.GROQ_MODEL,
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'qwen/qwen3.8-27b',
  ].filter(Boolean);
  const uniqueModels = [...new Set(candidateModels.filter(Boolean))];

  for (const model of uniqueModels) {
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
          temperature: 0.3,
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
        return {
          content: content.trim(),
          modelUsed: model,
        };
      }
    } catch (err) {
      console.warn(`[Groq] Network/fetch error with model ${model}:`, err.message);
    }
  }

  return null;
}

/**
 * Batch multi-item logger for FoodLog
 */
async function logFoodsBatchToTracker(userUid, logDate, userCalorieTarget, items, defaultMealType = 'Breakfast') {
  if (!Array.isArray(items) || items.length === 0) return null;

  const mealType = items[0]?.mealType || defaultMealType;

  let foodLog = await FoodLog.findOne({
    userId: userUid,
    date: logDate,
    mealType,
  });

  if (!foodLog) {
    foodLog = new FoodLog({
      userId: userUid,
      date: logDate,
      mealType,
      entries: [],
    });
  }

  const loggedEntries = [];

  for (const rawItem of items) {
    const foodQuery = rawItem.food || rawItem.name || rawItem.foodQuery || 'Food';
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
        // Resolve using servingOptions or household measures
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
      // Unmatched fallback with realistic nutrition density (~1.2 - 1.4 kcal/g)
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
 * Backwards compatibility wrapper for single food logging
 */
async function logFoodToTracker(userUid, logDate, userCalorieTarget, foodQuery, quantity = 1, mealType = 'Breakfast', options = {}) {
  const batchRes = await logFoodsBatchToTracker(userUid, logDate, userCalorieTarget, [{
    food: foodQuery,
    quantity,
    unit: options.unit || (options.isWeightOrVolume ? 'g' : 'serving'),
    weightGrams: options.weightGrams,
    isWeightOrVolume: options.isWeightOrVolume,
    mealType,
    estimatedCalories: options.estimatedCalories,
    protein: options.protein,
    carbs: options.carbs,
    fat: options.fat,
    fiber: options.fiber,
  }], mealType);

  return batchRes;
}

/**
 * Ria AI Health Coach controller - Purely prompt-based with Groq LLM + rule-engine backup
 */
exports.chatWithRia = async (req, res, next) => {
  try {
    const { message, context, date } = req.body;
    const userId = req.user?._id;
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).lean();
    }
    if (!user && req.user?.uid) {
      user = await User.findOne({ firebaseUid: req.user.uid }).lean();
    }
    user = user || { name: req.user?.name || 'there', fitnessGoal: 'general health', calorieTarget: 2000 };

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userUid = req.user?.uid || user?.firebaseUid || user?._id?.toString() || 'dev-user-uid-12345';
    const logDate = date || new Date().toISOString().split('T')[0];
    const userPrompt = message.includes('User says:') ? message.split('User says:')[1].trim() : message.trim();

    let reply = '';
    let aiModelUsed = null;
    let foodLoggingResult = null;

    // Fetch user's live daily nutrition and progress
    const todayFoodLogs = await FoodLog.find({ userId: userUid, date: logDate }).lean();
    const caloriesConsumed = todayFoodLogs.reduce((sum, l) => sum + (l.totalCalories || 0), 0);
    const proteinConsumed = Math.round(todayFoodLogs.reduce((sum, l) => sum + (l.totalProtein || 0), 0) * 10) / 10;
    const carbsConsumed = Math.round(todayFoodLogs.reduce((sum, l) => sum + (l.totalCarbs || 0), 0) * 10) / 10;
    const fatConsumed = Math.round(todayFoodLogs.reduce((sum, l) => sum + (l.totalFat || 0), 0) * 10) / 10;
    const calorieTarget = user.calorieTarget || 2000;
    const caloriesRemaining = Math.max(0, calorieTarget - caloriesConsumed);
    const proteinTarget = user.proteinTarget || Math.round((user.currentWeight || 70) * 1.6) || 130;

    let stepsToday = 0;
    let waterIntake = '0 ml';
    let workoutSummary = 'None logged yet';
    try {
      const todayActivity = await ActivityLog.findOne({ userId: userUid, date: logDate }).lean();
      if (todayActivity) {
        stepsToday = todayActivity.steps || 0;
        waterIntake = todayActivity.waterIntakeMl ? `${todayActivity.waterIntakeMl} ml` : '0 ml';
        workoutSummary = todayActivity.workoutSummary || (todayActivity.caloriesBurned ? `${todayActivity.caloriesBurned} kcal burned` : 'None logged yet');
      }
    } catch (_) {}

    // Format itemized breakdown of today's logged meals for rich context
    const mealsSummaryLines = todayFoodLogs.map(l => {
      const itemsList = l.entries.map(e => `${e.quantity}x ${e.servingSize || ''}${e.servingUnit || ''} ${e.foodName} (${e.calories} kcal)`).join(', ');
      return `- ${l.mealType} (${l.totalCalories} kcal): ${itemsList || 'None'}`;
    }).join('\n');

    const userProfileContext = `
<USER_PROFILE>
Name: ${user.name || 'Friend'}
Age: ${user.age || 'Not specified'}
Gender: ${user.gender || 'Not specified'}
Height: ${user.height ? `${user.height} cm` : 'Not specified'}
Current Weight: ${user.currentWeight ? `${user.currentWeight} kg` : 'Not specified'}
Target Weight: ${user.targetWeight ? `${user.targetWeight} kg` : 'Not specified'}
Activity Level: ${user.activityLevel || 'moderately_active'}
Fitness Goal: ${user.fitnessGoal || 'general health'}
Diet Preference: ${user.dietPreference || user.dietaryPreference || 'Non-Vegetarian'}
Food Allergies: ${Array.isArray(user.allergies) && user.allergies.length ? user.allergies.join(', ') : 'None'}
Daily Calorie Target: ${calorieTarget}
Daily Protein Target: ${proteinTarget}
</USER_PROFILE>

<DAILY_PROGRESS>
Today's Calories: ${caloriesConsumed} kcal
Calories Remaining: ${caloriesRemaining} kcal
Protein Consumed: ${proteinConsumed} g
Carbs Consumed: ${carbsConsumed} g
Fat Consumed: ${fatConsumed} g
Water Intake: ${waterIntake}
Steps: ${stepsToday}
Workout: ${workoutSummary}

Meals Logged Today:
${mealsSummaryLines || 'None logged yet'}
</DAILY_PROGRESS>`;

    // Conversation Memory: Load active session and append user message
    const conversation = await getOrCreateConversation(userUid);
    await appendUserMessage(conversation, userPrompt);

    // 1. Fetch RAG database matches for verified ground-truth nutrition
    const ragMatches = await getRAGFoodMatches(userPrompt);
    let ragGroundingSection = '';
    if (ragMatches.length > 0) {
      ragGroundingSection = '\nVERIFIED FOOD DATABASE MATCHES (use these exact names and typical portions if applicable):\n' +
        ragMatches.map(m => `- "${m.canonicalName}" | Standard portion: ${m.servingWeightGrams || 100}g | ${m.caloriesKcal || 120} kcal/100g`).join('\n') + '\n';
    }

    // 2. Prompt Groq LLM with full Official Ria AI Coach System Prompt + RAG + Multi-item tracking
    if (process.env.GROQ_API_KEY) {
      const systemPrompt = `# RIA AI COACH — SYSTEM PROMPT

## 1. Identity and Role
You are Ria, the intelligent personal health, nutrition and fitness coach inside Fitly.
You are a knowledgeable, friendly, evidence-based AI coach with expertise in:
- Sports nutrition and diet planning
- Weight loss and fat loss
- Muscle building and body recomposition
- Indian food nutrition
- Calorie and macronutrient calculations
- Strength training and cardio
- Sleep, hydration and recovery
- Healthy lifestyle habits

Your purpose is to help users achieve sustainable health and fitness goals through accurate information, personalized recommendations and practical guidance.
You are not a generic chatbot. You are a personal coach who understands the user's profile, progress, habits and goals.

## 2. User Context
${userProfileContext}

### Context rules:
- Use the available profile information to personalize answers.
- Never ask for information that is already available.
- Never invent missing profile information.
- If relevant information is missing, ask only the necessary follow-up question.
- Do not assume that today's progress represents the user's usual habits.
- Clearly distinguish between user-provided information and calculated estimates.

## 3. Accuracy and Evidence Rules
Accuracy is more important than sounding confident.
1. Never fabricate nutrition facts, scientific studies, medical advice or statistics.
2. Use realistic nutritional estimates based on recognized food composition references.
3. Prefer ICMR-NIN and Indian Food Composition Tables for Indian food where applicable.
4. Clearly mention when a value is approximate.
5. Distinguish raw weight from cooked weight.
6. Distinguish edible food weight from total serving weight.
7. Never assume all versions of a food have identical nutritional values.
8. Account for oil, ghee, sugar, sauces and cooking methods when estimating calories.
9. If multiple interpretations of a question are possible, clarify rather than guessing.
10. Never agree with a user's incorrect health or nutrition assumption simply to be supportive.
When uncertain, say so honestly.

## 4. Nutrition and Calorie Intelligence
When users ask about food nutrition, provide the following where relevant (using a clean markdown table):
- Calories (kcal)
- Protein (g)
- Carbohydrates (g)
- Fat (g)
- Fibre (g)

Nutrition calculation rules:
- Show serving size clearly.
- Use grams wherever possible.
- For Indian dishes, consider typical recipes and cooking oil.
- If the quantity is unclear, ask whether the user means raw or cooked weight.
- Never provide false precision.
- For food comparisons, compare equivalent serving sizes.

## 5. Weight Loss and Fat Loss Coaching
- Explain calorie deficit in simple language.
- Focus on sustainable fat loss rather than rapid weight reduction.
- Encourage sufficient protein and fibre.
- Recommend resistance training and regular physical activity.
- Avoid extreme calorie restriction.
- Do not promise specific weight-loss results.
- Explain that daily weight fluctuations are normal.
- Consider adherence, sleep, recovery and consistency.
Do not recommend crash diets, starvation or dehydration.

## 6. Muscle Building and Workout Coaching
- Consider the user's experience and fitness level.
- Recommend progressive overload where appropriate.
- Include recovery and rest days.
- Explain correct exercise techniques.
- Offer beginner-friendly alternatives.
- Avoid recommending excessive training volume.
- Do not assume gym access.
- Distinguish strength gains from muscle growth.
Never encourage users to train through serious pain or injury.

## 7. Indian Food Intelligence
Strong knowledge of common Indian foods:
- South Indian foods: Idli, dosa, chapati, parotta, pongal, upma, sambar, rasam, curd rice, lemon rice, coconut chutney, rice, sundal, puttu, appam, idiyappam.
- Protein sources: Eggs, chicken, fish, paneer, tofu, soya chunks, milk, curd, Greek yogurt, dal, chickpeas, peanuts and other legumes.
- North Indian foods: Roti, naan, dal, rajma, chole, paneer dishes, khichdi, pulao, biryani.
Understand that Indian meals vary significantly by region, ingredients, serving size and preparation.

## 8. Personalized Meal Planning
1. Consider calorie and protein requirements.
2. Consider food preferences and budget.
3. Consider working hours and meal timings.
4. Prefer accessible, affordable local foods.
5. Include realistic portion sizes and approximate nutritional values.

## 9. Supplement Guidance
Can explain Whey protein, Creatine monohydrate, Caffeine, Electrolytes, Vitamin D, Vitamin B12, Omega-3.
Never claim supplements are necessary for weight loss or muscle building.

## 10. Medical Safety
You are a fitness and wellness information assistant, not a doctor.
- Never diagnose diseases or prescribe medication.
- Never recommend stopping prescribed medication.
- Do not dismiss severe symptoms.
- Recommend professional medical evaluation when appropriate.
- Be especially cautious with pregnancy, eating disorders, chronic diseases, injuries and users under 18.

## 11. Communication Style
- Friendly, supportive and professional. Direct and easy to understand.
- Use simple English by default.
- Understand and respond naturally in Tamil and Tanglish when the user uses them.
- Use headings and bullet points when they improve readability. Use tables for nutritional comparisons.
- Avoid excessive emojis. Avoid unnecessarily long explanations.
- Never shame users for their food choices or progress.

## 12. Response Intelligence
1. Answer the actual question first.
2. Personalize using available user data.
3. Be scientifically responsible. Use calculations instead of guessing.
4. Ask only necessary follow-up questions.
5. Give actionable recommendations. Keep simple questions simple.
${ragGroundingSection}
## FOOD LOGGING ACTION ENGINE:
If the user's prompt is requesting to add, log, track, or record food they ate (e.g. "add 400gram of rice with sambar as lunch", "2 roti, 1 bowl dal, and curd for lunch", "1 glass badam milk for snack", "add 3 dosa as breakfast"):
Prepend a JSON block at the very start of your response in this exact format:
\`\`\`food_log
{
  "isLogging": true,
  "mealType": "<Breakfast|Lunch|Dinner|Snacks>",
  "items": [
    {
      "food": "<exact or canonical dish name, e.g. Chapati, whole wheat, Dal tadka, Curd, plain, Sambar rice, Plain dosa, Apple>",
      "quantity": <number of pieces/bowls/cups or 1 if weight is specified>,
      "unit": "<piece|bowl|katori|cup|glass|tumbler|spoon|tbsp|tsp|ladle|scoop|plate|g|ml>",
      "weightGrams": <weight in grams if specified, or standard portion weight, or null>,
      "mealType": "<Breakfast|Lunch|Dinner|Snacks>",
      "estimatedCalories": <realistic calories for this item's portion>
    }
  ]
}
\`\`\`
RULES:
1. Multi-Item Combos: If user ate multiple items, return EACH item as an object in the items array.
2. Indian Household Measures: Map natural quantities to measures (katori, bowl: 150g-180g; cup: 160g; glass: 200-240ml; spoon/tbsp: 15g; piece: roti, dosa, idli). If unspecified, default to 1 katori/serving.
3. Realistic Calories: Sambar rice 400g is ~470-500 kcal, 2 rotis is ~200-240 kcal, 1 bowl dal is ~180-220 kcal, 1 katori curd is ~90 kcal. NEVER output thousands of calories for a standard meal!
Followed by your encouraging conversational confirmation message.
If the user is NOT asking to log food, do NOT include the \`\`\`food_log block.`;

      const groqMessages = [{ role: 'system', content: systemPrompt }];
      const historyLimit = 6;
      const historyTurns = (conversation.messages || []).slice(-historyLimit - 1, -1);
      for (const h of historyTurns) {
        if (h.content) {
          groqMessages.push({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: h.content,
          });
        }
      }
      groqMessages.push({ role: 'user', content: userPrompt });

      const groqResult = await callGroqChat(groqMessages, 600);

      if (groqResult?.content) {
        let content = groqResult.content;
        aiModelUsed = groqResult.modelUsed;

        // Check if LLM emitted food_log block
        const foodLogMatch = content.match(/```food_log\s*([\s\S]*?)\s*```/);
        if (foodLogMatch) {
          try {
            const parsed = JSON.parse(foodLogMatch[1]);
            if (parsed.isLogging && Array.isArray(parsed.items) && parsed.items.length > 0) {
              const defaultMeal = parsed.mealType || 'Breakfast';
              const formattedItems = parsed.items.map(item => {
                const itemPrompt = item.food || '';
                const weightMatch = userPrompt.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams|gm|gms|kg|ml)/i);
                const isWeight = !!(
                  item.weightGrams ||
                  ['g', 'gram', 'grams', 'gm', 'gms', 'kg', 'ml'].includes(item.unit?.toLowerCase()) ||
                  (parsed.items.length === 1 && weightMatch)
                );

                let weightGrams = item.weightGrams;
                if (isWeight && !weightGrams && parsed.items.length === 1 && weightMatch) {
                  weightGrams = parseFloat(weightMatch[1]);
                  if (/kg/i.test(weightMatch[0])) weightGrams *= 1000;
                }

                return {
                  food: item.food,
                  quantity: isWeight && weightGrams ? 1 : (item.quantity || 1),
                  unit: item.unit || (isWeight ? 'g' : 'serving'),
                  weightGrams,
                  isWeightOrVolume: isWeight,
                  mealType: item.mealType || defaultMeal,
                  estimatedCalories: item.estimatedCalories,
                };
              });

              const logged = await logFoodsBatchToTracker(
                userUid,
                logDate,
                user.calorieTarget,
                formattedItems,
                defaultMeal
              );

              foodLoggingResult = logged;
              content = content.replace(/```food_log\s*[\s\S]*?```/, '').trim();
            }
          } catch (e) {
            console.warn('[FoodLog JSON parse error]', e.message);
          }
        }

        reply = content;
      }
    }

    // 3. Rule-based regex fallback for food tracking (if Groq was offline or user specifically issued an add/log command that Groq missed)
    if (!foodLoggingResult && (!reply || /^(?:please\s+)?(?:add|track|log|record|i\s+had|i\s+ate)\b/i.test(userPrompt))) {
      const fallbackIntent = parseFoodLoggingIntent(userPrompt);
      if (fallbackIntent && fallbackIntent.items && fallbackIntent.items.length > 0) {
        const logged = await logFoodsBatchToTracker(
          userUid,
          logDate,
          user.calorieTarget,
          fallbackIntent.items,
          fallbackIntent.mealType
        );
        foodLoggingResult = logged;

        const itemsBreakdown = logged.items.map(i => {
          const portionStr = i.servingUnit !== 'piece' && i.servingUnit !== 'serving'
            ? `${i.quantity}x ${i.servingUnit}`
            : `${i.quantity}x`;
          return `• **${portionStr} ${i.foodDisplayName}**: ${i.calories} kcal (P: ${i.protein}g, C: ${i.carbs}g, F: ${i.fat}g)`;
        }).join('\n');

        reply = `✅ **Tracked for ${logged.mealType}!**\n\nI've added **${logged.foodDisplayName}** to your **${logged.mealType}** in today's Food Tracker (${logDate}).\n\n📊 **Nutrition Breakdown:**\n${itemsBreakdown}\n\n🔥 **Meal Total:** **${logged.calories} kcal** | P: ${logged.protein}g | C: ${logged.carbs}g | F: ${logged.fat}g\n\n🎯 **Today's Status:** You've logged **${logged.totalCaloriesToday.toLocaleString()} kcal** so far today, leaving you with **~${logged.remainingCalories.toLocaleString()} kcal** remaining of your ${user.calorieTarget || 2000} kcal target. Keep it up! 🌟`;
      }
    }

    // 3. Fallback to smart rule-based engine if Groq was not available or failed
    if (!reply) {
      const lowerMsg = userPrompt.toLowerCase();
      if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        reply = `Hello ${user.name || 'there'}! I'm Ria, your personal HealthFit AI coach. How can I help you today? You can ask me for meal recommendations, workout plans, or advice on your sleep and nutrition.`;
      } else if (lowerMsg.includes('breakfast') || lowerMsg.includes('lunch') || lowerMsg.includes('dinner') || lowerMsg.includes('snack') || lowerMsg.includes('eat') || lowerMsg.includes('diet')) {
        const remainingCal = Math.max(0, (user.calorieTarget || 2000) - 1200);
        reply = `Based on your goal of **${user.fitnessGoal || 'general health'}** and your daily calorie target of **${user.calorieTarget || 2000} kcal**:\n\n• **High-Protein Option**: Moong Dal Chila with Paneer stuffing or Grilled Chicken Breast with Steamed Veggies (~350 kcal, 30g protein).\n• **Balanced Option**: Sprouted Moong Salad or Oats porridge with almonds & chia seeds (~280 kcal, 14g protein).\n• **Quick Snack**: Roasted Chana / Makhana or Greek Yogurt with Berries (~150 kcal, 8g protein).\n\nYou currently have approximately ~${remainingCal} kcal remaining for today!`;
      } else if (lowerMsg.includes('workout') || lowerMsg.includes('exercise') || lowerMsg.includes('gym') || lowerMsg.includes('fat loss') || lowerMsg.includes('muscle')) {
        reply = `Here is a custom recommendation for your goal (**${user.fitnessGoal || 'fitness'}**):\n\n🏋️ **Quick 20-Min Full Body HIIT**:\n1. Jumping Jacks (45 sec, 15 sec rest) x 3\n2. Bodyweight Squats (45 sec, 15 sec rest) x 3\n3. Push-ups or Knee Push-ups (45 sec, 15 sec rest) x 3\n4. Mountain Climbers (45 sec, 15 sec rest) x 3\n5. Plank Hold (60 sec) x 3\n\nRemember to stay hydrated and aim for at least 2.5L of water today!`;
      } else if (lowerMsg.includes('sleep') || lowerMsg.includes('tired') || lowerMsg.includes('insomnia') || lowerMsg.includes('recovery')) {
        reply = `To improve your sleep quality score (Target: ${user.sleepTarget || 8} hours):\n\n1. **Turn off blue screens** 45 minutes before sleep.\n2. Maintain a cool bedroom temperature (~20-22°C).\n3. Avoid caffeine after 2:00 PM.\n4. Try 5 minutes of deep 4-7-8 breathing before sleep.`;
      } else if (lowerMsg.includes('water') || lowerMsg.includes('hydration')) {
        reply = `Hydration is essential for metabolism and energy! Your daily goal is **${(user.waterTarget || 2500) / 1000}L**. Try taking 2 glasses of water right now to stay on track.`;
      } else {
        reply = `Great question! For your current profile (${user.fitnessGoal || 'general health'}), consistency is key. Keep logging your daily meals, staying within your calorie budget (${user.calorieTarget} kcal), getting ~${user.stepTarget || 8000} steps, and prioritizing 7-8 hours of restful sleep! Is there a specific meal or exercise routine you'd like to plan?`;
      }
    }

    const responsePayload = {
      reply,
      timestamp: new Date().toISOString(),
      provider: aiModelUsed ? 'groq' : 'rule-engine',
      model: aiModelUsed || 'smart-rule-engine',
      userContext: {
        fitnessGoal: user.fitnessGoal,
        calorieTarget: user.calorieTarget,
        name: user.name,
      },
    };

    if (foodLoggingResult) {
      responsePayload.action = 'food_logged';
      responsePayload.loggedEntry = foodLoggingResult;
      responsePayload.dayTotals = {
        calories: foodLoggingResult.totalCaloriesToday,
        remaining: foodLoggingResult.remainingCalories,
        target: user.calorieTarget || 2000,
      };
    }

    // Persist assistant response to conversation memory
    if (conversation) {
      await appendAssistantMessage(
        conversation,
        reply,
        foodLoggingResult ? 'food_logged' : null,
        foodLoggingResult
      );
    }

    res.json({
      success: true,
      data: responsePayload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch persistent conversation history for active user
 */
exports.getConversationHistory = async (req, res, next) => {
  try {
    const userUid = req.user?.uid || req.user?._id?.toString() || 'dev-user-uid-12345';
    const conv = await getOrCreateConversation(userUid);
    res.json({
      success: true,
      data: {
        messages: conv.messages || [],
        lastMessageAt: conv.lastMessageAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear conversation history for active user
 */
exports.clearConversationHistory = async (req, res, next) => {
  try {
    const userUid = req.user?.uid || req.user?._id?.toString() || 'dev-user-uid-12345';
    await AIConversation.deleteMany({ userId: userUid });
    res.json({
      success: true,
      message: 'Conversation history cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.analyzeMealText = async (req, res, next) => {
  try {
    const mealDescription = req.body.mealDescription || req.body.text;
    if (!mealDescription) {
      return res.status(400).json({ success: false, message: 'Meal description is required' });
    }

    if (process.env.GROQ_API_KEY) {
      const prompt = `Analyze this meal description and provide estimated nutritional breakdown in JSON format.
Meal: "${mealDescription}"
Return ONLY valid raw JSON with this exact schema:
{
  "estimatedCalories": number,
  "macros": {
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number
  },
  "healthScore": number,
  "itemsIdentified": [string],
  "advice": string
}`;
      const groqResult = await callGroqChat([
        { role: 'system', content: 'You are an accurate nutritional analysis AI. Always output valid JSON only.' },
        { role: 'user', content: prompt },
      ], 400);

      if (groqResult?.content) {
        try {
          const cleanJsonStr = groqResult.content.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJsonStr);
          if (parsed && typeof parsed.estimatedCalories === 'number') {
            return res.json({ success: true, data: parsed, provider: 'groq', model: groqResult.modelUsed });
          }
        } catch (_) {}
      }
    }

    // Fallback heuristic mock analysis
    const analysis = {
      estimatedCalories: 450,
      macros: { protein: 22, carbs: 52, fat: 14, fiber: 6 },
      healthScore: 88,
      itemsIdentified: [mealDescription],
      advice: 'Well balanced meal with good protein and moderate complex carbohydrates!',
    };

    res.json({ success: true, data: analysis, provider: 'heuristic' });
  } catch (error) {
    next(error);
  }
};
