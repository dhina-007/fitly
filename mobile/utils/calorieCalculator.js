import { ACTIVITY_LEVELS } from '../constants';

export function calculateBMR({ weight, height, age, gender = 'male' }) {
  const w = Number(weight);
  const h = Number(height);
  const a = Number(age);
  if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(a) || w <= 0 || h <= 0 || a <= 0) {
    return null;
  }
  if (gender === 'male') return Math.round(10 * w + 6.25 * h - 5 * a + 5);
  if (gender === 'female') return Math.round(10 * w + 6.25 * h - 5 * a - 161);
  return Math.round(10 * w + 6.25 * h - 5 * a - 78);
}

export function calculateGoalCalorieTarget(maintenanceCalories, fitnessGoal = 'maintenance') {
  const tdee = Number(maintenanceCalories);
  if (!Number.isFinite(tdee) || tdee <= 0) return 2000;

  let target = tdee;
  if (fitnessGoal === 'weight_loss') target = tdee - 500;
  else if (fitnessGoal === 'weight_gain' || fitnessGoal === 'muscle_building') target = tdee + 300;

  return Math.max(1200, Math.round(target));
}

export function calculateMacroTargets(calorieTarget) {
  const cal = Math.max(1200, Number(calorieTarget) || 2000);
  return {
    proteinTarget: Math.round((cal * 0.25) / 4),
    carbTarget: Math.round((cal * 0.45) / 4),
    fatTarget: Math.round((cal * 0.30) / 9),
    fiberTarget: 30,
  };
}

export function predictMaintenanceCalories({
  weight,
  height,
  age,
  gender = 'male',
  activityLevel = 'moderately_active',
  fitnessGoal = 'maintenance',
}) {
  const bmr = calculateBMR({ weight, height, age, gender });
  if (bmr === null) return null;

  const act = ACTIVITY_LEVELS.find((a) => a.id === activityLevel);
  const activityMultiplier = act?.multiplier || 1.55;
  const maintenanceCalories = Math.round(bmr * activityMultiplier);
  const calorieTarget = calculateGoalCalorieTarget(maintenanceCalories, fitnessGoal);

  return {
    bmr,
    activityMultiplier,
    maintenanceCalories,
    calorieTarget,
    ...calculateMacroTargets(calorieTarget),
  };
}
