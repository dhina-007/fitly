import os

base_dir = "/Users/dhinagar/Documents/antigravity/Fitly/mobile"
files = {
    "app/(auth)/onboarding.jsx": """import React, { useState, useRef } from 'react';
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

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 6;

function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
}

function calculateTargets(bmr, activityMultiplier, goal) {
  const tdee = Math.round(bmr * activityMultiplier);
  let calorieTarget = tdee;
  if (goal === 'weight_loss') calorieTarget = tdee - 500;
  else if (goal === 'weight_gain' || goal === 'muscle_building') calorieTarget = tdee + 300;

  calorieTarget = Math.max(1200, calorieTarget);

  return {
    tdee,
    calorieTarget,
    proteinTarget: Math.round((calorieTarget * 0.25) / 4),
    carbTarget: Math.round((calorieTarget * 0.45) / 4),
    fatTarget: Math.round((calorieTarget * 0.30) / 9),
    fiberTarget: 30,
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showToast } = useAppStore();
  const scrollRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(slideAnim, { toValue: -(step + 1) * width, duration: 300, useNativeDriver: true }).start();
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      Animated.timing(slideAnim, { toValue: -(step - 1) * width, duration: 300, useNativeDriver: true }).start();
      setStep(s => s - 1);
    }
  };

  const weight = parseFloat(form.currentWeight) || 70;
  const height = parseFloat(form.height) || 170;
  const age = parseInt(form.age) || 25;
  const gender = form.gender || 'male';
  const actLevel = ACTIVITY_LEVELS.find(a => a.id === form.activityLevel);
  const multiplier = actLevel?.multiplier || 1.55;
  const bmr = calculateBMR(weight, height, age, gender);
  const targets = calculateTargets(bmr, multiplier, form.goal);

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
      await api.put('/auth/profile', payload);
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
          ⚕️ HealthFit provides general wellness information. These targets are estimates based on standard formulas and are not medical advice. Consult a healthcare professional for personalized medical guidance.
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
""",
    "app/(tabs)/_layout.jsx": """import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Home, UtensilsCrossed, Dumbbell, TrendingUp, User } from 'lucide-react-native';
import { Colors, Typography } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

function TabIcon({ icon: Icon, label, focused }) {
  return (
    <View style={{ alignItems: 'center', gap: 2, paddingTop: 6 }}>
      <Icon size={22} color={focused ? Colors.primary[500] : Colors.textMuted} strokeWidth={focused ? 2.5 : 1.5} />
      <Text style={{ fontSize: 10, fontWeight: focused ? '700' : '500', color: focused ? Colors.primary[500] : Colors.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, initialized]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 70,
          paddingBottom: 10,
          paddingTop: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="home" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Home} label="Home" focused={focused} /> }} />
      <Tabs.Screen name="nutrition" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={UtensilsCrossed} label="Nutrition" focused={focused} /> }} />
      <Tabs.Screen name="workout" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Dumbbell} label="Workout" focused={focused} /> }} />
      <Tabs.Screen name="progress" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={TrendingUp} label="Progress" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User} label="Profile" focused={focused} /> }} />
    </Tabs>
  );
}
""",
    "app/(tabs)/home.jsx": """import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { Card, ProgressRing } from '../../components/ui';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const name = user?.displayName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>
            {greeting}, {name}! 👋
          </Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 }}>{today}</Text>
        </View>

        <Card style={{ alignItems: 'center', padding: 24, gap: 20 }}>
          <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Today's Calories</Text>
          <ProgressRing size={140} strokeWidth={12} progress={0.4} color={Colors.primary[500]} label="800" sublabel="of 2000 kcal" />
          <View style={{ flexDirection: 'row', gap: 24 }}>
            {[{ label: 'Eaten', value: '800', color: Colors.primary[500] }, { label: 'Remaining', value: '1200', color: Colors.success }].map(i => (
              <View key={i.label} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: i.color }}>{i.value}</Text>
                <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>{i.label} kcal</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 16 }}>Macros</Text>
          {[
            { label: 'Protein', current: 45, goal: 120, color: Colors.secondary[500], unit: 'g' },
            { label: 'Carbs', current: 100, goal: 250, color: Colors.warning, unit: 'g' },
            { label: 'Fat', current: 22, goal: 65, color: Colors.accent, unit: 'g' },
          ].map(m => (
            <View key={m.label} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textPrimary }}>{m.label}</Text>
                <Text style={{ fontSize: Typography.sizes.sm, color: Colors.textSecondary }}>{m.current}/{m.goal}{m.unit}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: Colors.neutral[100], borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${(m.current / m.goal) * 100}%`, height: '100%', backgroundColor: m.color, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </Card>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[
            { emoji: '💧', label: 'Water', value: '1.5L', sub: 'of 2.5L' },
            { emoji: '🚶', label: 'Steps', value: '4,523', sub: 'of 8,000' },
            { emoji: '😴', label: 'Sleep', value: '7.5h', sub: 'of 8h' },
          ].map(s => (
            <Card key={s.label} style={{ flex: 1, alignItems: 'center', padding: 16, gap: 4 }}>
              <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{s.value}</Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>{s.sub}</Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textMuted }}>{s.label}</Text>
            </Card>
          ))}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
""",
    "app/(tabs)/nutrition.jsx": """import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { Colors, Typography, MEAL_TYPES } from '../../constants';
import { Card } from '../../components/ui';

const mealIcons = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍎', Drinks: '🥤' };
const mealData = { Breakfast: 320, Lunch: 480, Dinner: 0, Snacks: 0, Drinks: 0 };

export default function NutritionScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Nutrition 🍽️</Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: Colors.textSecondary }}>Today</Text>
        </View>
        <Card style={{ backgroundColor: Colors.primary[500], padding: 20 }}>
          <Text style={{ fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Total Calories Today</Text>
          <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: Typography.weights.bold, color: Colors.white }}>800 / 2000 kcal</Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>1200 kcal remaining</Text>
        </Card>
        {MEAL_TYPES.map(meal => (
          <Card key={meal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: mealData[meal] > 0 ? 12 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>{mealIcons[meal]}</Text>
                <View>
                  <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textPrimary }}>{meal}</Text>
                  <Text style={{ fontSize: Typography.sizes.sm, color: Colors.textSecondary }}>
                    {mealData[meal] > 0 ? `${mealData[meal]} kcal` : 'No foods logged'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color={Colors.primary[500]} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
""",
    "app/(tabs)/workout.jsx": """import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants';
import { Card } from '../../components/ui';

const categories = [
  { id: 'weight_loss', label: 'Weight Loss', icon: '🔥', color: '#FF6B6B' },
  { id: 'muscle_building', label: 'Muscle Building', icon: '💪', color: '#2979FF' },
  { id: 'cardio', label: 'Cardio', icon: '🏃', color: '#00BFA5' },
  { id: 'hiit', label: 'HIIT', icon: '⚡', color: '#FF9800' },
  { id: 'home', label: 'Home', icon: '🏠', color: '#9C27B0' },
  { id: 'beginner', label: 'Beginner', icon: '🌱', color: '#4CAF50' },
];

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Workouts 🏋️</Text>
        <Card style={{ backgroundColor: Colors.primary[50], borderWidth: 2, borderColor: Colors.primary[200] }}>
          <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.primary[700] }}>Today's Workout</Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: Colors.primary[600], marginTop: 4 }}>No workout planned — pick one below!</Text>
        </Card>
        <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Browse by Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {categories.map(c => (
            <TouchableOpacity key={c.id} style={{ width: '47%', backgroundColor: Colors.white, borderRadius: 16, padding: 18, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: 32 }}>{c.icon}</Text>
              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, textAlign: 'center' }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
""",
    "app/(tabs)/progress.jsx": """import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants';
import { Card } from '../../components/ui';

const trackers = [
  { emoji: '⚖️', label: 'Weight', sub: '82 kg → 72 kg goal', color: Colors.primary[500] },
  { emoji: '🍽️', label: 'Calories', sub: 'Avg 1,850 kcal/day', color: Colors.warning },
  { emoji: '🚶', label: 'Steps', sub: 'Avg 6,200 steps/day', color: Colors.secondary[500] },
  { emoji: '💧', label: 'Water', sub: 'Avg 2.1L/day', color: '#29B6F6' },
  { emoji: '😴', label: 'Sleep', sub: 'Avg 7.2h/night', color: '#9C27B0' },
  { emoji: '✅', label: 'Habits', sub: '5/7 habits this week', color: Colors.success },
];

export default function ProgressScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Progress 📈</Text>
        <View style={{ gap: 12 }}>
          {trackers.map(t => (
            <TouchableOpacity key={t.label}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textPrimary }}>{t.label}</Text>
                  <Text style={{ fontSize: Typography.sizes.sm, color: Colors.textSecondary }}>{t.sub}</Text>
                </View>
                <Text style={{ color: Colors.textMuted, fontSize: 18 }}>›</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
""",
    "app/(tabs)/profile.jsx": """import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Settings, Bell, Shield, Download } from 'lucide-react-native';
import { Colors, Typography } from '../../constants';
import { Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';

export default function ProfileScreen() {
  const { user, profile, logout } = useAuthStore();
  const router = useRouter();
  const name = profile?.name || user?.displayName || 'User';
  const email = profile?.email || user?.email || '';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await authService.logout();
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: Settings, label: 'Account Settings', onPress: () => {} },
    { icon: Bell, label: 'Notifications', onPress: () => {} },
    { icon: Shield, label: 'Privacy & Security', onPress: () => {} },
    { icon: Download, label: 'Export My Data', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Profile 👤</Text>
        <Card style={{ alignItems: 'center', padding: 24, gap: 12 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 36, color: Colors.white }}>{name[0]?.toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{name}</Text>
          <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary }}>{email}</Text>
        </Card>
        <Card style={{ gap: 4 }}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14,
                borderBottomWidth: i < menuItems.length - 1 ? 1 : 0,
                borderBottomColor: Colors.border,
              }}
            >
              <item.icon size={20} color={Colors.textSecondary} />
              <Text style={{ flex: 1, fontSize: Typography.sizes.base, color: Colors.textPrimary }}>{item.label}</Text>
              <Text style={{ color: Colors.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>
        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: Colors.error + '10', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' }}
        >
          <LogOut size={20} color={Colors.error} />
          <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.error }}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
          HealthFit v1.0.0\nAll features are free for all users.\nNo subscriptions, no paywalls.
        </Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
"""
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
print("Files created")
