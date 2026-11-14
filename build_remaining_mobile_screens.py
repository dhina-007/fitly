import os

mobile_app_dir = "/Users/dhinagar/Documents/antigravity/Fitly/mobile/app"

# 1. Recipes Screen (app/recipes.jsx)
recipes_screen = '''import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../constants';
import { Card } from '../components/ui';

const SAMPLE_RECIPES = [
  {
    id: '1',
    name: 'High-Protein Moong Dal Chila',
    category: 'Breakfast',
    calories: 220, protein: 14, carbs: 28, fat: 5, prepTime: '15 mins',
    tags: ['High Protein', 'Indian', 'Vegetarian'],
    ingredients: ['1 cup Moong Dal (soaked)', '50g Grated Paneer', '1 tsp Ginger & Green Chili', '1 tsp Ghee'],
    instructions: ['Blend dal with ginger & chili.', 'Spread on non-stick pan.', 'Top with paneer & cook crisp.']
  },
  {
    id: '2',
    name: 'Grilled Herb Chicken & Quinoa',
    category: 'Lunch',
    calories: 420, protein: 38, carbs: 42, fat: 9, prepTime: '20 mins',
    tags: ['High Protein', 'Weight Loss', 'Meal Prep'],
    ingredients: ['150g Chicken Breast', '1 cup Cooked Quinoa', '100g Mixed Veggies (Broccoli/Peppers)'],
    instructions: ['Marinate chicken with oregano & olive oil.', 'Grill 6 mins per side.', 'Serve warm over quinoa.']
  },
  {
    id: '3',
    name: 'Sprouted Moong & Cucumber Salad',
    category: 'Snacks',
    calories: 140, protein: 8.5, carbs: 22, fat: 1.5, prepTime: '10 mins',
    tags: ['Low Calorie', 'High Fiber', 'Vegan'],
    ingredients: ['1 cup Sprouted Moong', '1 Chopped Cucumber', 'Lemon juice & Chaat Masala'],
    instructions: ['Toss sprouts and cucumber in a bowl.', 'Add lemon juice and chaat masala. Mix well!']
  }
];

export default function RecipesScreen() {
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState('All');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [logged, setLogged] = useState(false);

  const tags = ['All', 'High Protein', 'Indian', 'Vegetarian', 'Low Calorie'];

  const filtered = selectedTag === 'All' ? SAMPLE_RECIPES : SAMPLE_RECIPES.filter(r => r.tags.includes(selectedTag));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 18, color: Colors.primary[600], fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Healthy Recipes 🥗</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingVertical: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tags}
          keyExtractor={t => t}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedTag(item)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: selectedTag === item ? Colors.primary[600] : Colors.neutral[100]
              }}
            >
              <Text style={{ color: selectedTag === item ? '#FFF' : Colors.textSecondary, fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.xs }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setActiveRecipe(item)}>
            <Card style={{ gap: 8, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary, flex: 1 }}>{item.name}</Text>
                <Text style={{ fontSize: Typography.sizes.xs, color: Colors.primary[600], fontWeight: '700' }}>{item.calories} kcal</Text>
              </View>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>⏱️ {item.prepTime} • {item.protein}g Protein | {item.carbs}g Carbs | {item.fat}g Fat</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                {item.tags.map(t => (
                  <Text key={t} style={{ fontSize: 10, backgroundColor: Colors.primary[50], color: Colors.primary[700], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontWeight: '600' }}>{t}</Text>
                ))}
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* Detail Modal */}
      {activeRecipe && (
        <Modal visible transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: Colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, maxHeight: '85%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary, flex: 1 }}>{activeRecipe.name}</Text>
                <TouchableOpacity onPress={() => setActiveRecipe(null)}>
                  <Text style={{ fontSize: 18, color: Colors.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: 'bold', color: Colors.primary[600] }}>
                {activeRecipe.calories} kcal • {activeRecipe.protein}g Protein • {activeRecipe.carbs}g Carbs • {activeRecipe.fat}g Fat
              </Text>

              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: 'bold', color: Colors.textPrimary }}>Ingredients:</Text>
              {activeRecipe.ingredients.map((ing, idx) => (
                <Text key={idx} style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>• {ing}</Text>
              ))}

              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 8 }}>Instructions:</Text>
              {activeRecipe.instructions.map((inst, idx) => (
                <Text key={idx} style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginBottom: 4 }}>{idx + 1}. {inst}</Text>
              ))}

              <TouchableOpacity
                onPress={() => {
                  setLogged(true);
                  setTimeout(() => { setLogged(false); setActiveRecipe(null); }, 1000);
                }}
                style={{ backgroundColor: logged ? Colors.success : Colors.primary[600], paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: Typography.sizes.base }}>
                  {logged ? '✓ Meal Logged!' : 'Log this Recipe to Food Journal'}
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

# 2. Community & Challenges Screen (app/community.jsx)
community_screen = '''import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../constants';
import { Card } from '../components/ui';

const SAMPLE_POSTS = [
  {
    id: '1', author: 'Aarav Sharma', avatar: '👨‍💼', time: '2h ago',
    content: 'Hit a new PR on Bench Press today! 80kg x 6 reps 💪 Thanks to HealthFit rest timer & community support!',
    likes: 24, comments: 5, userLiked: false
  },
  {
    id: '2', author: 'Priya Patel', avatar: '👩‍⚕️', time: '5h ago',
    content: 'Prepared High-Protein Moong Dal Chila from HealthFit recipe book. 14g protein breakfast in under 15 mins! 🥞',
    likes: 42, comments: 8, userLiked: true
  }
];

