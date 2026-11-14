import os

mobile_app_dir = "/Users/dhinagar/Documents/antigravity/Fitly/mobile/app"

# 1. Ria AI Coach Screen (app/ai-coach.jsx)
ai_coach_screen = '''import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../constants';
import { Card } from '../components/ui';

export default function AICoachScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ria',
      text: "👋 Hi! I'm **Ria**, your 100% free AI Health & Fitness Coach. Ask me anything about nutrition, workout routines, sleep optimization, or diet plans!",
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const quickPrompts = [
    "🍎 Suggest a 400 kcal high-protein lunch",
    "💪 Give me a 20-min home HIIT workout",
    "💧 How much water should I drink today?",
    "😴 Tips to improve deep sleep score"
  ];

  const handleSend = (textToSend) => {
    const msg = textToSend || inputText;
    if (!msg.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      let riaResponse = "That's a great question! For your overall health goal, maintaining balanced macronutrients and consistent hydration is key. ";
      const lower = msg.toLowerCase();

      if (lower.includes('lunch') || lower.includes('protein')) {
        riaResponse = "🍱 **High-Protein Indian Lunch Idea (~420 kcal, 32g Protein)**:\n\n• 150g Grilled Paneer / Tofu or Chicken Breast cooked in minimal olive oil.\n• 1 bowl Sprouted Moong Salad with lemon juice & cucumber.\n• 1 Wheat Roti or 1/2 cup Basmati Rice.\n\nThis provides sustained energy with low glycemic index!";
      } else if (lower.includes('workout') || lower.includes('hiit')) {
        riaResponse = "🔥 **20-Minute Full-Body Fat Burner**:\n\n1. Jumping Jacks (45s work, 15s rest) x 3\n2. Bodyweight Squats (45s work, 15s rest) x 3\n3. Push-ups / Knee Push-ups (45s work, 15s rest) x 3\n4. High Knees (45s work, 15s rest) x 3\n5. Plank Hold (60s) x 3\n\nNo equipment required!";
      } else if (lower.includes('water')) {
        riaResponse = "💧 For optimal energy and workout recovery, aim for **2.5 to 3.0 Liters (10-12 glasses)** daily. Drinking a large glass of water right before meals also aids digestion!";
      } else if (lower.includes('sleep')) {
        riaResponse = "😴 **Deep Sleep Protocol**:\n\n1. Avoid bright screens 45 mins before bedtime.\n2. Keep bedroom temp around 21°C.\n3. Avoid caffeine after 2 PM.\n4. Practice 5 minutes of 4-7-8 breathing.";
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ria',
        text: riaResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 18, color: Colors.primary[600], fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Ria AI Coach 🤖</Text>
          <Text style={{ fontSize: Typography.sizes.xs, color: Colors.success, fontWeight: Typography.weights.semibold }}>● Always Free & Unlimited</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(item => (
            <View
              key={item.id}
              style={{
                alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: item.sender === 'user' ? Colors.primary[600] : Colors.cardBg,
                borderRadius: 16,
                padding: 14,
                borderWidth: item.sender === 'user' ? 0 : 1,
                borderColor: Colors.neutral[200],
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3
              }}
            >
              <Text style={{ fontSize: Typography.sizes.sm, color: item.sender === 'user' ? '#FFFFFF' : Colors.textPrimary, lineHeight: 20 }}>
                {item.text}
              </Text>
              <Text style={{ fontSize: 10, color: item.sender === 'user' ? 'rgba(255,255,255,0.7)' : Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' }}>
                {item.time}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: Colors.cardBg, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={Colors.primary[600]} />
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>Ria is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Prompts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}>
          {quickPrompts.map((p, idx) => (
            <TouchableOpacity key={idx} onPress={() => handleSend(p)} style={{ backgroundColor: Colors.primary[50], borderLineWidth: 1, borderColor: Colors.primary[200], borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.primary[700], fontWeight: Typography.weights.medium }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: Colors.neutral[200], backgroundColor: Colors.cardBg, alignItems: 'center', gap: 8 }}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Ria anything about health or fitness..."
            placeholderTextColor={Colors.textMuted}
            style={{ flex: 1, backgroundColor: Colors.neutral[100], borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: Typography.sizes.sm, color: Colors.textPrimary }}
          />
          <TouchableOpacity onPress={() => handleSend()} style={{ backgroundColor: Colors.primary[600], paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 }}>
            <Text style={{ color: '#FFF', fontWeight: Typography.weights.bold, fontSize: Typography.sizes.sm }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
''';

