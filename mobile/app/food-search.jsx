import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants';
import { Card, BottomSheet, FoodListItem, AppHeader, Icon, Input, Button } from '../components/ui';
import { healthService } from '../services/health.service';
import { useDateStore } from '../store/dateStore';
import { useAppStore } from '../store/appStore';
import { useFoodCartStore } from '../store/foodCartStore';

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

function normalizeMealParam(meal) {
  const m = String(meal || '').trim().toLowerCase();
  return MEAL_OPTIONS.find((opt) => opt.toLowerCase() === m) || 'Breakfast';
}

const CATEGORIES = [
  { id: 'all', name: 'All Foods', icon: 'Utensils' },
  { id: 'south_indian_tiffin', name: 'South Tiffin', icon: 'Coffee' },
  { id: 'protein_foods', name: 'High Protein', icon: 'Egg' },
  { id: 'rice_and_grains', name: 'Grains & Rice', icon: 'Wheat' },
  { id: 'chutneys_gravies_sides', name: 'Dals & Gravies', icon: 'Soup' },
  { id: 'vegetables_and_greens', name: 'Vegetables', icon: 'Leaf' },
  { id: 'dairy_and_alternatives', name: 'Dairy & Paneer', icon: 'Milk' },
  { id: 'snacks_and_street_foods', name: 'Snacks & Chaat', icon: 'Cookie' },
  { id: 'sweets_and_desserts', name: 'Sweets & Desserts', icon: 'Cake' },
  { id: 'north_indian', name: 'North Indian', icon: 'Flame' },
  { id: 'tamil_meals', name: 'Meals', icon: 'ConciergeBell' },
  { id: 'drinks', name: 'Beverages', icon: 'CupSoda' }
];

const STANDARD_MEASURES = [
  { key: 'grams', label: 'grams', unitWeight: 1 },
  { key: 'ml', label: 'ml', unitWeight: 1 },
  { key: 'katori', label: 'katori / bowl', unitWeight: 150 },
  { key: 'big_bowl', label: 'big bowl', unitWeight: 250 },
  { key: 'piece', label: 'piece / item', unitWeight: 50 },
  { key: 'roti', label: 'medium roti', unitWeight: 35 },
  { key: 'plate', label: 'plate', unitWeight: 300 },
  { key: 'cup', label: 'cup', unitWeight: 240 },
  { key: 'glass', label: 'glass', unitWeight: 250 },
  { key: 'tablespoon', label: 'tablespoon', unitWeight: 15 },
  { key: 'teaspoon', label: 'teaspoon', unitWeight: 5 },
];

function normalizeMeasureKey(name = '') {
  const n = String(name).trim().toLowerCase();
  if (n === 'g' || n === 'gram' || n === 'grams') return 'grams';
  if (n === 'ml' || n === 'milliliter' || n === 'milliliters') return 'ml';
  if (n === 'cup' || n === 'cups') return 'cup';
  if (n === 'glass' || n === 'glasses') return 'glass';
  if (n === 'bowl' || n === 'bowls' || n === 'katori') return 'katori';
  if (n === 'big bowl' || n === 'big_bowl' || n === 'large bowl') return 'big_bowl';
  if (n === 'piece' || n === 'pc' || n === 'pieces' || n === 'item') return 'piece';
  if (n === 'roti' || n === 'chapati' || n === 'phulka') return 'roti';
  if (n === 'plate' || n === 'plates') return 'plate';
  if (n === 'tbsp' || n === 'tablespoon' || n === 'tablespoons') return 'tablespoon';
  if (n === 'tsp' || n === 'teaspoon' || n === 'teaspoons') return 'teaspoon';
  return null;
}