export default function CommunityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Feed');
  const [posts, setPosts] = useState(SAMPLE_POSTS);
  const [newPostText, setNewPostText] = useState('');

  const toggleLike = (id) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, likes: p.userLiked ? p.likes - 1 : p.likes + 1, userLiked: !p.userLiked };
      }
      return p;
    }));
  };

  const addPost = () => {
    if (!newPostText.trim()) return;
    const newP = {
      id: Date.now().toString(), author: 'You', avatar: '👤', time: 'Just now',
      content: newPostText, likes: 0, comments: 0, userLiked: false
    };
    setPosts([newP, ...posts]);
    setNewPostText('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 18, color: Colors.primary[600], fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Fit Community 👥</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
        {['Feed', 'Challenges & Leaderboard'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab ? Colors.primary[600] : 'transparent' }}
          >
            <Text style={{ fontWeight: Typography.weights.bold, color: activeTab === tab ? Colors.primary[600] : Colors.textSecondary, fontSize: Typography.sizes.xs }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Feed' ? (
        <View style={{ flex: 1 }}>
          {/* Post Box */}
          <View style={{ padding: 12, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200], flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TextInput
              value={newPostText}
              onChangeText={setNewPostText}
              placeholder="Share your daily win or progress..."
              placeholderTextColor={Colors.textMuted}
              style={{ flex: 1, backgroundColor: Colors.neutral[100], borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: Typography.sizes.xs, color: Colors.textPrimary }}
            />
            <TouchableOpacity onPress={addPost} style={{ backgroundColor: Colors.primary[600], paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: Typography.sizes.xs }}>Post</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={posts}
            keyExtractor={p => p.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <Card style={{ gap: 10, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 24 }}>{item.avatar}</Text>
                  <View>
                    <Text style={{ fontWeight: 'bold', color: Colors.textPrimary, fontSize: Typography.sizes.sm }}>{item.author}</Text>
                    <Text style={{ fontSize: 10, color: Colors.textMuted }}>{item.time}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: Typography.sizes.sm, color: Colors.textPrimary, lineHeight: 20 }}>{item.content}</Text>
                <View style={{ flexDirection: 'row', gap: 20, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.neutral[100] }}>
                  <TouchableOpacity onPress={() => toggleLike(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 14 }}>{item.userLiked ? '❤️' : '🤍'}</Text>
                    <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: '600' }}>{item.likes}</Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 14 }}>💬</Text>
                    <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: '600' }}>{item.comments}</Text>
                  </View>
                </View>
              </Card>
            )}
          />
        </View>
      ) : (
        <FlatList
          data={[
            { title: '🏃‍♂️ 10K Steps Daily Streak', leader: '#1 Rohan (12,400 steps)', reward: '🥇 Gold Badge' },
            { title: '🥗 7-Day Clean Eating Challenge', leader: '#1 Ananya (7/7 days)', reward: '🥇 Nutrition Champion' },
            { title: '🧘 30-Day Sleep & Recovery Challenge', leader: '#1 Vikram (8.2h avg)', reward: '🥇 Sleep Master' }
          ]}
          keyExtractor={(item, idx) => idx.toString()}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Card style={{ gap: 8, padding: 16, backgroundColor: Colors.cardBg }}>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{item.title}</Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.textSecondary }}>Current Leader: {item.leader}</Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: Colors.success, fontWeight: 'bold' }}>Reward: {item.reward} (100% Free)</Text>
              <TouchableOpacity style={{ backgroundColor: Colors.primary[600], paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 6 }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: Typography.sizes.xs }}>Join Challenge</Text>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}
''';

# 3. Habits Screen (app/habits.jsx)
habits_screen = '''import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '../constants';
import { Card } from '../components/ui';

const INITIAL_HABITS = [
  { id: '1', title: 'Drink 2.5L Water', icon: '💧', streak: 5, completed: true },
  { id: '2', title: 'Walk 8,000 Steps', icon: '🚶', streak: 12, completed: false },
  { id: '3', title: '7+ Hours Sleep', icon: '😴', streak: 4, completed: true },
  { id: '4', title: 'Log All Meals', icon: '🥗', streak: 8, completed: false },
  { id: '5', title: '10 Mins Meditation', icon: '🧘', streak: 3, completed: false }
];

export default function HabitsScreen() {
  const router = useRouter();
  const [habits, setHabits] = useState(INITIAL_HABITS);

  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextState = !h.completed;
        return { ...h, completed: nextState, streak: nextState ? h.streak + 1 : h.streak - 1 };
      }
      return h;
    }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 18, color: Colors.primary[600], fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>Daily Habits Tracker ⚡</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={habits}
        keyExtractor={h => h.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleHabit(item.id)}>
            <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: item.completed ? Colors.success + '10' : Colors.cardBg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 26 }}>{item.icon}</Text>
                <View>
                  <Text style={{ fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary }}>{item.title}</Text>
                  <Text style={{ fontSize: Typography.sizes.xs, color: Colors.primary[600], fontWeight: '600', marginTop: 2 }}>🔥 {item.streak} day streak</Text>
                </View>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: item.completed ? Colors.success : Colors.neutral[200], alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.completed ? '✓' : ''}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
''';

with open(os.path.join(mobile_app_dir, 'recipes.jsx'), 'w') as f:
    f.write(recipes_screen)

with open(os.path.join(mobile_app_dir, 'community.jsx'), 'w') as f:
    f.write(community_screen)

with open(os.path.join(mobile_app_dir, 'habits.jsx'), 'w') as f:
    f.write(habits_screen)

print("Created recipes.jsx, community.jsx, habits.jsx!")