# 2. Food Search Screen (app/food-search.jsx)
food_search_screen = '''import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../constants';
import { Card } from '../components/ui';

const SAMPLE_FOODS = [
  { id: '1', name: 'Roti / Chapati (Whole Wheat)', calories: 120, protein: 3.5, carbs: 22, fat: 2.5, serving: '1 roti (40g)', isIndian: true },
  { id: '2', name: 'Paneer Butter Masala', calories: 340, protein: 14, carbs: 12, fat: 26, serving: '1 bowl (200g)', isIndian: true },
  { id: '3', name: 'Dal Tadka (Yellow Lentils)', calories: 180, protein: 9, carbs: 24, fat: 6, serving: '1 bowl (150g)', isIndian: true },
  { id: '4', name: 'Steamed Basmati Rice', calories: 205, protein: 4.2, carbs: 45, fat: 0.5, serving: '1 bowl (150g)', isIndian: true },
  { id: '5', name: 'Moong Dal Chila', calories: 150, protein: 9.5, carbs: 20, fat: 3, serving: '2 chilas (100g)', isIndian: true },
  { id: '6', name: 'Idli (Steamed Rice & Lentil)', calories: 78, protein: 2.2, carbs: 17, fat: 0.2, serving: '1 idli (50g)', isIndian: true },
  { id: '7', name: 'Masala Dosa', calories: 310, protein: 6.5, carbs: 48, fat: 10, serving: '1 dosa (150g)', isIndian: true },
  { id: '8', name: 'Chicken Biryani (Hyderabadi)', calories: 480, protein: 28, carbs: 54, fat: 18, serving: '1 bowl (300g)', isIndian: true },
  { id: '9', name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g', isIndian: false },
  { id: '10', name: 'Boiled Egg (Whole)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, serving: '1 large egg', isIndian: false },
  { id: '11', name: 'Greek Yogurt (Plain)', calories: 100, protein: 17, carbs: 6, fat: 0.7, serving: '1 cup (170g)', isIndian: false },
  { id: '12', name: 'Sprouted Moong Salad', calories: 140, protein: 8.5, carbs: 22, fat: 1.5, serving: '1 bowl (150g)', isIndian: true }
];

export default function FoodSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [selectedFood, setSelectedFood] = useState(null);
  const [servings, setServings] = useState('1');
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const filteredFoods = SAMPLE_FOODS.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));

  const handleLogFood = () => {
    setLoggedSuccess(true);
    setTimeout(() => {
      setLoggedSuccess(false);
      setSelectedFood(null);
      router.back();
    }, 1200);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 18, color: Colors.primary[600], fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Log Food Item 🍛</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 16 }}>
        {/* Meal Category Picker */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMeal(m)}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center',
                backgroundColor: selectedMeal === m ? Colors.primary[600] : Colors.neutral[100]
              }}
            >
              <Text style={{ color: selectedMeal === m ? '#FFF' : Colors.textSecondary, fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.xs }}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Bar */}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search 80+ Indian & Global foods..."
          placeholderTextColor={Colors.textMuted}
          style={{ backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: Typography.sizes.sm, color: Colors.textPrimary, marginBottom: 12 }}
        />
      </View>

      <FlatList
        data={filteredFoods}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedFood(item)}>
            <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textPrimary }}>{item.name}</Text>
                  {item.isIndian && <Text style={{ fontSize: 10, backgroundColor: Colors.warning + '20', color: Colors.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '700' }}>INDIAN</Text>}
                </View>
                <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 4 }}>
                  {item.serving} • {item.protein}g P | {item.carbs}g C | {item.fat}g F
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.primary[600] }}>{item.calories} kcal</Text>
                <Text style={{ fontSize: Typography.sizes.xs, color: Colors.primary[600], fontWeight: '600', marginTop: 4 }}>+ Add</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* Food Modal */}
      {selectedFood && (
        <Modal visible transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: Colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary, flex: 1 }}>{selectedFood.name}</Text>
                <TouchableOpacity onPress={() => setSelectedFood(null)}>
                  <Text style={{ fontSize: 18, color: Colors.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ backgroundColor: Colors.neutral[50], padding: 16, borderRadius: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: Colors.textSecondary }}>Category:</Text>
                  <Text style={{ fontWeight: '600', color: Colors.textPrimary }}>{selectedMeal}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: Colors.textSecondary }}>Serving Size:</Text>
                  <Text style={{ fontWeight: '600', color: Colors.textPrimary }}>{selectedFood.serving}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: Colors.textSecondary }}>Calories:</Text>
                  <Text style={{ fontWeight: 'bold', color: Colors.primary[600] }}>{Math.round(selectedFood.calories * (parseFloat(servings) || 1))} kcal</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary }}>Number of Servings:</Text>
                <TextInput
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="numeric"
                  style={{ borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, fontSize: Typography.sizes.base, fontWeight: 'bold', width: 80, textAlign: 'center' }}
                />
              </View>

              <TouchableOpacity
                onPress={handleLogFood}
                style={{ backgroundColor: loggedSuccess ? Colors.success : Colors.primary[600], paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base }}>
                  {loggedSuccess ? '✓ Logged Successfully!' : `Log to ${selectedMeal}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
''';

