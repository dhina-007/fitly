import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants';
import { Card, BottomSheet, Button, AppHeader, Icon } from '../components/ui';
import { healthService } from '../services/health.service';
import { useDateStore } from '../store/dateStore';
import { useAppStore } from '../store/appStore';
import { useQueryClient } from '@tanstack/react-query';

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
    name: 'Grilled Herb Chicken & Quinoa Bowl',
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
  const queryClient = useQueryClient();
  const { selectedDate } = useDateStore();
  const [selectedTag, setSelectedTag] = useState('All');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [recipesList, setRecipesList] = useState(SAMPLE_RECIPES);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const data = await healthService.getRecipes();
      if (Array.isArray(data) && data.length > 0) {
        // Map any DB items
        const formatted = data.map(r => ({
          id: r._id || r.id,
          name: r.name,
          category: r.category || 'Lunch',
          calories: r.calories || 250,
          protein: r.protein || 15,
          carbs: r.carbs || 30,
          fat: r.fat || 6,
          prepTime: r.prepTime ? `${r.prepTime} mins` : '15 mins',
          tags: r.tags || ['Healthy'],
          ingredients: r.ingredients?.map(ing => typeof ing === 'string' ? ing : `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`.trim()) || [],
          instructions: r.instructions || []
        }));
        setRecipesList(formatted);
      }
    } catch (err) {
      console.warn('Fallback to sample recipes:', err.message);
    }
  };

  const tags = ['All', 'High Protein', 'Indian', 'Vegetarian', 'Low Calorie'];

  const filtered = selectedTag === 'All' ? recipesList : recipesList.filter(r => r.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase()));

  const handleLogRecipe = async () => {
    if (!activeRecipe) return;
    setLogging(true);
    try {
      const today = selectedDate || new Date().toISOString().split('T')[0];
      await healthService.logFoodItem({
        name: activeRecipe.name,
        foodName: activeRecipe.name,
        calories: activeRecipe.calories,
        protein: activeRecipe.protein,
        carbs: activeRecipe.carbs,
        fat: activeRecipe.fat,
        servingSize: 1,
        servingUnit: 'serving',
        quantity: 1,
        caloriesIsTotal: true,
        mealType: (activeRecipe.category || 'lunch').toLowerCase(),
        date: today
      });
      queryClient.invalidateQueries(['dashboardAnalytics', today]);
      queryClient.invalidateQueries(['foodLogs', today]);
      setLogged(true);
      useAppStore.getState().showToast(`Logged ${activeRecipe.name}`, 'success');
      setTimeout(() => {
        setLogged(false);
        setActiveRecipe(null);
      }, 1000);
    } catch (err) {
      useAppStore.getState().showToast(err.message || 'Failed to log recipe', 'error');
    } finally {
      setLogging(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <AppHeader
        title="Healthy Recipes"
        showBack
      />

      <View style={styles.tagSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tags}
          keyExtractor={t => t}
          contentContainerStyle={styles.tagScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedTag(item)}
              style={[styles.tagPill, selectedTag === item && styles.tagPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tagText, selectedTag === item && styles.tagTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setActiveRecipe(item)} activeOpacity={0.9}>
            <Card style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>{item.name}</Text>
                <Text style={styles.recipeCals}>{item.calories} kcal</Text>
              </View>
              
              <View style={styles.recipeInfo}>
                <Icon name="Clock" size={12} color={Colors.textMuted} />
                <Text style={styles.recipeInfoText}>{item.prepTime}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.recipeInfoText}>{item.protein}g P | {item.carbs}g C | {item.fat}g F</Text>
              </View>
              
              <View style={styles.recipeTags}>
                {item.tags.map(t => (
                  <View key={t} style={styles.recipeTag}>
                    <Text style={styles.recipeTagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* Detail Modal */}
      <BottomSheet
        visible={!!activeRecipe}
        onClose={() => setActiveRecipe(null)}
        title={activeRecipe?.name}
        subtitle={`${activeRecipe?.calories} kcal • ${activeRecipe?.protein}g Protein`}
        height={650}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
          {activeRecipe && (
            <>
              <Card style={styles.macroCard}>
                <View style={styles.macroRow}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroVal}>{activeRecipe.protein}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroVal}>{activeRecipe.carbs}g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroVal}>{activeRecipe.fat}g</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                </View>
              </Card>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {activeRecipe.ingredients.map((ing, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.listText}>{ing}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {activeRecipe.instructions.map((inst, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.stepNum}>{idx + 1}.</Text>
                    <Text style={styles.listText}>{inst}</Text>
                  </View>
                ))}
              </View>

              <Button
                title={logged ? '✓ Logged to Food Journal!' : (logging ? 'Logging...' : 'Log Recipe to Journal')}
                onPress={handleLogRecipe}
                loading={logging}
                variant="primary"
                style={[styles.logBtn, logged && { backgroundColor: Colors.success }]}
              />
            </>
          )}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tagSection: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tagScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  tagPillActive: {
    backgroundColor: Colors.primary[600],
  },
  tagText: {
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.sm,
  },
  tagTextActive: {
    color: Colors.white,
  },
  listContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  recipeCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  recipeTitle: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  recipeCals: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[600],
  },
  recipeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeInfoText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  dot: {
    fontSize: 10,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  recipeTag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  recipeTagText: {
    fontSize: 10,
    color: Colors.primary[700],
    fontWeight: Typography.weights.bold,
  },
  modalScroll: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  macroCard: {
    padding: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[100],
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroVal: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  macroLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingRight: Spacing.md,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary[600],
    marginTop: 8,
  },
  stepNum: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[600],
    width: 20,
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  logBtn: {
    marginTop: Spacing.md,
  },
});
