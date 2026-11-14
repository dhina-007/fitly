const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const FoodLog = require('../models/FoodLog');
const WaterLog = require('../models/WaterLog');
const SleepLog = require('../models/SleepLog');
const { getLastConnectionError, connectDatabase } = require('../config/database');

/**
 * Format uptime into days, hours, minutes, seconds
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * GET /api/health
 * Comprehensive System & Database Health Check
 */
exports.getSystemHealth = async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;

  try {
    let readyState = mongoose.connection.readyState;
    if (readyState !== 1 && process.env.MONGODB_URI) {
      await connectDatabase();
      readyState = mongoose.connection.readyState;
    }

    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    dbStatus = states[readyState] || 'unknown';

    if (readyState === 1 && mongoose.connection.db) {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - pingStart;
    }
  } catch (err) {
    dbStatus = 'error';
    dbLatencyMs = -1;
  }

  const memory = process.memoryUsage();
  const uptimeSeconds = process.uptime();
  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'Fitly Health & Fitness API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - startTime,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      name: mongoose.connection.name || 'healthfit',
      hasUriConfigured: Boolean(process.env.MONGODB_URI),
      error: !isHealthy ? (getLastConnectionError() || 'MongoDB is not connected. Check IP Access List (0.0.0.0/0) or credentials in Atlas.') : null,
    },
    system: {
      uptimeSeconds: Math.floor(uptimeSeconds),
      uptimeFormatted: formatUptime(uptimeSeconds),
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round((memory.rss / (1024 * 1024)) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / (1024 * 1024)) * 100) / 100,
      },
    },
  });
};

/**
 * GET /api/health/ping
 * Ultra-fast heartbeat for load balancers & uptime monitors
 */
exports.getPing = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
};

/**
 * GET /api/health/calculate
 * Calculate health metrics (BMI, BMR, TDEE, macros, water intake)
 * Accepts query params: weight (kg), height (cm), age (years), gender (male/female), activityLevel, fitnessGoal
 */