# 3. Fasting Screen (app/fasting.jsx)
fasting_screen = '''import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../constants';
import { Card, ProgressRing } from '../components/ui';

export default function FastingScreen() {
  const router = useRouter();
  const [isFasting, setIsFasting] = useState(false);
  const [seconds, setSeconds] = useState(14 * 3600 + 22 * 60); // 14 hours 22 mins elapsed
  const [targetHours, setTargetHours] = useState(16); // 16:8 protocol

  useEffect(() => {
    let interval = null;
    if (isFasting) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFasting]);

  const hoursElapsed = Math.floor(seconds / 3600);
  const minsElapsed = Math.floor((seconds % 3600) / 60);
  const secsElapsed = seconds % 60;
  const progressRatio = Math.min(1, seconds / (targetHours * 3600));

  const getStage = (h) => {
    if (h < 4) return { title: 'Anabolic Phase', desc: 'Blood sugar & insulin levels normalising.' };
    if (h < 12) return { title: 'Catabolic Phase', desc: 'Glycogen depleting, body transitioning to fat burn.' };
    if (h < 18) return { title: 'Ketosis Fat-Burn Zone 🔥', desc: 'Fatty acids breaking down into ketones for energy.' };
    return { title: 'Autophagy & Cell Renewal ✨', desc: 'Old damaged cells being recycled & repaired.' };
  };

  const currentStage = getStage(hoursElapsed);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 18, color: Colors.primary[600], fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Fasting Tracker ⏳</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* Protocol Switcher */}
        <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
          <View>
            <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Intermittent Fasting</Text>
            <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 }}>{targetHours}:{24 - targetHours} Protocol (100% Free)</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[14, 16, 18].map(h => (
              <TouchableOpacity
                key={h}
                onPress={() => setTargetHours(h)}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: targetHours === h ? Colors.primary[600] : Colors.neutral[100] }}
              >
                <Text style={{ color: targetHours === h ? '#FFF' : Colors.textSecondary, fontWeight: '700', fontSize: 12 }}>{h}:{24-h}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Circular Fasting Timer */}
        <Card style={{ alignItems: 'center', padding: 28, gap: 20 }}>
          <ProgressRing
            size={180}
            strokeWidth={14}
            progress={progressRatio}
            color={Colors.accent}
            label={`${String(hoursElapsed).padStart(2, '0')}:${String(minsElapsed).padStart(2, '0')}:${String(secsElapsed).padStart(2, '0')}`}
            sublabel={`${targetHours} Hours Target`}
          />

          <TouchableOpacity
            onPress={() => setIsFasting(!isFasting)}
            style={{
              backgroundColor: isFasting ? Colors.error : Colors.primary[600],
              paddingHorizontal: 36, paddingVertical: 14, borderRadius: 24, width: '100%', alignItems: 'center'
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base }}>
              {isFasting ? 'End Fast' : 'Start Fasting Now'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Current Fasting Stage */}
        <Card style={{ backgroundColor: Colors.primary[50], borderLeftWidth: 4, borderLeftColor: Colors.primary[600], padding: 16, gap: 6 }}>
          <Text style={{ fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.primary[900] }}>Current Stage: {currentStage.title}</Text>
          <Text style={{ fontSize: Typography.sizes.xs, color: Colors.primary[800] }}>{currentStage.desc}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
''';

