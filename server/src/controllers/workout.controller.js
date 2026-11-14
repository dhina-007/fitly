const Workout = require('../models/Workout');
const WorkoutLog = require('../models/WorkoutLog');
const Exercise = require('../models/Exercise');
const User = require('../models/User');
const { recordUserTaskCompletion } = require('../services/communityProgress.service');

// 1. Fetch available workouts with category/difficulty filters
async function getWorkouts(req, res, next) {
  try {
    const { category, difficulty, page = 1, limit = 50 } = req.query;
    const query = { isPublic: true };

    if (category && category !== 'All' && category !== 'all') {
      const catLower = category.toLowerCase();
      if (catLower === 'strength') {
        query.category = { $in: ['strength', 'muscle_building'] };
      } else if (catLower === 'cardio' || catLower === 'hiit') {
        query.category = { $in: ['hiit', 'cardio', 'weight_loss'] };
      } else if (catLower === 'home') {
        query.category = 'home';
      } else if (catLower === 'mobility') {
        query.category = { $in: ['mobility', 'stretching'] };
      } else {
        query.category = catLower;
      }
    }

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty.toLowerCase();
    }

    const workouts = await Workout.find(query)
      .populate('exercises.exercise', 'name category muscleGroups equipment difficulty description instructions caloriesPerMinute isCompound')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, data: workouts });
  } catch (err) {
    next(err);
  }
}

// 2. Fetch single workout by ID
async function getWorkoutById(req, res, next) {
  try {
    const workout = await Workout.findById(req.params.id)
      .populate('exercises.exercise')
      .lean();
    if (!workout) return res.status(404).json({ success: false, message: 'Workout not found' });
    res.json({ success: true, data: workout });
  } catch (err) {
    next(err);
  }
}

// 3. Personalized Daily Coach Recommendation
async function getRecommendedWorkout(req, res, next) {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ firebaseUid: uid }).lean();
    const todayStr = new Date().toISOString().split('T')[0];

    // Check if user has already logged a workout today
    const todayLog = await WorkoutLog.findOne({ userId: uid, date: todayStr }).lean();

    // Fetch candidate workouts
    const allWorkouts = await Workout.find({ isPublic: true })
      .populate('exercises.exercise', 'name category muscleGroups equipment difficulty description instructions caloriesPerMinute isCompound')
      .lean();

    if (!allWorkouts || allWorkouts.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No workouts available in library'
      });
    }

    const userGoal = user?.fitnessGoal || 'weight_loss';
    const userWeight = user?.currentWeight || 70;
    const userLevel = user?.activityLevel || 'moderately_active';

    let recommended = null;
    let rationale = '';

    if (userGoal === 'weight_loss') {
      recommended = allWorkouts.find(w => w.category === 'hiit') ||
                    allWorkouts.find(w => w.name.includes('Metabolic')) ||
                    allWorkouts[0];
      rationale = 'Designed to optimize total caloric expenditure and elevate EPOC (post-exercise oxygen consumption) while preserving lean tissue.';
    } else if (userGoal === 'muscle_building' || userGoal === 'weight_gain') {
      recommended = allWorkouts.find(w => w.name.includes('Push') || w.category === 'muscle_building') ||
                    allWorkouts[0];
      rationale = 'Focuses on compound multi-joint mechanical tension and progressive overload for targeted hypertrophy.';
    } else if (userGoal === 'general_fitness' || userGoal === 'improved_activity') {
      recommended = allWorkouts.find(w => w.name.includes('Home Bodyweight')) ||
                    allWorkouts.find(w => w.category === 'home') ||
                    allWorkouts[0];
      rationale = 'Functional full-body movement patterns developing cardiovascular health and joint stamina with zero equipment.';
    } else {
      recommended = allWorkouts[0];
      rationale = 'Balanced routine supporting foundational strength, motor control, and cardiovascular endurance.';
    }

    res.json({
      success: true,
      data: {
        workout: recommended,
        rationale,
        userGoal,
        userWeight,
        userLevel,
        hasCompletedToday: !!todayLog,
        todayLog: todayLog || null,
      }
    });
  } catch (err) {
    next(err);
  }
}

