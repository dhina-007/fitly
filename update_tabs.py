import os

tabs_dir = "/Users/dhinagar/Documents/antigravity/Fitly/mobile/app/(tabs)"

# 1. Home Screen (home.jsx)
home_jsx = '''import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { Card, ProgressRing } from '../../components/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const name = user?.displayName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const [waterMl, setWaterMl] = useState(1500);
  const targetWater = 2500;

  const quickActions = [
    { label: 'Ria AI Coach', emoji: '🤖', route: '/ai-coach', color: Colors.primary[50], border: Colors.primary[200] },
    { label: 'Log Food', emoji: '🥗', route: '/food-search', color: '#ECFDF5', border: '#A7F3D0' },
    { label: 'Fasting Timer', emoji: '⏳', route: '/fasting', color: '#FFFBEB', border: '#FDE68A' },
    { label: 'Start Workout', emoji: '🏋️', route: '/workout-active', color: '#EFF6FF', border: '#BFDBFE' },
    { label: 'Healthy Recipes', emoji: '🥘', route: '/recipes', color: '#FDF2F8', border: '#FBCFE8' },
    { label: 'Habit Tracker', emoji: '⚡', route: '/habits', color: '#F3E8FF', border: '#DDD6FE' }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>
              {greeting}, {name}! 👋
            </Text>
            <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 }}>{today}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/community')} style={{ backgroundColor: Colors.primary[50], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderLineWidth: 1, borderColor: Colors.primary[200] }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary[700] }}>💬 Community</Text>
          </TouchableOpacity>
        </View>

        {/* Health Score Ring & Calorie Summary Card */}
        <Card style={{ alignItems: 'center', padding: 22, gap: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Daily Health Overview</Text>
            <Text style={{ fontSize: 10, backgroundColor: Colors.success + '20', color: Colors.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontWeight: '800' }}>HEALTH SCORE 88/100</Text>
          </View>

          <ProgressRing size={150} strokeWidth={13} progress={0.55} color={Colors.primary[600]} label="1,100" sublabel="of 2,000 kcal" />

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingTop: 6 }}>
            {[
              { label: 'Eaten', value: '1,100', color: Colors.primary[600] },
              { label: 'Burned', value: '350', color: Colors.secondary[600] },
              { label: 'Remaining', value: '1,250', color: Colors.success }
            ].map(i => (
              <View key={i.label} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: i.color }}>{i.value}</Text>
                <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>{i.label} kcal</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Quick Tools Grid */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Quick Features (100% Unlocked)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(action.route)}
                style={{
                  width: '48%', backgroundColor: action.color, borderWidth: 1, borderColor: action.border,
                  borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10
                }}
              >
                <Text style={{ fontSize: 24 }}>{action.emoji}</Text>
                <Text style={{ fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.textPrimary, flex: 1 }}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Macro Progress Bars */}
        <Card style={{ padding: 18, gap: 12 }}>
          <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Macronutrients Breakdown</Text>
          {[
            { label: 'Protein', current: 65, goal: 120, color: Colors.primary[600], unit: 'g' },
            { label: 'Carbohydrates', current: 140, goal: 250, color: Colors.warning, unit: 'g' },
            { label: 'Fats', current: 32, goal: 65, color: Colors.accent, unit: 'g' },
          ].map(m => (
            <View key={m.label} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: Typography.sizes.xs, fontWeight: Typography.weights.medium, color: Colors.textPrimary }}>{m.label}</Text>
                <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: '600' }}>{m.current}/{m.goal}{m.unit}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: Colors.neutral[100], borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, (m.current / m.goal) * 100)}%`, height: '100%', backgroundColor: m.color, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </Card>

        {/* Quick Log Widgets */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Water Logger */}
          <Card style={{ flex: 1, padding: 14, gap: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>💧</Text>
            <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{(waterMl/1000).toFixed(1)}L / 2.5L</Text>
            <Text style={{ fontSize: 10, color: Colors.textMuted }}>Hydration Goal</Text>
            <TouchableOpacity
              onPress={() => setWaterMl(w => Math.min(4000, w + 250))}
              style={{ backgroundColor: Colors.primary[600], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 4 }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 10 }}>+250ml Glass</Text>
            </TouchableOpacity>
          </Card>

          {/* Steps & Sleep */}
          <Card style={{ flex: 1, padding: 14, gap: 8, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>🚶</Text>
              <View>
                <Text style={{ fontSize: Typography.sizes.sm, fontWeight: 'bold', color: Colors.textPrimary }}>5,420 steps</Text>
                <Text style={{ fontSize: 10, color: Colors.textMuted }}>Goal: 8,000</Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: Colors.neutral[200] }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>😴</Text>
              <View>
                <Text style={{ fontSize: Typography.sizes.sm, fontWeight: 'bold', color: Colors.textPrimary }}>7.5 hrs</Text>
                <Text style={{ fontSize: 10, color: Colors.textMuted }}>Sleep Score: 92/100</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
''';

