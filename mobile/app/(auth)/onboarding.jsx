import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Dimensions, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card } from '../../components/ui';
import { Colors, Typography, FITNESS_GOALS, ACTIVITY_LEVELS, DIETARY_PREFERENCES } from '../../constants';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { predictMaintenanceCalories } from '../../utils/calorieCalculator';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 6;

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setProfile } = useAuthStore();
  const { showToast } = useAppStore();
  const scrollRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const useNative = Platform.OS !== 'web';

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    goal: '',
    gender: '',
    age: '',
    height: '',
    currentWeight: '',
    targetWeight: '',
    activityLevel: 'moderately_active',
    daysPerWeek: 3,
    dietaryPreference: 'non_vegetarian',
    allergies: '',
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      Animated.timing(slideAnim, { toValue: -(step + 1) * width, duration: 300, useNativeDriver: useNative }).start();
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      Animated.timing(slideAnim, { toValue: -(step - 1) * width, duration: 300, useNativeDriver: useNative }).start();
      setStep(s => s - 1);
    }
  };

  const weight = parseFloat(form.currentWeight) || 70;
  const height = parseFloat(form.height) || 170;
  const age = parseInt(form.age, 10) || 25;
  const gender = form.gender || 'male';
  const predicted = predictMaintenanceCalories({
    weight,
    height,
    age,
    gender,
    activityLevel: form.activityLevel,
    fitnessGoal: form.goal,
  });
  const bmr = predicted?.bmr || 1650;
  const targets = {
    tdee: predicted?.maintenanceCalories || 2558,
    calorieTarget: predicted?.calorieTarget || 2558,
    proteinTarget: predicted?.proteinTarget || 160,
    carbTarget: predicted?.carbTarget || 288,
    fatTarget: predicted?.fatTarget || 85,
    fiberTarget: predicted?.fiberTarget || 30,
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const payload = {
        age: parseInt(form.age),
        gender: form.gender,
        height: parseFloat(form.height),
        currentWeight: parseFloat(form.currentWeight),
        targetWeight: parseFloat(form.targetWeight),
        activityLevel: form.activityLevel,
        fitnessGoal: form.goal,
        dietaryPreference: form.dietaryPreference,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()) : [],
        bmr,
        tdee: targets.tdee,
        calorieTarget: targets.calorieTarget,
        proteinTarget: targets.proteinTarget,
        carbTarget: targets.carbTarget,
        fatTarget: targets.fatTarget,
        fiberTarget: targets.fiberTarget,
        waterTarget: 2500,
        stepTarget: 8000,
        sleepTarget: 8,
        onboardingCompleted: true,
      };
      const res = await api.put('/auth/profile', payload);
      setProfile(res.data?.data || { ...(useAuthStore.getState().profile || {}), ...payload });
      router.replace('/(tabs)/home');
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    <View key="goal" style={{ width, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 }}>
        What's your main goal? 🎯
      </Text>
      <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, marginBottom: 24 }}>
        We'll personalize everything for you
      </Text>
      <View style={{ gap: 10 }}>
        {FITNESS_GOALS.map(g => (
          <TouchableOpacity
            key={g.id}
            onPress={() => update('goal', g.id)}
            style={{
              flexDirection: 'row', alignItems: 'center', padding: 16,
              backgroundColor: form.goal === g.id ? Colors.primary[50] : Colors.white,
              borderRadius: 14, borderWidth: 2,
              borderColor: form.goal === g.id ? Colors.primary[500] : Colors.border,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 28 }}>{g.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textPrimary }}>{g.label}</Text>
              <Text style={{ fontSize: Typography.sizes.sm, color: Colors.textSecondary }}>{g.description}</Text>
            </View>
            {form.goal === g.id && <Text style={{ color: Colors.primary[500], fontSize: 20 }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
      <Button title="Continue" onPress={goNext} disabled={!form.goal} style={{ marginTop: 24 }} />
    </View>,
    <View key="personal" style={{ width, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 }}>
        Tell us about you 👤
      </Text>
      <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, marginBottom: 24 }}>
        Used to personalize your nutrition plan
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {['male', 'female', 'other'].map(g => (
          <TouchableOpacity
            key={g}
            onPress={() => update('gender', g)}
            style={{
              flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
              backgroundColor: form.gender === g ? Colors.primary[500] : Colors.white,
              borderWidth: 2, borderColor: form.gender === g ? Colors.primary[500] : Colors.border,
            }}
          >
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{g === 'male' ? '👨' : g === 'female' ? '👩' : '🧑'}</Text>
            <Text style={{ fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: form.gender === g ? Colors.white : Colors.textPrimary, textTransform: 'capitalize' }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input label="Age" placeholder="e.g. 25" value={form.age} onChangeText={v => update('age', v)} keyboardType="numeric" />
      <Button title="Continue" onPress={goNext} disabled={!form.gender || !form.age} />
    </View>,
    <View key="body" style={{ width, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 }}>
        Your measurements 📏
      </Text>
      <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, marginBottom: 24 }}>
        All units are metric (cm and kg)
      </Text>
      <Input label="Height (cm)" placeholder="e.g. 175" value={form.height} onChangeText={v => update('height', v)} keyboardType="numeric" />
      <Input label="Current Weight (kg)" placeholder="e.g. 75" value={form.currentWeight} onChangeText={v => update('currentWeight', v)} keyboardType="numeric" />
      <Input label="Target Weight (kg)" placeholder="e.g. 68" value={form.targetWeight} onChangeText={v => update('targetWeight', v)} keyboardType="numeric" />
      <Button title="Continue" onPress={goNext} disabled={!form.height || !form.currentWeight || !form.targetWeight} />
    </View>,
    <View key="activity" style={{ width, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 }}>
        How active are you? 🏃
      </Text>
      <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, marginBottom: 24 }}>
        This helps us calculate your calorie needs
      </Text>
      <View style={{ gap: 10 }}>
        {ACTIVITY_LEVELS.map(level => (
          <TouchableOpacity
            key={level.id}
            onPress={() => update('activityLevel', level.id)}
            style={{
              padding: 16, borderRadius: 14,
              backgroundColor: form.activityLevel === level.id ? Colors.primary[50] : Colors.white,
              borderWidth: 2, borderColor: form.activityLevel === level.id ? Colors.primary[500] : Colors.border,
            }}
          >
            <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textPrimary }}>{level.label}</Text>
            <Text style={{ fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 }}>{level.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button title="Continue" onPress={goNext} style={{ marginTop: 24 }} />
    </View>,
    <View key="diet" style={{ width, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 }}>
        Your food preferences 🥗
      </Text>
      <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, marginBottom: 24 }}>
        We'll suggest meals that match your diet
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {DIETARY_PREFERENCES.map(d => (
          <TouchableOpacity
            key={d.id}
            onPress={() => update('dietaryPreference', d.id)}
            style={{
              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
              backgroundColor: form.dietaryPreference === d.id ? Colors.primary[500] : Colors.white,
              borderWidth: 2, borderColor: form.dietaryPreference === d.id ? Colors.primary[500] : Colors.border,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
          >
            <Text style={{ fontSize: 18 }}>{d.icon}</Text>
            <Text style={{ fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: form.dietaryPreference === d.id ? Colors.white : Colors.textPrimary }}>{d.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input label="Food Allergies (optional)" placeholder="e.g. peanuts, shellfish" value={form.allergies} onChangeText={v => update('allergies', v)} autoCapitalize="none" />
      <Button title="Continue" onPress={goNext} />
    </View>,
    <View key="summary" style={{ width, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 4 }}>
        Your personalized plan ✨
      </Text>
      <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, marginBottom: 24 }}>
        Based on your goals and body metrics
      </Text>
      <View style={{ backgroundColor: Colors.primary[500], borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <Text style={{ fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Daily Calorie Target</Text>
        <Text style={{ fontSize: Typography.sizes['4xl'], fontWeight: Typography.weights.bold, color: Colors.white }}>
          {targets.calorieTarget}
        </Text>
        <Text style={{ fontSize: Typography.sizes.base, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
          kcal / day (TDEE: {targets.tdee} kcal)
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Protein', value: `${targets.proteinTarget}g`, color: Colors.secondary[500] },
          { label: 'Carbs', value: `${targets.carbTarget}g`, color: Colors.warning },
          { label: 'Fat', value: `${targets.fatTarget}g`, color: Colors.accent },
        ].map(m => (
          <View key={m.label} style={{ flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: m.color + '40' }}>
            <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: m.color }}>{m.value}</Text>
            <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 }}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ backgroundColor: Colors.neutral[50], borderRadius: 14, padding: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textMuted, lineHeight: 18, textAlign: 'center' }}>
          ⚕️ Fitly provides general wellness information. These targets are estimates based on standard formulas and are not medical advice. Consult a healthcare professional for personalized medical guidance.
        </Text>
      </View>
      <Button title="Start My Journey 🚀" onPress={handleFinish} loading={loading} size="lg" />
    </View>,
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          {step > 0 && (
            <TouchableOpacity onPress={goBack} style={{ marginRight: 12 }}>
              <Text style={{ color: Colors.primary[500], fontWeight: Typography.weights.semibold }}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1, height: 4, borderRadius: 2,
                  backgroundColor: i <= step ? Colors.primary[500] : Colors.neutral[200],
                }}
              />
            ))}
          </View>
          <Text style={{ marginLeft: 12, fontSize: Typography.sizes.sm, color: Colors.textSecondary }}>
            {step + 1}/{TOTAL_STEPS}
          </Text>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <Animated.View
            style={{
              flexDirection: 'row',
              width: width * TOTAL_STEPS,
              transform: [{ translateX: slideAnim }],
            }}
          >
            {steps}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
