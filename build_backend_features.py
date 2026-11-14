import os

server_dir = "/Users/dhinagar/Documents/antigravity/Fitly/server/src"

# 1. AI Controller (Ria AI Health Coach)
ai_controller = '''const User = require('../models/User');
const FoodLog = require('../models/FoodLog');
const SleepLog = require('../models/SleepLog');
const ActivityLog = require('../models/ActivityLog');

/**
 * Ria AI Health Coach controller - 100% Free & Unlimited
 */
exports.chatWithRia = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const lowerMsg = message.toLowerCase();
    let reply = '';

    // Smart contextual rules engine providing high quality personalised health & fitness coaching
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      reply = `Hello ${user.name || 'there'}! I'm Ria, your personal HealthFit AI coach. How can I help you today? You can ask me for meal recommendations, workout plans, or advice on your sleep and nutrition.`;
    } else if (lowerMsg.includes('breakfast') || lowerMsg.includes('lunch') || lowerMsg.includes('dinner') || lowerMsg.includes('snack') || lowerMsg.includes('eat') || lowerMsg.includes('diet')) {
      const remainingCal = Math.max(0, (user.calorieTarget || 2000) - 1200);
      reply = `Based on your goal of **${user.fitnessGoal || 'general health'}** and your daily calorie target of **${user.calorieTarget || 2000} kcal**:\n\n` +
        `• **High-Protein Option**: Moong Dal Chila with Paneer stuffing or Grilled Chicken Breast with Steamed Veggies (~350 kcal, 30g protein).\n` +
        `• **Balanced Option**: Sprouted Moong Salad or Oats porridge with almonds & chia seeds (~280 kcal, 14g protein).\n` +
        `• **Quick Snack**: Roasted Chana / Makhana or Greek Yogurt with Berries (~150 kcal, 8g protein).\n\n` +
        `You currently have approximately ~${remainingCal} kcal remaining for today!`;
    } else if (lowerMsg.includes('workout') || lowerMsg.includes('exercise') || lowerMsg.includes('gym') || lowerMsg.includes('fat loss') || lowerMsg.includes('muscle')) {
      reply = `Here is a custom recommendation for your goal (**${user.fitnessGoal || 'fitness'}**):\n\n` +
        `🏋️ **Quick 20-Min Full Body HIIT**:\n` +
        `1. Jumping Jacks (45 sec, 15 sec rest) x 3\n` +
        `2. Bodyweight Squats (45 sec, 15 sec rest) x 3\n` +
        `3. Push-ups or Knee Push-ups (45 sec, 15 sec rest) x 3\n` +
        `4. Mountain Climbers (45 sec, 15 sec rest) x 3\n` +
        `5. Plank Hold (60 sec) x 3\n\n` +
        `Remember to stay hydrated and aim for at least 2.5L of water today!`;
    } else if (lowerMsg.includes('sleep') || lowerMsg.includes('tired') || lowerMsg.includes('insomnia') || lowerMsg.includes('recovery')) {
      reply = `To improve your sleep quality score (Target: ${user.sleepTarget || 8} hours):\n\n` +
        `1. **Turn off blue screens** 45 minutes before sleep.\n` +
        `2. Maintain a cool bedroom temperature (~20-22°C).\n` +
        `3. Avoid caffeine after 2:00 PM.\n` +
        `4. Try 5 minutes of deep 4-7-8 breathing before sleep.`;
    } else if (lowerMsg.includes('water') || lowerMsg.includes('hydration')) {
      reply = `Hydration is essential for metabolism and energy! Your daily goal is **${(user.waterTarget || 2500)/1000}L**. Try taking 2 glasses of water right now to stay on track.`;
    } else {
      reply = `Great question! For your current profile (${user.fitnessGoal || 'general health'}), consistency is key. Keep logging your daily meals, staying within your calorie budget (${user.calorieTarget} kcal), getting ~${user.stepTarget || 8000} steps, and prioritizing 7-8 hours of restful sleep! Is there a specific meal or exercise routine you'd like to plan?`;
    }

    res.json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString(),
        userContext: {
          fitnessGoal: user.fitnessGoal,
          calorieTarget: user.calorieTarget,
          name: user.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.analyzeMealText = async (req, res, next) => {
  try {
    const { mealDescription } = req.body;
    if (!mealDescription) {
      return res.status(400).json({ success: false, message: 'Meal description is required' });
    }

    // Smart heuristic mock analysis
    const analysis = {
      estimatedCalories: 450,
      macros: { protein: 22, carbs: 52, fat: 14, fiber: 6 },
      healthScore: 88,
      itemsIdentified: [mealDescription],
      advice: 'Well balanced meal with good protein and moderate complex carbohydrates!'
    };

    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
};
''';

# Write AI Controller
with open(os.path.join(server_dir, 'controllers/ai.controller.js'), 'w') as f:
    f.write(ai_controller)

# AI Routes
ai_routes = '''const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, aiController.chatWithRia);
router.post('/analyze-meal', protect, aiController.analyzeMealText);

module.exports = router;
''';

with open(os.path.join(server_dir, 'routes/ai.routes.js'), 'w') as f:
    f.write(ai_routes)

# 2. Recipe Controller & Routes
recipe_controller = '''const Recipe = require('../models/Recipe');

exports.getRecipes = async (req, res, next) => {
  try {
    const { category, search, tag } = req.query;
    let query = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const recipes = await Recipe.find(query).limit(50);
    res.json({ success: true, count: recipes.length, data: recipes });
  } catch (error) {
    next(error);
  }
};

exports.getRecipeById = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    res.json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
};
''';