# 2. Nutrition Screen (nutrition.jsx)
nutrition_jsx = '''import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../../constants';
import { Card } from '../../components/ui';

export default function NutritionScreen() {
  const router = useRouter();

  const meals = [
    { title: 'Breakfast', emoji: '🍳', kcal: 320, items: ['Moong Dal Chila (2 pcs)', 'Black Coffee'] },
    { title: 'Lunch', emoji: '🍱', kcal: 450, items: ['Dal Tadka (1 bowl)', 'Roti (2 pcs)', 'Cucumber Salad'] },
    { title: 'Dinner', emoji: '🥗', kcal: 330, items: ['Grilled Paneer (150g)', 'Steamed Broccoli'] },
    { title: 'Snacks', emoji: '🍎', kcal: 110, items: ['Roasted Makhana (30g)'] }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Food Journal 🥗</Text>
          <TouchableOpacity onPress={() => router.push('/recipes')} style={{ backgroundColor: Colors.primary[50], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
            <Text style={{ color: Colors.primary[700], fontWeight: '700', fontSize: 12 }}>📖 Recipe Book</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Summary Bar */}
        <Card style={{ padding: 16, backgroundColor: Colors.primary[600], flexDirection: 'row', justifyContent: 'space-around', borderRadius: 16 }}>
          {[
            { label: 'Calories', val: '1,210 / 2,000' },
            { label: 'Protein', val: '68g / 120g' },
            { label: 'Carbs', val: '135g / 250g' }
          ].map(s => (
            <View key={s.label} style={{ alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>{s.label}</Text>
              <Text style={{ color: '#FFF', fontSize: Typography.sizes.sm, fontWeight: 'bold', marginTop: 2 }}>{s.val}</Text>
            </View>
          ))}
        </Card>

        {/* Meals List */}
        {meals.map(m => (
          <Card key={m.title} style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{m.title}</Text>
              </View>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.primary[600], fontWeight: 'bold' }}>{m.kcal} kcal</Text>
            </View>
            <View style={{ gap: 4 }}>
              {m.items.map((it, idx) => (
                <Text key={idx} style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>• {it}</Text>
              ))}
            </View>
            <TouchableOpacity onPress={() => router.push('/food-search')} style={{ backgroundColor: Colors.neutral[100], paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginTop: 4 }}>
              <Text style={{ color: Colors.primary[600], fontWeight: 'bold', fontSize: 12 }}>+ Add {m.title}</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
''';

# 3. Workout Screen (workout.jsx)
workout_jsx = '''import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../../constants';
import { Card } from '../../components/ui';

export default function WorkoutScreen() {
  const router = useRouter();

  const routines = [
    { title: 'Push Day (Chest, Shoulders & Triceps)', duration: '45 mins', exercises: 6, level: 'Intermediate', emoji: '💪' },
    { title: 'Pull Day (Back & Biceps)', duration: '50 mins', exercises: 6, level: 'Intermediate', emoji: '🏋️‍♂️' },
    { title: 'Legs & Core Sculpt', duration: '40 mins', exercises: 5, level: 'Advanced', emoji: '🦵' },
    { title: 'Full Body Home Bodyweight HIIT', duration: '25 mins', exercises: 5, level: 'Beginner', emoji: '🔥' }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Workouts & Routines 🏋️</Text>
          <TouchableOpacity onPress={() => router.push('/workout-active')} style={{ backgroundColor: Colors.primary[600], paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>+ Custom Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Active Session Card */}
        <Card style={{ padding: 20, backgroundColor: Colors.primary[700], gap: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, textTransform: 'uppercase', fontWeight: '800' }}>READY TO TRAIN?</Text>
          <Text style={{ color: '#FFF', fontSize: Typography.sizes.lg, fontWeight: 'bold' }}>Start Empty Session</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: Typography.sizes.xs }}>Log your sets, reps, weights, and rest timer in real-time.</Text>
          <TouchableOpacity onPress={() => router.push('/workout-active')} style={{ backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: Colors.primary[800], fontWeight: 'bold', fontSize: Typography.sizes.sm }}>Start Workout Now</Text>
          </TouchableOpacity>
        </Card>

        {/* Pre-built Routines */}
        <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Pre-Built Workout Routines (Free)</Text>
        {routines.map(r => (
          <Card key={r.title} style={{ padding: 16, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
              <Text style={{ fontSize: 10, backgroundColor: Colors.primary[50], color: Colors.primary[700], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' }}>{r.level}</Text>
            </View>
            <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{r.title}</Text>
            <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>⏱️ {r.duration} • {r.exercises} Exercises</Text>
            <TouchableOpacity onPress={() => router.push('/workout-active')} style={{ backgroundColor: Colors.neutral[100], paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 4 }}>
              <Text style={{ color: Colors.primary[600], fontWeight: 'bold', fontSize: 12 }}>Start Routine</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
''';