# 4. Active Workout Screen (app/workout-active.jsx)
workout_active_screen = '''import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../constants';
import { Card } from '../components/ui';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState([
    {
      id: '1', name: 'Barbell Bench Press', bodyPart: 'Chest',
      sets: [
        { setNum: 1, weight: '60', reps: '10', completed: true },
        { setNum: 2, weight: '65', reps: '8', completed: true },
        { setNum: 3, weight: '70', reps: '6', completed: false },
      ]
    },
    {
      id: '2', name: 'Incline Dumbbell Press', bodyPart: 'Chest',
      sets: [
        { setNum: 1, weight: '22', reps: '10', completed: false },
        { setNum: 2, weight: '24', reps: '8', completed: false },
      ]
    }
  ]);

  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerActive && restTimerSeconds > 0) {
      interval = setInterval(() => setRestTimerSeconds(s => s - 1), 1000);
    } else if (restTimerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, restTimerSeconds]);

  const toggleSet = (exIdx, setIdx) => {
    const updated = [...exercises];
    const targetSet = updated[exIdx].sets[setIdx];
    targetSet.completed = !targetSet.completed;
    setExercises(updated);

    if (targetSet.completed) {
      setRestTimerSeconds(60); // 60 seconds rest timer trigger
      setTimerActive(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 18, color: Colors.error, fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Active Session 🏋️</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: Colors.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {exercises.map((ex, exIdx) => (
          <Card key={ex.id} style={{ gap: 12, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{ex.name}</Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>{ex.bodyPart}</Text>
            </View>

            {/* Headers */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.neutral[200], paddingBottom: 6 }}>
              <Text style={{ width: 40, fontSize: 12, fontWeight: '700', color: Colors.textMuted }}>SET</Text>
              <Text style={{ width: 80, fontSize: 12, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' }}>KG</Text>
              <Text style={{ width: 80, fontSize: 12, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' }}>REPS</Text>
              <Text style={{ width: 60, fontSize: 12, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' }}>DONE</Text>
            </View>

            {ex.sets.map((s, setIdx) => (
              <View key={setIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: s.completed ? Colors.success + '15' : 'transparent', paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ width: 40, fontWeight: 'bold', color: Colors.textPrimary, paddingLeft: 6 }}>{s.setNum}</Text>
                <TextInput
                  value={s.weight}
                  keyboardType="numeric"
                  style={{ width: 80, borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 6, textAlign: 'center', paddingVertical: 4, fontWeight: 'bold' }}
                />
                <TextInput
                  value={s.reps}
                  keyboardType="numeric"
                  style={{ width: 80, borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 6, textAlign: 'center', paddingVertical: 4, fontWeight: 'bold' }}
                />
                <TouchableOpacity
                  onPress={() => toggleSet(exIdx, setIdx)}
                  style={{ width: 60, alignItems: 'center', justifyContent: 'center' }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: s.completed ? Colors.success : Colors.neutral[200], alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{s.completed ? '✓' : ''}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        ))}
      </ScrollView>

      {/* Floating Rest Timer Bar */}
      {restTimerSeconds > 0 && (
        <View style={{ backgroundColor: Colors.primary[700], padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: Typography.sizes.sm }}>⏱️ Rest Timer Active</Text>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: Typography.sizes.lg }}>{restTimerSeconds}s</Text>
          <TouchableOpacity onPress={() => setRestTimerSeconds(0)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
            <Text style={{ color: '#FFF', fontSize: 12 }}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
''';

with open(os.path.join(mobile_app_dir, 'ai-coach.jsx'), 'w') as f:
    f.write(ai_coach_screen)

with open(os.path.join(mobile_app_dir, 'food-search.jsx'), 'w') as f:
    f.write(food_search_screen)

with open(os.path.join(mobile_app_dir, 'fasting.jsx'), 'w') as f:
    f.write(fasting_screen)

with open(os.path.join(mobile_app_dir, 'workout-active.jsx'), 'w') as f:
    f.write(workout_active_screen)

print("Created ai-coach.jsx, food-search.jsx, fasting.jsx, workout-active.jsx!")
