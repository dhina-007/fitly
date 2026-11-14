const User = require('../models/User');
const FoodLog = require('../models/FoodLog');
const WaterLog = require('../models/WaterLog');
const SleepLog = require('../models/SleepLog');
const WeightLog = require('../models/WeightLog');
const ActivityLog = require('../models/ActivityLog');
const { predictMaintenanceCalories } = require('../utils/calorieCalculator');

exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    let user = await User.findOne({ firebaseUid: uid });
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: req.user.email ? req.user.email.toLowerCase() : `${uid}@fitly.app`,
        name: req.user.name || 'Fitly User',
        isAdmin: Boolean(req.user.isAdmin),
      });
    }

    const foodLogs = await FoodLog.find({ userId: uid, date: targetDate });
    const waterLogs = await WaterLog.find({ userId: uid, date: targetDate });
    const sleepLog = await SleepLog.findOne({ userId: uid, date: targetDate });
    const activityLog = await ActivityLog.findOne({ userId: uid, date: targetDate });

    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
    foodLogs.forEach(log => {
      totalCalories += log.totalCalories || log.calories || 0;
      totalProtein += log.totalProtein || log.protein || 0;
      totalCarbs += log.totalCarbs || log.carbs || 0;
      totalFat += log.totalFat || log.fat || 0;
      totalFiber += log.totalFiber || log.fiber || 0;
    });

    let totalWater = 0;
    waterLogs.forEach(w => {
      totalWater += w.totalAmount || w.amount || w.amountMl || 0;
    });

    // Dynamic health score calculation (0-100)
    let healthScore = 0;
    
    // 1. Calories (25 pts)
    const calTarget = user.calorieTarget || 2000;
    if (totalCalories > 0) {
      const calRatio = Math.min(totalCalories / calTarget, 1);
      healthScore += (calRatio * 25);
    }

    // 2. Water (25 pts)
    const waterTarget = user.waterTarget || 2000;
    const waterRatio = Math.min(totalWater / waterTarget, 1);
    healthScore += (waterRatio * 25);

    // 3. Sleep (25 pts)
    const sleepTarget = user.sleepTarget || 8;
    const sleepHours = sleepLog ? (sleepLog.duration ?? sleepLog.hours ?? 0) : 0;
    const sleepRatio = Math.min(sleepHours / sleepTarget, 1);
    healthScore += (sleepRatio * 25);

    // 4. Activity (25 pts)
    const steps = activityLog ? activityLog.steps : 0;
    const activeCalories = activityLog ? activityLog.activeCalories : 0;
    const stepTarget = user.stepTarget || 8000;
    const stepRatio = Math.min(steps / stepTarget, 1);
    healthScore += (stepRatio * 25);

    healthScore = Math.round(healthScore);

    const predicted = predictMaintenanceCalories({
      weight: user.currentWeight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activityLevel,
      fitnessGoal: user.fitnessGoal,
    });
    const maintenanceCalories = user.tdee || predicted?.maintenanceCalories || user.calorieTarget || 2000;

    res.json({
      success: true,
      data: {
        date: targetDate,
        healthScore: Math.min(100, healthScore),
        calories: {
          consumed: Math.round(totalCalories),
          target: user.calorieTarget || 2000,
          remaining: Math.max(0, (user.calorieTarget || 2000) - Math.round(totalCalories)),
          burned: activeCalories,
          maintenance: maintenanceCalories,
          predictedMaintenance: predicted?.maintenanceCalories || user.predictedTdee || maintenanceCalories,
          isCustomMaintenance: Boolean(user.isCustomMaintenance),
          bmr: predicted?.bmr || user.bmr || null,
        },
        macros: {
          protein: { consumed: Math.round(totalProtein), target: user.proteinTarget || 100 },
          carbs: { consumed: Math.round(totalCarbs), target: user.carbTarget || 250 },
          fat: { consumed: Math.round(totalFat), target: user.fatTarget || 65 },
          fiber: { consumed: Math.round(totalFiber), target: user.fiberTarget || 30 }
        },
        water: {
          consumedMl: totalWater,
          targetMl: user.waterTarget || 2500
        },
        sleep: {
          hours: sleepHours,
          targetHours: user.sleepTarget || 8,
          quality: sleepLog ? sleepLog.quality : 'N/A'
        },
        activity: {
          steps: steps,
          targetSteps: user.stepTarget || 8000,
          source: activityLog ? activityLog.source : 'manual'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