# 4. Progress Screen (progress.jsx)
progress_jsx = '''import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants';
import { Card } from '../../components/ui';

export default function ProgressScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Progress Analytics 📈</Text>

        {/* Weight Loss Chart Simulation */}
        <Card style={{ padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Weight Trend (30 Days)</Text>
            <Text style={{ fontSize: Typography.sizes.xs, color: Colors.success, fontWeight: 'bold' }}>-2.4 kg lost 🎉</Text>
          </View>

          <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
            {[74.5, 74.2, 73.8, 73.5, 73.0, 72.8, 72.1].map((wt, idx) => (
              <View key={idx} style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 9, color: Colors.textMuted }}>{wt}</Text>
                <View style={{ width: 18, height: (wt - 70) * 20, backgroundColor: Colors.primary[500], borderRadius: 4 }} />
                <Text style={{ fontSize: 9, color: Colors.textSecondary }}>W{idx+1}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Habit Heatmap */}
        <Card style={{ padding: 18, gap: 12 }}>
          <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Weekly Streak Consistency</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <View key={day} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: i < 5 ? Colors.success : Colors.neutral[200], alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: i < 5 ? '#FFF' : Colors.textMuted, fontWeight: 'bold', fontSize: 12 }}>{i < 5 ? '✓' : ''}</Text>
                </View>
                <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{day}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
''';

# 5. Profile Screen (profile.jsx)
profile_jsx = '''import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>User Profile 👤</Text>

        {/* Zero Paywall Badge Card */}
        <Card style={{ padding: 18, backgroundColor: Colors.primary[50], borderLineWidth: 1, borderColor: Colors.primary[200], gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 24 }}>💚</Text>
            <View>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.primary[900] }}>HealthFit 100% Free Guarantee</Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.primary[700] }}>No paywall, no subscriptions, all features unlocked for everyone.</Text>
            </View>
          </View>
        </Card>

        {/* User Stats Card */}
        <Card style={{ padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary[600], alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 22, fontWeight: 'bold' }}>{user?.displayName?.[0] || 'U'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{user?.displayName || 'HealthFit User'}</Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>{user?.email || 'user@healthfit.app'}</Text>
            </View>
          </View>
        </Card>

        {/* App Settings Options */}
        <Card style={{ gap: 4, padding: 10 }}>
          {[
            { title: 'Ria AI Health Coach', icon: '🤖', action: () => router.push('/ai-coach') },
            { title: 'Intermittent Fasting Timer', icon: '⏳', action: () => router.push('/fasting') },
            { title: 'Healthy Recipe Library', icon: '🥗', action: () => router.push('/recipes') },
            { title: 'Daily Habits Tracker', icon: '⚡', action: () => router.push('/habits') },
            { title: 'Community & Challenges', icon: '👥', action: () => router.push('/community') },
          ].map(item => (
            <TouchableOpacity key={item.title} onPress={item.action} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutral[100] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                <Text style={{ fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textPrimary }}>{item.title}</Text>
              </View>
              <Text style={{ fontSize: 16, color: Colors.textMuted }}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        <TouchableOpacity onPress={logout} style={{ backgroundColor: Colors.error + '15', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 }}>
          <Text style={{ color: Colors.error, fontWeight: 'bold', fontSize: Typography.sizes.sm }}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
''';

with open(os.path.join(tabs_dir, 'home.jsx'), 'w') as f:
    f.write(home_jsx)

with open(os.path.join(tabs_dir, 'nutrition.jsx'), 'w') as f:
    f.write(nutrition_jsx)

with open(os.path.join(tabs_dir, 'workout.jsx'), 'w') as f:
    f.write(workout_jsx)

with open(os.path.join(tabs_dir, 'progress.jsx'), 'w') as f:
    f.write(progress_jsx)

with open(os.path.join(tabs_dir, 'profile.jsx'), 'w') as f:
    f.write(profile_jsx)

print("All tab screens updated with full navigation and feature integrations!")