// 4. Log completed workout with MET-based calorie calculation and duplicate protection
async function logWorkout(req, res, next) {
  try {
    const uid = req.user.uid;
    const {
      workoutId,
      workoutName,
      startTime,
      endTime,
      durationMinutes,
      exercises,
      notes,
    } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    // Duplicate submission guard (prevent double clicks within 15 seconds)
    const recentDuplicate = await WorkoutLog.findOne({
      userId: uid,
      workoutName: workoutName || 'Custom Workout',
      date,
      createdAt: { $gte: new Date(Date.now() - 15000) },
    });
    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        data: recentDuplicate,
        message: 'Workout already recorded recently'
      });
    }

    // Get user weight for accurate MET calorie calculation
    const user = await User.findOne({ firebaseUid: uid }).lean();
    const bodyWeightKg = user?.currentWeight || 70;

    const normalizedExercises = (Array.isArray(exercises) ? exercises : []).map(e => {
      let rawSets = [];
      if (Array.isArray(e.sets)) {
        rawSets = e.sets;
      } else if (typeof e.sets === 'number' && e.sets > 0) {
        rawSets = Array.from({ length: Math.min(20, Math.round(e.sets)) }, () => ({
          reps: e.reps,
          weight: e.weight,
          duration: e.duration,
          completed: true,
        }));
      }
      return {
        exerciseId: e.exerciseId || e.exercise,
        exerciseName: e.exerciseName || e.name || 'Exercise',
        sets: rawSets.map((s) => ({
          reps: Number(s.reps) || 0,
          weight: Number(s.weight) || 0,
          duration: Number(s.duration) || 0,
          completed: s.completed !== undefined ? Boolean(s.completed) : true,
        })),
      };
    });

    // Calculate actual duration in minutes
    const validDurationMinutes = Math.max(1, Math.round(Number(durationMinutes) || 30));

    // Calculate volume (kg)
    let totalVolumeKg = 0;
    normalizedExercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed && s.weight > 0 && s.reps > 0) {
          totalVolumeKg += s.weight * s.reps;
        }
      });
    });

    // Determine MET intensity
    // Standard MET values (Ainsworth Compendium of Physical Activities):
    // Vigorous Resistance Training: ~6.0 METs
    // HIIT / Circuit Training: ~8.0 METs
    // Calisthenics / Moderate Conditioning: ~5.0 METs
    // Mobility / Yoga: ~3.0 METs
    let met = 5.5;
    const nameLower = (workoutName || '').toLowerCase();
    if (nameLower.includes('hiit') || nameLower.includes('metabolic') || nameLower.includes('burn')) {
      met = 8.0;
    } else if (nameLower.includes('mobility') || nameLower.includes('stretch') || nameLower.includes('recovery')) {
      met = 3.2;
    } else if (nameLower.includes('squat') || nameLower.includes('push') || nameLower.includes('pull') || nameLower.includes('strength')) {
      met = 6.0;
    }

    // Calories = (MET * 3.5 * weightKg / 200) * durationMinutes
    const calculatedCalories = req.body.caloriesBurned
      ? Number(req.body.caloriesBurned)
      : Math.round(((met * 3.5 * bodyWeightKg) / 200) * validDurationMinutes);

    const log = await WorkoutLog.create({
      userId: uid,
      date,
      workoutId: workoutId || null,
      workoutName: workoutName || 'Custom Workout',
      startTime: startTime || new Date(Date.now() - validDurationMinutes * 60000),
      endTime: endTime || new Date(),
      durationMinutes: validDurationMinutes,
      exercises: normalizedExercises,
      caloriesBurned: calculatedCalories,
      notes: notes || (totalVolumeKg > 0 ? `Total volume lifted: ${totalVolumeKg.toLocaleString()} kg` : ''),
      completed: true,
    });

    const communitySync = await recordUserTaskCompletion(uid, {
      taskKey: `workout:${log._id}`,
      taskTitle: `Completed workout: ${log.workoutName}`,
      taskCategory: 'workout',
    });

    res.status(201).json({
      success: true,
      data: log,
      volumeKg: totalVolumeKg,
      communityUpdatesCount: communitySync.updatedCommunities,
    });
  } catch (err) {
    next(err);
  }
}

// 5. Fetch Workout Logs & Weekly Statistics
async function getWorkoutLogs(req, res, next) {
  try {
    const { range = '30d' } = req.query;
    const uid = req.user.uid;

    const query = { userId: uid };
    if (range !== 'all' && range !== 'lifetime') {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 };
      const days = daysMap[range] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startStr = startDate.toISOString().split('T')[0];
      query.date = { $gte: startStr };
    }

    const logs = await WorkoutLog.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Compute weekly statistics (current week Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const mondayStr = monday.toISOString().split('T')[0];

    let thisWeekCount = 0;
    let thisWeekMinutes = 0;
    let thisWeekCalories = 0;
    let thisWeekVolumeKg = 0;
    const daysTrainedThisWeek = new Set();

    logs.forEach(log => {
      if (log.date >= mondayStr) {
        thisWeekCount++;
        thisWeekMinutes += log.durationMinutes || 0;
        thisWeekCalories += log.caloriesBurned || 0;
        daysTrainedThisWeek.add(log.date);

        (log.exercises || []).forEach(ex => {
          (ex.sets || []).forEach(s => {
            if (s.completed && s.weight && s.reps) {
              thisWeekVolumeKg += s.weight * s.reps;
            }
          });
        });
      }
    });

    const weeklyStats = {
      sessionsCount: thisWeekCount,
      totalMinutes: thisWeekMinutes,
      totalCalories: thisWeekCalories,
      totalVolumeKg: thisWeekVolumeKg,
      daysTrainedCount: daysTrainedThisWeek.size,
    };

    res.json({ success: true, data: logs, weeklyStats });
  } catch (err) {
    next(err);
  }
}

// 6. Fetch exercise substitution recommendations
async function getExerciseSubstitutions(req, res, next) {
  try {
    const { exerciseName, targetMuscle } = req.query;
    let query = {};

    if (targetMuscle) {
      query.muscleGroups = targetMuscle;
    } else if (exerciseName) {
      const baseEx = await Exercise.findOne({ name: exerciseName }).lean();
      if (baseEx && baseEx.muscleGroups && baseEx.muscleGroups.length > 0) {
        query.muscleGroups = { $in: baseEx.muscleGroups };
        query._id = { $ne: baseEx._id };
      }
    }

    const alternatives = await Exercise.find(query).limit(10).lean();
    res.json({ success: true, data: alternatives });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWorkouts,
  getWorkoutById,
  getRecommendedWorkout,
  logWorkout,
  getWorkoutLogs,
  getExerciseSubstitutions,
};
