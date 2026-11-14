const test = require('node:test');
const assert = require('node:assert/strict');
const { predictMaintenanceCalories, calculateBMR } = require('../utils/calorieCalculator');

const BASE_URL = 'http://localhost:3000/api';
const MEMBER_AUTH = {
  Authorization: 'Bearer dev-token-dev-user-uid-12345',
  'Content-Type': 'application/json',
};

async function apiReq(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: MEMBER_AUTH,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

test('Mifflin-St Jeor BMR & maintenance calorie formula accuracy', () => {
  const male = predictMaintenanceCalories({
    weight: 71,
    height: 173,
    age: 26,
    gender: 'male',
    activityLevel: 'moderately_active',
    fitnessGoal: 'weight_loss',
  });
  assert.equal(male.bmr, 1666);
  assert.equal(male.maintenanceCalories, 2582);
  assert.equal(male.calorieTarget, 2082);

  const female = predictMaintenanceCalories({
    weight: 60,
    height: 165,
    age: 28,
    gender: 'female',
    activityLevel: 'lightly_active',
    fitnessGoal: 'maintenance',
  });
  assert.equal(female.bmr, 1330);
  assert.equal(female.maintenanceCalories, 1829);
  assert.equal(female.calorieTarget, 1829);

  assert.equal(calculateBMR({ weight: 0, height: 170, age: 25 }), null);
});

test('API auto-predicts maintenance calories from weight, height, age and supports manual edit + reset', async () => {
  const initialRes = await apiReq('/auth/profile');
  assert.equal(initialRes.status, 200);
  const orig = initialRes.data.data;

  try {
    // 1. Update weight, height, age in auto mode -> verifies automatic TDEE prediction
    const autoUpdate = await apiReq('/auth/profile', {
      method: 'PUT',
      body: {
        currentWeight: 75,
        height: 175,
        age: 30,
        gender: 'male',
        activityLevel: 'moderately_active',
        fitnessGoal: 'maintenance',
        isCustomMaintenance: false,
      },
    });
    assert.equal(autoUpdate.status, 200);
    // BMR = 750 + 1093.75 - 150 + 5 = 1699; TDEE = round(1699 * 1.55) = 2633
    assert.equal(autoUpdate.data.data.bmr, 1699);
    assert.equal(autoUpdate.data.data.tdee, 2633);
    assert.equal(autoUpdate.data.data.predictedTdee, 2633);
    assert.equal(autoUpdate.data.data.isCustomMaintenance, false);
    assert.equal(autoUpdate.data.data.calorieTarget, 2633);

    // 2. Dashboard analytics reflects predicted maintenance
    const dashAuto = await apiReq('/analytics/dashboard');
    assert.equal(dashAuto.status, 200);
    assert.equal(dashAuto.data.data.calories.maintenance, 2633);
    assert.equal(dashAuto.data.data.calories.predictedMaintenance, 2633);
    assert.equal(dashAuto.data.data.calories.isCustomMaintenance, false);

    // 3. User edits maintenance calories manually -> stays custom even if weight changes
    const customEdit = await apiReq('/auth/profile', {
      method: 'PUT',
      body: {
        tdee: 2400,
        isCustomMaintenance: true,
      },
    });
    assert.equal(customEdit.status, 200);
    assert.equal(customEdit.data.data.tdee, 2400);
    assert.equal(customEdit.data.data.predictedTdee, 2633);
    assert.equal(customEdit.data.data.isCustomMaintenance, true);
    assert.equal(customEdit.data.data.calorieTarget, 2400);

    // Weight changes while custom mode is active -> predictedTdee updates, custom tdee stays 2400
    const weightChangeCustom = await apiReq('/auth/profile', {
      method: 'PUT',
      body: { currentWeight: 80 },
    });
    assert.equal(weightChangeCustom.status, 200);
    assert.equal(weightChangeCustom.data.data.tdee, 2400);
    assert.equal(weightChangeCustom.data.data.isCustomMaintenance, true);
    assert.ok(weightChangeCustom.data.data.predictedTdee > 2633);

    // 4. Reset back to Auto -> restores predicted TDEE (for 80kg, 175cm, 30y -> BMR 1749, TDEE 2711)
    const resetAuto = await apiReq('/auth/profile', {
      method: 'PUT',
      body: { isCustomMaintenance: false },
    });
    assert.equal(resetAuto.status, 200);
    assert.equal(resetAuto.data.data.isCustomMaintenance, false);
    assert.equal(resetAuto.data.data.tdee, 2711);
    assert.equal(resetAuto.data.data.calorieTarget, 2711);
  } finally {
    await apiReq('/auth/profile', {
      method: 'PUT',
      body: {
        currentWeight: orig.currentWeight || 71,
        height: orig.height || 173,
        age: orig.age || 26,
        gender: orig.gender || 'male',
        activityLevel: orig.activityLevel || 'moderately_active',
        fitnessGoal: orig.fitnessGoal || 'weight_loss',
        isCustomMaintenance: Boolean(orig.isCustomMaintenance),
        ...(orig.isCustomMaintenance && orig.tdee ? { tdee: orig.tdee } : {}),
      },
    });
  }
});