exports.calculateHealthMetrics = (req, res) => {
  try {
    const weight = parseFloat(req.query.weight || req.body?.weight || 70);
    const height = parseFloat(req.query.height || req.body?.height || 170);
    const age = parseInt(req.query.age || req.body?.age || 25, 10);
    const gender = (req.query.gender || req.body?.gender || 'male').toLowerCase();
    const activityLevel = req.query.activityLevel || req.body?.activityLevel || 'moderately_active';
    const fitnessGoal = req.query.fitnessGoal || req.body?.fitnessGoal || 'general_fitness';

    // 1. BMI calculation: weight (kg) / (height (m) ^ 2)
    const heightInMeters = height / 100;
    const bmi = Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
    let bmiCategory = 'Normal weight';
    let bmiRisk = 'Low risk';
    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiRisk = 'Risk of nutritional deficiency';
    } else if (bmi < 25) {
      bmiCategory = 'Normal weight';
      bmiRisk = 'Low risk / healthy range';
    } else if (bmi < 30) {
      bmiCategory = 'Overweight';
      bmiRisk = 'Moderate health risk';
    } else {
      bmiCategory = 'Obese';
      bmiRisk = 'High cardiovascular & metabolic risk';
    }

    // 2. Ideal Weight Range (Healthy BMI 18.5 - 24.9)
    const minHealthyWeight = Math.round(18.5 * heightInMeters * heightInMeters * 10) / 10;
    const maxHealthyWeight = Math.round(24.9 * heightInMeters * heightInMeters * 10) / 10;

    // 3. BMR (Mifflin-St Jeor Equation)
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'female' ? -161 : 5;
    bmr = Math.round(bmr);

    // 4. Activity Multiplier -> TDEE
    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };
    const factor = multipliers[activityLevel] || 1.375;
    const tdee = Math.round(bmr * factor);

    // 5. Goal adjustment for target calories
    let calorieTarget = tdee;
    if (fitnessGoal === 'weight_loss') calorieTarget = Math.round(tdee - 500);
    else if (fitnessGoal === 'weight_gain' || fitnessGoal === 'muscle_building') calorieTarget = Math.round(tdee + 350);

    // 6. Macro Split (Protein 2g/kg for active/muscle, Fat 25%, Carbs rest, Fiber 14g/1000kcal)
    const proteinGrams = Math.round(weight * (fitnessGoal === 'muscle_building' ? 2.0 : 1.6));
    const proteinKcal = proteinGrams * 4;
    const fatKcal = Math.round(calorieTarget * 0.25);
    const fatGrams = Math.round(fatKcal / 9);
    const carbKcal = Math.max(0, calorieTarget - proteinKcal - fatKcal);
    const carbGrams = Math.round(carbKcal / 4);
    const fiberGrams = Math.round((calorieTarget / 1000) * 14);

    // 7. Recommended Water Intake (35ml per kg bodyweight)
    const waterIntakeMl = Math.round(weight * 35);

    res.status(200).json({
      success: true,
      data: {
        inputs: { weight, height, age, gender, activityLevel, fitnessGoal },
        metrics: {
          bmi,
          bmiCategory,
          bmiRisk,
          idealWeightRange: { minKg: minHealthyWeight, maxKg: maxHealthyWeight },
          bmrKcal: bmr,
          tdeeKcal: tdee,
          dailyTargetKcal: calorieTarget,
        },
        macros: {
          proteinGrams,
          carbGrams,
          fatGrams,
          fiberGrams,
        },
        hydration: {
          recommendedWaterMl: waterIntakeMl,
          glasses: Math.round(waterIntakeMl / 250),
        },
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/health/overview
 * Authenticated User's Real-Time Health & Fitness Overview
 */
exports.getUserHealthOverview = async (req, res) => {
  try {
    const userId = req.user?.uid || 'dev-user-uid-12345';
    const date = req.query.date || new Date().toISOString().split('T')[0];

    let user = await User.findOne({ firebaseUid: userId }).lean();
    if (!user) {
      user = await User.findOne({}).lean() || {
        name: 'Dhina',
        fitnessGoal: 'weight_loss',
        activityLevel: 'moderately_active',
        currentWeight: 78,
        targetWeight: 70,
        calorieTarget: 2000,
        proteinTarget: 120,
        carbTarget: 220,
        fatTarget: 60,
        fiberTarget: 30,
        stepTarget: 8000,
        waterTarget: 2500,
        sleepTarget: 8,
      };
    }

    // Parallel fetch of today's health logs
    const [activity, foods, water, sleep] = await Promise.all([
      ActivityLog.findOne({ userId, date }).lean(),
      FoodLog.find({ userId, date }).lean(),
      WaterLog.findOne({ userId, date }).lean(),
      SleepLog.findOne({ userId, date }).lean(),
    ]);

    const caloriesConsumed = foods.reduce((sum, item) => sum + (item.calories || 0), 0);
    const proteinConsumed = foods.reduce((sum, item) => sum + (item.protein || 0), 0);
    const carbsConsumed = foods.reduce((sum, item) => sum + (item.carbs || 0), 0);
    const fatConsumed = foods.reduce((sum, item) => sum + (item.fat || 0), 0);
    const fiberConsumed = foods.reduce((sum, item) => sum + (item.fiber || 0), 0);

    const steps = activity?.steps || 0;
    const activeCalories = activity?.activeCalories || 0;
    const waterMl = water?.amount || 0;
    const sleepHours = sleep?.duration || 0;

    const calorieTarget = user.calorieTarget || 2000;
    const caloriesLeft = Math.max(0, calorieTarget - caloriesConsumed);

    // Compute Health Score (0 - 100)
    let score = 50;
    if (steps >= (user.stepTarget || 8000)) score += 15;
    else score += Math.round((steps / (user.stepTarget || 8000)) * 15);

    if (waterMl >= (user.waterTarget || 2500)) score += 15;
    else score += Math.round((waterMl / (user.waterTarget || 2500)) * 15);

    if (sleepHours >= 7 && sleepHours <= 9) score += 10;
    else if (sleepHours > 5) score += 5;

    const calorieDiffRatio = Math.abs(calorieTarget - caloriesConsumed) / calorieTarget;
    if (calorieDiffRatio <= 0.15) score += 10;

    res.status(200).json({
      success: true,
      data: {
        date,
        healthScore: Math.min(100, Math.max(0, score)),
        user: {
          name: user.name,
          fitnessGoal: user.fitnessGoal,
          activityLevel: user.activityLevel,
          currentWeight: user.currentWeight,
          targetWeight: user.targetWeight,
        },
        nutrition: {
          targetKcal: calorieTarget,
          consumedKcal: caloriesConsumed,
          caloriesLeft,
          macros: {
            protein: { current: proteinConsumed, target: user.proteinTarget || 100 },
            carbs: { current: carbsConsumed, target: user.carbTarget || 250 },
            fat: { current: fatConsumed, target: user.fatTarget || 65 },
            fiber: { current: fiberConsumed, target: user.fiberTarget || 30 },
          },
        },
        activity: {
          steps,
          stepTarget: user.stepTarget || 8000,
          activeCalories,
        },
        hydration: {
          currentMl: waterMl,
          targetMl: user.waterTarget || 2500,
        },
        sleep: {
          durationHours: sleepHours,
          targetHours: user.sleepTarget || 8,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