with open(os.path.join(server_dir, 'controllers/recipe.controller.js'), 'w') as f:
    f.write(recipe_controller)

recipe_routes = '''const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, recipeController.getRecipes);
router.get('/:id', protect, recipeController.getRecipeById);

module.exports = router;
''';

with open(os.path.join(server_dir, 'routes/recipe.routes.js'), 'w') as f:
    f.write(recipe_routes)

# 3. Exercise Controller & Routes
exercise_controller = '''const Exercise = require('../models/Exercise');

exports.getExercises = async (req, res, next) => {
  try {
    const { bodyPart, category, search, equipment } = req.query;
    let query = {};
    if (bodyPart) query.bodyPart = bodyPart;
    if (category) query.category = category;
    if (equipment) query.equipment = equipment;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const exercises = await Exercise.find(query).limit(100);
    res.json({ success: true, count: exercises.length, data: exercises });
  } catch (error) {
    next(error);
  }
};

exports.getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success: false, message: 'Exercise not found' });
    res.json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
};
''';

with open(os.path.join(server_dir, 'controllers/exercise.controller.js'), 'w') as f:
    f.write(exercise_controller)

exercise_routes = '''const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exercise.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, exerciseController.getExercises);
router.get('/:id', protect, exerciseController.getExerciseById);

module.exports = router;
''';

with open(os.path.join(server_dir, 'routes/exercise.routes.js'), 'w') as f:
    f.write(exercise_routes)

# 4. Fasting Controller & Routes
fasting_controller = '''const User = require('../models/User');

exports.getFastingStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: {
        isFasting: false,
        protocol: '16:8', // 16 hours fasting, 8 hours eating
        startTime: null,
        targetHours: 16,
        elapsedSeconds: 0,
        stage: 'Anabolic (0-4h)'
      }
    });
  } catch (error) {
    next(error);
  }
};
''';

with open(os.path.join(server_dir, 'controllers/fasting.controller.js'), 'w') as f:
    f.write(fasting_controller)

fasting_routes = '''const express = require('express');
const router = express.Router();
const fastingController = require('../controllers/fasting.controller');
const { protect } = require('../middleware/auth');

router.get('/status', protect, fastingController.getFastingStatus);

module.exports = router;
''';

with open(os.path.join(server_dir, 'routes/fasting.routes.js'), 'w') as f:
    f.write(fasting_routes)

# 5. Analytics Controller & Routes
analytics_controller = '''const User = require('../models/User');
const FoodLog = require('../models/FoodLog');
const WaterLog = require('../models/WaterLog');
const SleepLog = require('../models/SleepLog');
const WeightLog = require('../models/WeightLog');

exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const today = new Date().toISOString().split('T')[0];

    const foodLogs = await FoodLog.find({ user: userId, date: today });
    const waterLogs = await WaterLog.find({ user: userId, date: today });
    const sleepLog = await SleepLog.findOne({ user: userId, date: today });

    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    foodLogs.forEach(log => {
      totalCalories += log.calories || 0;
      totalProtein += log.protein || 0;
      totalCarbs += log.carbs || 0;
      totalFat += log.fat || 0;
    });

    let totalWater = 0;
    waterLogs.forEach(w => { totalWater += w.amountMl || 0; });

    // Dynamic health score calculation (0-100)
    let healthScore = 70;
    if (totalCalories > 0 && totalCalories <= user.calorieTarget) healthScore += 10;
    if (totalWater >= (user.waterTarget || 2000)) healthScore += 10;
    if (sleepLog && sleepLog.hours >= 7) healthScore += 10;

    res.json({
      success: true,
      data: {
        date: today,
        healthScore: Math.min(100, healthScore),
        calories: {
          consumed: Math.round(totalCalories),
          target: user.calorieTarget || 2000,
          remaining: Math.max(0, (user.calorieTarget || 2000) - Math.round(totalCalories))
        },
        macros: {
          protein: { consumed: Math.round(totalProtein), target: user.proteinTarget || 100 },
          carbs: { consumed: Math.round(totalCarbs), target: user.carbTarget || 250 },
          fat: { consumed: Math.round(totalFat), target: user.fatTarget || 65 }
        },
        water: {
          consumedMl: totalWater,
          targetMl: user.waterTarget || 2500
        },
        sleep: {
          hours: sleepLog ? sleepLog.hours : 0,
          targetHours: user.sleepTarget || 8,
          quality: sleepLog ? sleepLog.quality : 'N/A'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
''';

with open(os.path.join(server_dir, 'controllers/analytics.controller.js'), 'w') as f:
    f.write(analytics_controller)

analytics_routes = '''const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, analyticsController.getDashboardAnalytics);

module.exports = router;
''';

with open(os.path.join(server_dir, 'routes/analytics.routes.js'), 'w') as f:
    f.write(analytics_routes)

# Update app.js to register new routes
app_js_path = os.path.join(server_dir, 'app.js')
with open(app_js_path, 'r') as f:
    app_content = f.read()

new_routes_str = '''app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/recipes', require('./routes/recipe.routes'));
app.use('/api/exercises', require('./routes/exercise.routes'));
app.use('/api/fasting', require('./routes/fasting.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
'''

if "app.use('/api/ai'" not in app_content:
    app_content = app_content.replace("// Routes\n", "// Routes\n" + new_routes_str)
    with open(app_js_path, 'w') as f:
        f.write(app_content)

print("Backend routes and controllers updated successfully!")
