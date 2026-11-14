const User = require('../models/User');
const {
  predictMaintenanceCalories,
  calculateGoalCalorieTarget,
  calculateMacroTargets,
} = require('../utils/calorieCalculator');

async function getProfile(req, res, next) {
  try {
    const normalizedEmail = req.user.email ? req.user.email.toLowerCase() : null;
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user && normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        user.firebaseUid = req.user.uid;
        await user.save();
      }
    }

    if (!user) {
      // Auto-create on first login
      user = await User.create({
        firebaseUid: req.user.uid,
        email: normalizedEmail || `${req.user.uid}@fitly.app`,
        name: req.user.name || 'Dhina',
        isAdmin: Boolean(req.user.isAdmin),
      });
    }

    const predicted = predictMaintenanceCalories({
      weight: user.currentWeight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activityLevel,
      fitnessGoal: user.fitnessGoal,
    });

    if (predicted) {
      let dirty = false;
      if (user.predictedTdee !== predicted.maintenanceCalories) {
        user.predictedTdee = predicted.maintenanceCalories;
        dirty = true;
      }
      if (user.bmr !== predicted.bmr) {
        user.bmr = predicted.bmr;
        dirty = true;
      }
      if (!user.tdee && !user.isCustomMaintenance) {
        user.tdee = predicted.maintenanceCalories;
        user.calorieTarget = predicted.calorieTarget;
        user.proteinTarget = predicted.proteinTarget;
        user.carbTarget = predicted.carbTarget;
        user.fatTarget = predicted.fatTarget;
        dirty = true;
      }
      if (dirty) await user.save();
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    // Never trust userId from body, always use req.user.uid
    const allowed = [
      'name', 'profilePhoto', 'dateOfBirth', 'age', 'gender',
      'height', 'currentWeight', 'targetWeight', 'activityLevel', 'fitnessGoal',
      'dietaryPreference', 'allergies', 'preferredCuisine', 'dislikedFoods', 'likedFoods',
      'calorieTarget', 'proteinTarget', 'carbTarget', 'fatTarget', 'fiberTarget',
      'waterTarget', 'stepTarget', 'sleepTarget', 'timezone', 'units',
      'bmi', 'bmr', 'tdee', 'predictedTdee', 'isCustomMaintenance',
      'onboardingCompleted', 'notificationPrefs', 'expoPushToken',
    ];

    const existing = await User.findOne({ firebaseUid: req.user.uid }).lean();
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const merged = { ...(existing || {}), ...updates };
    const predicted = predictMaintenanceCalories({
      weight: merged.currentWeight,
      height: merged.height,
      age: merged.age,
      gender: merged.gender,
      activityLevel: merged.activityLevel,
      fitnessGoal: merged.fitnessGoal,
    });

    if (predicted) {
      updates.bmr = predicted.bmr;
      updates.predictedTdee = predicted.maintenanceCalories;
    }

    if (merged.height && merged.currentWeight) {
      const hm = Number(merged.height) / 100;
      if (hm > 0) updates.bmi = Math.round((Number(merged.currentWeight) / (hm * hm)) * 10) / 10;
    }

    const explicitCustomFlag = req.body.isCustomMaintenance;
    const requestedTdee = req.body.tdee !== undefined ? Math.round(Number(req.body.tdee)) : undefined;

    if (explicitCustomFlag === false) {
      updates.isCustomMaintenance = false;
      if (predicted) {
        updates.tdee = predicted.maintenanceCalories;
        if (req.body.calorieTarget === undefined) {
          updates.calorieTarget = predicted.calorieTarget;
          updates.proteinTarget = predicted.proteinTarget;
          updates.carbTarget = predicted.carbTarget;
          updates.fatTarget = predicted.fatTarget;
        }
      }
    } else if (
      requestedTdee !== undefined &&
      Number.isFinite(requestedTdee) &&
      requestedTdee >= 800 &&
      (explicitCustomFlag === true || !predicted || requestedTdee !== predicted.maintenanceCalories)
    ) {
      updates.tdee = requestedTdee;
      updates.isCustomMaintenance = true;
      if (req.body.calorieTarget === undefined) {
        const goalCal = calculateGoalCalorieTarget(requestedTdee, merged.fitnessGoal);
        updates.calorieTarget = goalCal;
        Object.assign(updates, calculateMacroTargets(goalCal));
      }
    } else if (!merged.isCustomMaintenance && predicted) {
      updates.tdee = predicted.maintenanceCalories;
      updates.isCustomMaintenance = false;
      if (req.body.calorieTarget === undefined) {
        updates.calorieTarget = predicted.calorieTarget;
        updates.proteinTarget = predicted.proteinTarget;
        updates.carbTarget = predicted.carbTarget;
        updates.fatTarget = predicted.fatTarget;
      }
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const { admin } = require('../config/firebase.admin');
    
    // Delete all user data
    const uid = req.user.uid;
    const FoodLog = require('../models/FoodLog');
    const WeightLog = require('../models/WeightLog');
    const WaterLog = require('../models/WaterLog');
    const SleepLog = require('../models/SleepLog');
    const ActivityLog = require('../models/ActivityLog');
    const WorkoutLog = require('../models/WorkoutLog');
    const Habit = require('../models/Habit');
    const HabitLog = require('../models/HabitLog');
    const AIConversation = require('../models/AIConversation');

    await Promise.all([
      FoodLog.deleteMany({ userId: uid }),
      WeightLog.deleteMany({ userId: uid }),
      WaterLog.deleteMany({ userId: uid }),
      SleepLog.deleteMany({ userId: uid }),
      ActivityLog.deleteMany({ userId: uid }),
      WorkoutLog.deleteMany({ userId: uid }),
      Habit.deleteMany({ userId: uid }),
      HabitLog.deleteMany({ userId: uid }),
      AIConversation.deleteMany({ userId: uid }),
      User.deleteOne({ firebaseUid: uid }),
    ]);

    // Delete from Firebase when admin credentials are configured
    if (process.env.FIREBASE_CLIENT_EMAIL && typeof admin?.auth === 'function') {
      try {
        await admin.auth().deleteUser(uid);
      } catch (fbErr) {
        if (fbErr?.code !== 'auth/user-not-found') {
          console.warn('Firebase deleteUser warning:', fbErr.message);
        }
      }
    }

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, deleteAccount };