function buildMeasureOptions(food) {
  const standardMap = new Map(STANDARD_MEASURES.map((m) => [m.key, { ...m }]));
  const extras = [];

  (food?.servingOptions || []).forEach((opt) => {
    const stdKey = normalizeMeasureKey(opt.name);
    const weight = Number(opt.weightGrams) || Number(opt.servingSize) || 100;
    if (stdKey) {
      const existing = standardMap.get(stdKey);
      // Only override cup/glass/bowl/tablespoon weight if food defines a realistic household portion
      if (stdKey !== 'grams' && stdKey !== 'ml' && weight > 0) {
        existing.unitWeight = weight;
      }
      if (opt.isDefault) existing.isDefault = true;
    } else if (opt.name) {
      extras.push({
        key: opt.name,
        label: opt.name,
        unitWeight: weight,
        isDefault: Boolean(opt.isDefault),
      });
    }
  });

  return [...extras, ...Array.from(standardMap.values())];
}

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { selectedDate } = useDateStore();
  const activeDate = selectedDate || new Date().toISOString().split('T')[0];

  const cartItems = useFoodCartStore((s) => s.items);
  const addCartItem = useFoodCartStore((s) => s.addItem);
  const removeCartItem = useFoodCartStore((s) => s.removeItem);
  const clearCart = useFoodCartStore((s) => s.clearCart);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMeal, setSelectedMeal] = useState(() => normalizeMealParam(params.meal));
  const [isVegOnly, setIsVegOnly] = useState(false);

  // Selected food item for logging modal (always keeps Quantity + Measure)
  const [selectedFood, setSelectedFood] = useState(null);
  const [measureOptions, setMeasureOptions] = useState(STANDARD_MEASURES);
  const [selectedMeasure, setSelectedMeasure] = useState(STANDARD_MEASURES[0]);
  const [quantity, setQuantity] = useState('100');
  const [loggedSuccess, setLoggedSuccess] = useState(false);
  const [trackingMeal, setTrackingMeal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

  // Custom food modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customMeasure, setCustomMeasure] = useState('bowl');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  useEffect(() => {
    if (params.meal) {
      setSelectedMeal(normalizeMealParam(params.meal));
    }
  }, [params.meal]);

  // Live Query from Backend REST API
  const { data: fetchedFoods, isLoading } = useQuery({
    queryKey: ['foods', query, selectedCategory, isVegOnly],
    queryFn: () => healthService.getFoods(query, selectedCategory, isVegOnly),
  });

  const foodsList = fetchedFoods || [];

  const handleOpenFoodModal = (food) => {
    const opts = buildMeasureOptions(food);
    const defaultOpt =
      opts.find((o) => o.isDefault) ||
      opts.find((o) => o.key === 'grams') ||
      opts[0];

    setSelectedFood(food);
    setMeasureOptions(opts);
    setSelectedMeasure(defaultOpt);
    if (defaultOpt.key === 'grams') {
      setQuantity(String(food.servingWeightGrams || food.servingSize || 100));
    } else if (defaultOpt.key === 'ml') {
      setQuantity('250');
    } else {
      setQuantity('1');
    }
  };

  const handleSelectMeasure = (opt) => {
    const prevKey = selectedMeasure?.key;
    setSelectedMeasure(opt);
    const currentNum = parseFloat(quantity) || 0;
    const isPrevBulk = prevKey === 'grams' || prevKey === 'ml';
    const isNextBulk = opt.key === 'grams' || opt.key === 'ml';

    if (!isPrevBulk && isNextBulk && currentNum <= 10) {
      setQuantity(opt.key === 'ml' ? '250' : '100');
    } else if (isPrevBulk && !isNextBulk && currentNum >= 10) {
      setQuantity('1');
    }
  };

  const calculateModalNutrition = () => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, totalWeight: 0 };

    const qty = Math.max(0.1, parseFloat(quantity) || 1);
    const unitWeight = selectedMeasure?.unitWeight || 100;
    const totalWeight = Math.round(unitWeight * qty * 10) / 10;

    const hasPer100g =
      selectedFood.caloriesKcal !== undefined && selectedFood.caloriesKcal !== null ||
      selectedFood.nutritionPer100g?.calories !== undefined;

    const baseWeight = hasPer100g
      ? 100
      : selectedFood.servingWeightGrams || selectedFood.servingSize || 100;

    const baseCal = selectedFood.caloriesKcal ?? selectedFood.nutritionPer100g?.calories ?? selectedFood.calories ?? selectedFood.nutrition?.calories ?? 0;
    const basePro = selectedFood.proteinG ?? selectedFood.nutritionPer100g?.protein ?? selectedFood.protein ?? selectedFood.nutrition?.protein ?? 0;
    const baseCarb = selectedFood.carbohydratesG ?? selectedFood.nutritionPer100g?.carbs ?? selectedFood.carbs ?? selectedFood.nutrition?.carbs ?? 0;
    const baseFat = selectedFood.totalFatG ?? selectedFood.nutritionPer100g?.fat ?? selectedFood.fat ?? selectedFood.nutrition?.fat ?? 0;
    const baseFib = selectedFood.fiberG ?? selectedFood.nutritionPer100g?.fiber ?? selectedFood.fiber ?? selectedFood.nutrition?.fiber ?? 0;

    const factor = totalWeight / (baseWeight || 100);

    return {
      calories: Math.max(0, Math.round(baseCal * factor)),
      protein: Math.max(0, Math.round(basePro * factor * 10) / 10),
      carbs: Math.max(0, Math.round(baseCarb * factor * 10) / 10),
      fat: Math.max(0, Math.round(baseFat * factor * 10) / 10),
      fiber: Math.max(0, Math.round(baseFib * factor * 10) / 10),
      totalWeight: Math.round(totalWeight),
    };
  };

  const buildSelectedFoodEntry = () => {
    if (!selectedFood) return null;
    const nutrition = calculateModalNutrition();
    const qty = Math.max(0.1, parseFloat(quantity) || 1);
    const unitWeight = selectedMeasure?.unitWeight || 1;
    const unitName = selectedMeasure?.label || 'grams';

    return {
      foodItemId: selectedFood._id || selectedFood.id,
      foodItem: selectedFood._id || selectedFood.id,
      name: selectedFood.displayName || selectedFood.canonicalName || selectedFood.name,
      servingSize: unitWeight,
      servingUnit: unitName,
      quantity: qty,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
    };
  };

  const buildCustomFoodEntry = () => {
    const measureObj = STANDARD_MEASURES.find((m) => m.key === customMeasure) || STANDARD_MEASURES[0];
    return {
      name: customName.trim(),
      foodName: customName.trim(),
      servingSize: measureObj.unitWeight,
      servingUnit: measureObj.label,
      quantity: Math.max(0.1, parseFloat(customQty) || 1),
      calories: parseFloat(customCalories) || 0,
      protein: parseFloat(customProtein) || 0,
      carbs: parseFloat(customCarbs) || 0,
      fat: parseFloat(customFat) || 0,
      fiber: 0,
      caloriesIsTotal: true,
    };
  };

  const resetCustomForm = () => {
    setShowCustomModal(false);
    setCustomName('');
    setCustomQty('1');
    setCustomMeasure('bowl');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
  };

  const trackEntriesForMeal = async (entries, mealName = selectedMeal, { clearCartAfter = false } = {}) => {
    if (!entries || entries.length === 0 || trackingMeal) return;
    setTrackingMeal(true);
    try {
      for (const entry of entries) {
        const { cartId, ...payload } = entry;
        await healthService.logFoodItem({
          ...payload,
          mealType: mealName.toLowerCase(),
          date: activeDate,
        });
      }
      queryClient.invalidateQueries(['dashboardAnalytics']);
      queryClient.invalidateQueries(['foodLogs']);
      if (clearCartAfter) {
        clearCart();
        setShowCartModal(false);
      }
      useAppStore.getState().showToast(
        entries.length === 1
          ? `Tracked ${entries[0].name} for ${mealName}`
          : `Tracked ${entries.length} foods for ${mealName}`,
        'success'
      );
      setLoggedSuccess(true);
      setTimeout(() => {
        setLoggedSuccess(false);
        setSelectedFood(null);
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/home');
      }, 500);
    } catch (e) {
      useAppStore.getState().showToast(e.message || 'Could not track food', 'error');
    } finally {
      setTrackingMeal(false);
    }
  };

  const handleAddToCart = () => {
    const entry = buildSelectedFoodEntry();
    if (!entry) return;
    addCartItem(entry);
    useAppStore.getState().showToast(`Added ${entry.name} to cart`, 'success');
    setSelectedFood(null);
  };

  const handleLogFood = async () => {
    const entry = buildSelectedFoodEntry();
    if (!entry) return;
    await trackEntriesForMeal([entry], selectedMeal);
  };

  const handleAddCustomToCart = () => {
    if (!customName.trim()) {
      useAppStore.getState().showToast('Please enter food name', 'error');
      return;
    }
    const entry = buildCustomFoodEntry();
    addCartItem(entry);
    useAppStore.getState().showToast(`Added ${entry.name} to cart`, 'success');
    resetCustomForm();
  };

  const handleSaveCustomFood = async () => {
    if (!customName.trim()) {
      useAppStore.getState().showToast('Please enter food name', 'error');
      return;
    }
    const entry = buildCustomFoodEntry();
    resetCustomForm();
    await trackEntriesForMeal([entry], selectedMeal);
  };

  const cartTotals = cartItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein: Math.round((acc.protein + (Number(item.protein) || 0)) * 10) / 10,
      carbs: Math.round((acc.carbs + (Number(item.carbs) || 0)) * 10) / 10,
      fat: Math.round((acc.fat + (Number(item.fat) || 0)) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const currentNutrition = calculateModalNutrition();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <AppHeader
        title="Add Food"
        showBack
        rightElement={
          <View style={styles.headerActions}>
            {cartItems.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowCartModal(true)}
                style={styles.headerCartBtn}
                testID="open-food-cart-btn"
              >
                <Icon name="ShoppingBag" size={16} color={Colors.primary[700]} />
                <Text style={styles.headerCartText}>Cart ({cartItems.length})</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowCustomModal(true)} style={styles.headerAddBtn}>
              <Icon name="Plus" size={16} color={Colors.primary[600]} />
              <Text style={styles.headerAddText}>Custom</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.filterSection}>
        {/* Meal Category Selector */}
        <View style={styles.mealRow}>
          {MEAL_OPTIONS.map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMeal(m)}
              style={[styles.mealBtn, selectedMeal === m && styles.mealBtnActive]}
            >
              <Text style={[styles.mealText, selectedMeal === m && styles.mealTextActive]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Input */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Icon name="Search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search foods or dishes..."
              style={styles.searchInput}
              containerStyle={{ flex: 1, marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity
            onPress={() => setIsVegOnly(!isVegOnly)}
            style={[styles.vegBtn, isVegOnly && styles.vegBtnActive]}
          >
            <Icon name="Leaf" size={16} color={isVegOnly ? Colors.success : Colors.textSecondary} />
            <Text style={[styles.vegText, isVegOnly && styles.vegTextActive]}>
              Veg
            </Text>
          </TouchableOpacity>
        </View>

        {/* Food Category Scroll Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.catPill, selectedCategory === cat.id && styles.catPillActive]}
            >
              <Icon name={cat.icon} size={16} color={selectedCategory === cat.id ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.catText, selectedCategory === cat.id && styles.catTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Food Results List */}
      <FlatList
        data={foodsList}
        keyExtractor={item => item._id || item.id || item.canonicalName}
        contentContainerStyle={[
          styles.listContainer,
          cartItems.length > 0 && { paddingBottom: 120 },
        ]}
        renderItem={({ item }) => (
          <FoodListItem
            item={item}
            onPress={() => handleOpenFoodModal(item)}
            showAdd
            onAdd={() => handleOpenFoodModal(item)}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Icon name="SearchX" size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No matching food found</Text>
            <Text style={styles.emptyDesc}>
              Try searching for another food, or tap + Custom above to add your own recipe.
            </Text>
          </View>
        )}
      />

      {/* Serving & Portion Modal */}
      <BottomSheet
        visible={!!selectedFood}
        onClose={() => setSelectedFood(null)}
        title={selectedFood?.displayName || selectedFood?.canonicalName || selectedFood?.name}
        subtitle={selectedFood?.regionalNames?.ta?.[0] || 'Indian Cuisine'}
        height={600}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
          
          {/* Measure Selector: ml, cup, glass, grams, bowl, tablespoon + food-specific */}
          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Measure:</Text>
            <View style={styles.measureGrid} testID="food-measure-list">
              {measureOptions.map((opt) => {
                const isSelected = selectedMeasure?.key === opt.key;
                const weightNote =
                  opt.key === 'grams' || opt.key === 'ml'
                    ? opt.label
                    : `${opt.label} (${opt.unitWeight}g)`;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => handleSelectMeasure(opt)}
                    style={[styles.unitPill, isSelected && styles.unitPillActive]}
                    testID={`measure-opt-${opt.key}`}
                  >
                    <Text style={[styles.unitText, isSelected && styles.unitTextActive]}>
                      {weightNote}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quantity Input & Steppers (always kept for every measure) */}
          <View style={styles.modalSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalLabel}>Quantity ({selectedMeasure?.label || 'grams'}):</Text>
              <Text style={{ fontSize: 13, color: Colors.primary[700], fontWeight: 'bold' }}>
                {quantity || 0} {selectedMeasure?.label || 'grams'} • {currentNutrition.totalWeight}g
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {(selectedMeasure?.key === 'grams' || selectedMeasure?.key === 'ml'
                ? ['50', '100', '150', '200', '250']
                : ['0.5', '1', '1.5', '2', '3']
              ).map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setQuantity(preset)}
                  style={[styles.gramChip, quantity === preset && styles.gramChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.gramChipText, quantity === preset && styles.gramChipTextActive]}>
                    {preset} {selectedMeasure?.key === 'grams' ? 'g' : selectedMeasure?.key === 'ml' ? 'ml' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.qtyRow}>
              <TouchableOpacity
                onPress={() => {
                  const step = selectedMeasure?.key === 'grams' || selectedMeasure?.key === 'ml' ? 25 : 0.5;
                  const minVal = selectedMeasure?.key === 'grams' || selectedMeasure?.key === 'ml' ? 5 : 0.5;
                  setQuantity(String(Math.max(minVal, Math.round(((parseFloat(quantity) || minVal) - step) * 10) / 10)));
                }}
                style={styles.qtyBtn}
                testID="food-qty-minus"
              >
                <Icon name="Minus" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
                <Input
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  testID="food-qty-input"
                  inputStyle={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  const step = selectedMeasure?.key === 'grams' || selectedMeasure?.key === 'ml' ? 25 : 0.5;
                  setQuantity(String(Math.round(((parseFloat(quantity) || 0) + step) * 10) / 10));
                }}
                style={styles.qtyBtn}
                testID="food-qty-plus"
              >
                <Icon name="Plus" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <Card style={styles.nutritionCard}>
            <View style={styles.nutrHeaderRow}>
              <View>
                <Text style={styles.nutrTitle}>Estimated Energy</Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted }}>Total: {currentNutrition.totalWeight}g</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.nutrCal}>{currentNutrition.calories} kcal</Text>
                <View style={[
                  styles.foodScoreBadge,
                  {
                    backgroundColor: currentNutrition.protein >= 12 || currentNutrition.fiber >= 4
                      ? Colors.primary[50]
                      : currentNutrition.calories > 350 && currentNutrition.fat > 15
                      ? '#FFFBEB'
                      : Colors.surfaceSubtle
                  }
                ]}>
                  <Text style={[
                    styles.foodScoreText,
                    {
                      color: currentNutrition.protein >= 12 || currentNutrition.fiber >= 4
                        ? Colors.primary[700]
                        : currentNutrition.calories > 350 && currentNutrition.fat > 15
                        ? Colors.warning
                        : Colors.textSecondary
                    }
                  ]}>
                    {currentNutrition.protein >= 12
                      ? '🟢 High Protein'
                      : currentNutrition.fiber >= 4
                      ? '🟢 High Fiber'
                      : currentNutrition.calories > 350 && currentNutrition.fat > 15
                      ? '🟡 Rich / Dense'
                      : '🟢 Balanced Fuel'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.macroRow}>
              <View style={styles.macroCol}>
                <Text style={styles.macroVal}>{currentNutrition.protein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroVal}>{currentNutrition.carbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroVal}>{currentNutrition.fat}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={[styles.macroVal, { color: Colors.primary[700] }]}>{currentNutrition.fiber}g</Text>
                <Text style={styles.macroLabel}>Fiber</Text>
              </View>
            </View>
          </Card>

          <View style={styles.modalActionCol}>
            <Button
              title="Add to Cart"
              icon="ShoppingBag"
              onPress={handleAddToCart}
              variant="outline"
              testID="add-to-cart-btn"
            />
            <Button
              title={loggedSuccess ? '✓ Tracked!' : `Track for ${selectedMeal}`}
              onPress={handleLogFood}
              loading={trackingMeal}
              variant="primary"
              testID="track-for-meal-btn"
              style={{ backgroundColor: loggedSuccess ? Colors.success : Colors.primary[600] }}
            />
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Custom Food Creation Modal */}
      <BottomSheet
        visible={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Create Custom Food"
        subtitle="Add your own recipe or item"
        height={600}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
          <Input
            label="Food Name"
            value={customName}
            onChangeText={setCustomName}
            placeholder="e.g. Grandma's Kesari"
          />
          <Input
            label="Quantity"
            value={customQty}
            onChangeText={setCustomQty}
            placeholder="1"
            keyboardType="numeric"
          />
          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Measure:</Text>
            <View style={styles.measureGrid}>
              {STANDARD_MEASURES.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setCustomMeasure(m.key)}
                  style={[styles.unitPill, customMeasure === m.key && styles.unitPillActive]}
                >
                  <Text style={[styles.unitText, customMeasure === m.key && styles.unitTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Input
            label="Calories (kcal)"
            value={customCalories}
            onChangeText={setCustomCalories}
            placeholder="0"
            keyboardType="numeric"
          />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Input
              label="Protein (g)"
              value={customProtein}
              onChangeText={setCustomProtein}
              placeholder="0"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Carbs (g)"
              value={customCarbs}
              onChangeText={setCustomCarbs}
              placeholder="0"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
          </View>
          <Input
            label="Fat (g)"
            value={customFat}
            onChangeText={setCustomFat}
            placeholder="0"
            keyboardType="numeric"
          />
          
          <View style={[styles.modalActionCol, { marginTop: Spacing.sm }]}>
            <Button
              title="Add to Cart"
              icon="ShoppingBag"
              onPress={handleAddCustomToCart}
              variant="outline"
              testID="custom-add-to-cart-btn"
            />
            <Button
              title={`Track for ${selectedMeal}`}
              onPress={handleSaveCustomFood}
              loading={trackingMeal}
              variant="primary"
              testID="custom-track-meal-btn"
            />
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Sticky Meal Cart Bar */}
      {cartItems.length > 0 && (
        <View style={styles.cartBar} testID="food-cart-bar">
          <TouchableOpacity
            onPress={() => setShowCartModal(true)}
            style={styles.cartBarInfo}
            activeOpacity={0.85}
            testID="cart-bar-summary"
          >
            <View style={styles.cartBarBadge}>
              <Icon name="ShoppingBag" size={16} color={Colors.white} />
              <Text style={styles.cartBarCount}>{cartItems.length}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cartBarTitle} numberOfLines={1}>
                Cart ({cartItems.length} {cartItems.length === 1 ? 'food' : 'foods'})
              </Text>
              <Text style={styles.cartBarSub} numberOfLines={1}>
                {cartTotals.calories} kcal • View items
              </Text>
            </View>
          </TouchableOpacity>
          <Button
            title={`Track for ${selectedMeal}`}
            onPress={() => trackEntriesForMeal(cartItems, selectedMeal, { clearCartAfter: true })}
            loading={trackingMeal}
            fullWidth={false}
            size="sm"
            testID="cart-bar-track-btn"
          />
        </View>
      )}

      {/* Food Cart Drawer */}
      <BottomSheet
        visible={showCartModal}
        onClose={() => setShowCartModal(false)}
        title={`Food Cart (${cartItems.length})`}
        subtitle="Track all selected foods to a meal"
        height={600}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
          <View style={styles.modalSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalLabel}>Track for meal:</Text>
              {cartItems.length > 0 && (
                <TouchableOpacity onPress={clearCart} testID="clear-food-cart-btn">
                  <Text style={styles.clearCartText}>Clear Cart</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.mealRow}>
              {MEAL_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMeal(m)}
                  style={[styles.mealBtn, selectedMeal === m && styles.mealBtnActive]}
                  testID={`cart-meal-${m.toLowerCase()}`}
                >
                  <Text style={[styles.mealText, selectedMeal === m && styles.mealTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {cartItems.length === 0 ? (
            <View style={{ paddingVertical: Spacing.xl, alignItems: 'center', gap: 6 }}>
              <Icon name="ShoppingBag" size={28} color={Colors.textMuted} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.sizes.sm }}>
                Your food cart is empty.
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {cartItems.map((item, idx) => (
                <Card key={item.cartId} style={styles.cartItemCard}>
                  <View style={styles.cartItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemMeta}>
                        {item.quantity} {item.servingUnit} • {item.calories} kcal • P {item.protein}g / C {item.carbs}g / F {item.fat}g
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeCartItem(item.cartId)}
                      style={styles.cartRemoveBtn}
                      testID={`remove-cart-item-${idx}`}
                    >
                      <Icon name="Trash2" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {cartItems.length > 0 && (
            <>
              <Card style={styles.nutritionCard}>
                <View style={styles.nutrHeaderRow}>
                  <Text style={styles.nutrTitle}>Cart Total</Text>
                  <Text style={styles.nutrCal}>{cartTotals.calories} kcal</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.macroRow}>
                  <View style={styles.macroCol}>
                    <Text style={styles.macroVal}>{cartTotals.protein}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroCol}>
                    <Text style={styles.macroVal}>{cartTotals.carbs}g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroCol}>
                    <Text style={styles.macroVal}>{cartTotals.fat}g</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                </View>
              </Card>

              <Button
                title={`Track for ${selectedMeal}`}
                onPress={() => trackEntriesForMeal(cartItems, selectedMeal, { clearCartAfter: true })}
                loading={trackingMeal}
                variant="primary"
                testID="cart-modal-track-btn"
              />
            </>
          )}
        </ScrollView>
      </BottomSheet>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  headerAddText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  filterSection: {
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  mealRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mealBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
  },
  mealBtnActive: {
    backgroundColor: Colors.primary[600],
  },
  mealText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  mealTextActive: {
    color: Colors.white,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 40,
  },
  vegBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  vegBtnActive: {
    backgroundColor: Colors.success + '15',
    borderColor: Colors.success,
  },
  vegText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  vegTextActive: {
    color: Colors.success,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  catPillActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  catText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  catTextActive: {
    color: Colors.white,
  },
  aiQuickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  aiQuickIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiQuickTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  aiQuickDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  listContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  emptyState: {
    padding: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalSection: {
    gap: Spacing.sm,
  },
  measureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  unitPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  unitPillActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  unitText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  unitTextActive: {
    color: Colors.white,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  nutritionCard: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.lg,
    borderColor: Colors.primary[100],
  },
  nutrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutrTitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  nutrCal: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  foodScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 3,
  },
  foodScoreText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.primary[200],
    marginVertical: Spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    alignItems: 'center',
  },
  macroVal: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  macroLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  portionModeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    padding: 4,
    gap: 6,
  },
  portionModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  portionModeBtnActive: {
    backgroundColor: Colors.primary[600],
    ...Shadows.sm,
  },
  portionModeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  portionModeTextActive: {
    color: Colors.white,
  },
  gramChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  gramChipActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[600],
  },
  gramChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  gramChipTextActive: {
    color: Colors.primary[700],
    fontWeight: Typography.weights.bold,
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  headerCartText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  modalActionCol: {
    gap: Spacing.sm,
  },
  cartBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    ...Shadows.lg,
  },
  cartBarInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cartBarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  cartBarCount: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  cartBarTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  cartBarSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  clearCartText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  cartItemCard: {
    padding: Spacing.md,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cartItemName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  cartItemMeta: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cartRemoveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.error + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
