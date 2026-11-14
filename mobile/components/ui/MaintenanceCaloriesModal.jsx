import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, BorderRadius, ACTIVITY_LEVELS } from '../../constants';
import { Input } from './Input';
import { Button } from './Button';
import { Icon } from './Icon';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import {
  predictMaintenanceCalories,
  calculateGoalCalorieTarget,
  calculateMacroTargets,
} from '../../utils/calorieCalculator';

const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

const GOALS = [
  { id: 'weight_loss', label: 'Weight Loss (-500)' },
  { id: 'maintenance', label: 'Maintain' },
  { id: 'muscle_building', label: 'Muscle (+300)' },
  { id: 'weight_gain', label: 'Weight Gain (+300)' },
];

export function MaintenanceCaloriesModal({ visible, onClose }) {
  const queryClient = useQueryClient();
  const { profile, setProfile } = useAuthStore();
  const { showToast } = useAppStore();

  const [weight, setWeight] = useState('71');
  const [height, setHeight] = useState('173');
  const [age, setAge] = useState('26');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderately_active');
  const [fitnessGoal, setFitnessGoal] = useState('maintenance');
  const [isCustom, setIsCustom] = useState(false);
  const [customMaintenance, setCustomMaintenance] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      const w = profile?.currentWeight ? String(profile.currentWeight) : '71';
      const h = profile?.height ? String(profile.height) : '173';
      const a = profile?.age ? String(profile.age) : '26';
      const g = profile?.gender || 'male';
      const act = profile?.activityLevel || 'moderately_active';
      const goal = profile?.fitnessGoal || 'maintenance';

      setWeight(w);
      setHeight(h);
      setAge(a);
      setGender(g);
      setActivityLevel(act);
      setFitnessGoal(goal);
      setErrorMsg('');

      const customFlag = Boolean(profile?.isCustomMaintenance);
      setIsCustom(customFlag);

      const predicted = predictMaintenanceCalories({
        weight: parseFloat(w),
        height: parseFloat(h),
        age: parseInt(a, 10),
        gender: g,
        activityLevel: act,
        fitnessGoal: goal,
      });

      if (customFlag && profile?.tdee) {
        setCustomMaintenance(String(profile.tdee));
      } else if (predicted?.maintenanceCalories) {
        setCustomMaintenance(String(predicted.maintenanceCalories));
      } else {
        setCustomMaintenance(profile?.tdee ? String(profile.tdee) : '2200');
      }
    }
  }, [visible, profile]);

  const prediction = useMemo(
    () =>
      predictMaintenanceCalories({
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: parseInt(age, 10),
        gender,
        activityLevel,
        fitnessGoal,
      }),
    [weight, height, age, gender, activityLevel, fitnessGoal]
  );

  // Keep maintenance input synced with auto-prediction while not manually overridden
  useEffect(() => {
    if (!isCustom && prediction?.maintenanceCalories) {
      setCustomMaintenance(String(prediction.maintenanceCalories));
    }
  }, [isCustom, prediction?.maintenanceCalories]);

  const effectiveMaintenance = isCustom
    ? Math.round(parseFloat(customMaintenance) || 0)
    : prediction?.maintenanceCalories || 0;

  const effectiveGoalTarget =
    effectiveMaintenance > 0
      ? calculateGoalCalorieTarget(effectiveMaintenance, fitnessGoal)
      : 2000;

  const handleMaintenanceTextChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setCustomMaintenance(cleaned);
    const num = parseInt(cleaned, 10);
    if (prediction?.maintenanceCalories && num === prediction.maintenanceCalories) {
      setIsCustom(false);
    } else {
      setIsCustom(true);
    }
  };

  const handleResetToAuto = () => {
    setIsCustom(false);
    if (prediction?.maintenanceCalories) {
      setCustomMaintenance(String(prediction.maintenanceCalories));
    }
  };

  const handleSave = async () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);
    const maint = parseInt(customMaintenance, 10);

    if (!Number.isFinite(w) || w < 20 || w > 350) {
      setErrorMsg('Please enter a valid weight (20–350 kg).');
      return;
    }
    if (!Number.isFinite(h) || h < 80 || h > 260) {
      setErrorMsg('Please enter a valid height (80–260 cm).');
      return;
    }
    if (!Number.isFinite(a) || a < 10 || a > 110) {
      setErrorMsg('Please enter a valid age (10–110 years).');
      return;
    }
    if (isCustom && (!Number.isFinite(maint) || maint < 800 || maint > 8000)) {
      setErrorMsg('Please enter a valid maintenance calorie value (800–8000 kcal).');
      return;
    }

    setErrorMsg('');
    setSaving(true);
    try {
      const targetCals = effectiveGoalTarget;
      const macros = calculateMacroTargets(targetCals);
      const payload = {
        currentWeight: w,
        height: h,
        age: a,
        gender,
        activityLevel,
        fitnessGoal,
        isCustomMaintenance: isCustom,
        tdee: isCustom ? maint : prediction?.maintenanceCalories,
        predictedTdee: prediction?.maintenanceCalories,
        bmr: prediction?.bmr,
        calorieTarget: targetCals,
        proteinTarget: macros.proteinTarget,
        carbTarget: macros.carbTarget,
        fatTarget: macros.fatTarget,
      };

      const res = await api.put('/auth/profile', payload);
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data);
      } else {
        setProfile({ ...(profile || {}), ...payload });
      }
      queryClient.invalidateQueries(['dashboardAnalytics']);
      queryClient.invalidateQueries(['userProfile']);
      showToast(
        isCustom
          ? `Maintenance calories updated to ${maint.toLocaleString()} kcal/day`
          : `Auto-predicted maintenance: ${prediction?.maintenanceCalories?.toLocaleString()} kcal/day`,
        'success'
      );
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Could not update maintenance calories');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Maintenance Calories</Text>
                <Text style={styles.subtitle}>
                  Auto-predicted from weight, height & age — or edit manually
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="X" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Body Metrics Row: Weight, Height, Age */}
            <View style={styles.metricsInputRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Weight (kg)"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="71"
                  testID="mc-weight-input"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Height (cm)"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="173"
                  testID="mc-height-input"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Age (yrs)"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="26"
                  testID="mc-age-input"
                />
              </View>
            </View>

            {/* Gender */}
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setGender(g.id)}
                  style={[styles.chip, gender === g.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, gender === g.id && styles.chipTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Activity Level */}
            <Text style={styles.fieldLabel}>Activity Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {ACTIVITY_LEVELS.map((act) => (
                  <TouchableOpacity
                    key={act.id}
                    onPress={() => setActivityLevel(act.id)}
                    style={[styles.chip, activityLevel === act.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, activityLevel === act.id && styles.chipTextActive]}>
                      {act.label} ({act.multiplier}x)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Live Prediction Preview Card */}
            <View style={styles.predictionBox}>
              <View style={styles.predictionTop}>
                <View style={styles.predictionLeft}>
                  <View style={styles.predBadge}>
                    <Icon name="Sparkles" size={12} color="#047857" />
                    <Text style={styles.predBadgeText}>AUTO-PREDICTED TDEE</Text>
                  </View>
                  <Text style={styles.predValue} testID="mc-predicted-value">
                    {prediction ? `${prediction.maintenanceCalories.toLocaleString()} kcal/day` : 'Enter metrics'}
                  </Text>
                  {prediction && (
                    <Text style={styles.predSub}>
                      Resting BMR: {prediction.bmr.toLocaleString()} kcal • Daily Target ({fitnessGoal.replace('_', ' ')}):{' '}
                      {effectiveGoalTarget.toLocaleString()} kcal
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Editable Maintenance Calories Override */}
            <View style={styles.overrideHeader}>
              <Text style={styles.fieldLabel}>
                Maintenance Calories (kcal/day) • {isCustom ? 'Custom Edited' : 'Auto Mode'}
              </Text>
              {isCustom && prediction?.maintenanceCalories && (
                <TouchableOpacity onPress={handleResetToAuto} testID="mc-reset-auto-btn">
                  <Text style={styles.resetAutoText}>
                    Reset to Auto ({prediction.maintenanceCalories} kcal)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Input
              value={customMaintenance}
              onChangeText={handleMaintenanceTextChange}
              keyboardType="numeric"
              placeholder="e.g. 2400"
              testID="mc-custom-calories-input"
            />

            {/* Goal Adjustment */}
            <Text style={styles.fieldLabel}>Daily Goal Adjustment</Text>
            <View style={styles.chipRow}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setFitnessGoal(g.id)}
                  style={[styles.chip, fitnessGoal === g.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, fitnessGoal === g.id && styles.chipTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

            <Button
              title={saving ? 'Saving...' : 'Save Maintenance Calories'}
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: Spacing.sm }}
              testID="mc-save-btn"
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '88%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  chipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  predictionBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  predictionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  predictionLeft: {
    flex: 1,
  },
  predBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  predBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.4,
  },
  predValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: '#065F46',
  },
  predSub: {
    fontSize: Typography.sizes.xs,
    color: '#047857',
    marginTop: 2,
  },
  overrideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  resetAutoText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[600],
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.semibold,
    marginBottom: 6,
  },
});

export default MaintenanceCaloriesModal;
