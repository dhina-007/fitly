import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import {
  Card,
  ProgressRing,
  ProgressBar,
  MetricCard,
  SectionHeader,
  Icon,
  DateSelector,
  CalendarModal,
  TopHeader,
  MaintenanceCaloriesModal,
} from '../../components/ui';
import { healthService } from '../../services/health.service';
import { useDateStore } from '../../store/dateStore';
import { predictMaintenanceCalories } from '../../utils/calorieCalculator';

// Standard HealthifyMe Meal Buckets with recommended target ratios
const MEAL_BUCKETS = [
  { id: 'Breakfast', label: 'Breakfast', icon: 'Sunrise', ratio: 0.25, timeHint: '7:30 - 9:30 AM' },
  { id: 'Lunch', label: 'Lunch', icon: 'Sun', ratio: 0.35, timeHint: '12:30 - 2:30 PM' },
  { id: 'Snacks', label: 'Evening Snacks', icon: 'Coffee', ratio: 0.15, timeHint: '4:30 - 6:00 PM' },
  { id: 'Dinner', label: 'Dinner', icon: 'Moon', ratio: 0.25, timeHint: '7:30 - 9:30 PM' },
];

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile } = useAuthStore();
  const { selectedDate, setSelectedDate } = useDateStore();

  const name = user?.displayName?.split(' ')[0] || profile?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);

  // Live queries from Node.js backend
  const { data: analytics, refetch: refetchAnalytics, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics', selectedDate],
    queryFn: () => healthService.getDashboardAnalytics(selectedDate),
  });

  const { data: foodLogs = [], refetch: refetchFoodLogs } = useQuery({
    queryKey: ['foodLogs', selectedDate],
    queryFn: () => healthService.getFoodLogs(selectedDate),
  });

  const [waterMl, setWaterMl] = useState(0);

  useEffect(() => {
    if (analytics?.water?.consumedMl !== undefined) {
      setWaterMl(analytics.water.consumedMl);
    }
  }, [analytics?.water?.consumedMl]);

  const eatenKcal = analytics?.calories?.consumed || 0;
  const targetKcal = analytics?.calories?.target || profile?.calorieTarget || 2000;
  const burnedKcal = analytics?.calories?.burned || 0;
  const remainingKcal = Math.max(0, targetKcal - eatenKcal);

  const predictedMeta = predictMaintenanceCalories({
    weight: profile?.currentWeight || 71,
    height: profile?.height || 173,
    age: profile?.age || 26,
    gender: profile?.gender || 'male',
    activityLevel: profile?.activityLevel || 'moderately_active',
    fitnessGoal: profile?.fitnessGoal || 'maintenance',
  });

  const maintenanceKcal =
    profile?.isCustomMaintenance && profile?.tdee
      ? profile.tdee
      : analytics?.calories?.maintenance || profile?.tdee || predictedMeta?.maintenanceCalories || targetKcal;
  const isCustomMaintenance = Boolean(
    profile?.isCustomMaintenance ?? analytics?.calories?.isCustomMaintenance
  );

  const progressRatio = Math.min(1, eatenKcal / (targetKcal || 1));
  const healthScore = analytics?.healthScore || 0;

  // Macro calculations including Fiber (HealthifyMe Pro style)
  const proteinCurrent = analytics?.macros?.protein?.consumed || 0;
  const proteinGoal = analytics?.macros?.protein?.target || profile?.proteinTarget || 120;

  const carbsCurrent = analytics?.macros?.carbs?.consumed || 0;
  const carbsGoal = analytics?.macros?.carbs?.target || profile?.carbTarget || 250;

  const fatsCurrent = analytics?.macros?.fat?.consumed || 0;
  const fatsGoal = analytics?.macros?.fat?.target || profile?.fatTarget || 65;

  const fiberCurrent = analytics?.macros?.fiber?.consumed || 0;
  const fiberGoal = analytics?.macros?.fiber?.target || 30;

  const handleWaterAdd = async () => {
    const newVol = Math.min(4000, waterMl + 250);
    setWaterMl(newVol);
    try {
      await healthService.logWater(250, selectedDate);
      refetchAnalytics();
    } catch (e) {}
  };

  const handleDeleteFoodEntry = async (logId, entryId) => {
    if (!logId || !entryId) return;
    try {
      await healthService.deleteFoodEntry(logId, entryId);
      queryClient.invalidateQueries(['dashboardAnalytics', selectedDate]);
      queryClient.invalidateQueries(['foodLogs', selectedDate]);
      useAppStore.getState().showToast('Meal entry removed', 'success');
    } catch (err) {
      useAppStore.getState().showToast(err.message || 'Could not remove meal entry', 'error');
    }
  };

  // Organize food logs by meal bucket
  const mealMap = {};
  foodLogs.forEach((group) => {
    const type = group.mealType || 'Snacks';
    mealMap[type] = group;
  });

  // Dynamic Ria Coach advice pill
  const getCoachInsight = () => {
    if (eatenKcal === 0) {
      return `🌅 ${greeting}, ${name}! Start with a protein-packed breakfast to power your day.`;
    }
    if (remainingKcal > 600) {
      const dinnerEstimate = Math.min(650, Math.round(remainingKcal * 0.6));
      return `✨ On Track! You have ${remainingKcal.toLocaleString()} kcal left. Target ~${dinnerEstimate} kcal with lean protein for dinner.`;
    }
    if (remainingKcal > 0) {
      return `🎯 Pacing well! ~${remainingKcal.toLocaleString()} kcal left. Opt for a light, high-fiber meal to finish strong.`;
    }
    return `⚡ Daily calorie target reached (${eatenKcal.toLocaleString()} kcal). Prioritize hydration and recovery tonight!`;
  };

  const quickActions = [
    { label: 'Ria AI Coach', icon: 'Bot', route: '/ai-coach', color: Colors.primary[50], iconColor: Colors.primary[600], border: Colors.primary[200] },
    { label: 'Log Food', icon: 'Utensils', route: '/food-search', color: Colors.surface, iconColor: Colors.energy[600], border: Colors.borderSubtle },
    { label: 'Weight Tracker', icon: 'Scale', route: '/(tabs)/measure', color: Colors.surface, iconColor: Colors.secondary[600], border: Colors.borderSubtle },
    { label: 'Fasting Timer', icon: 'Timer', route: '/fasting', color: Colors.surface, iconColor: Colors.warning, border: Colors.borderSubtle },
    { label: 'Workouts', icon: 'Dumbbell', route: '/workout-active', color: Colors.surface, iconColor: Colors.secondary[600], border: Colors.borderSubtle },
    { label: 'Recipes', icon: 'ChefHat', route: '/recipes', color: Colors.surface, iconColor: Colors.primary[600], border: Colors.borderSubtle },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Pinned Top Header */}
      <TopHeader title="Fitly" onCalendarPress={() => setShowCalendarModal(true)} />

      {/* Date Ribbon */}
      <View style={styles.dateSelectorWrap}>
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d)}
          onOpenCalendar={() => setShowCalendarModal(true)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Bento Card: HealthifyMe-style Calorie Ring & Budget */}
        <Card style={styles.heroCard}>
          <View style={styles.heroCardHeader}>
            <View>
              <Text style={styles.heroCardTitle}>Calorie & Health Ring</Text>
              <Text style={styles.heroCardSubtitle}>Daily metabolic budget • {selectedDate}</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: healthScore >= 70 ? Colors.primary[50] : '#FFFBEB' }]}>
              <View style={[styles.scoreDot, { backgroundColor: healthScore >= 70 ? Colors.primary[600] : Colors.warning }]} />
              <Text style={[styles.scoreText, { color: healthScore >= 70 ? Colors.primary[700] : Colors.warning }]}>
                HEALTH SCORE {healthScore}/100
              </Text>
            </View>
          </View>

          {/* Central Calorie Ring with Remaining Calories in Center */}
          <View style={styles.ringContainer}>
            <ProgressRing
              size={180}
              strokeWidth={14}
              progress={progressRatio}
              color={Colors.primary[500]}
              gradientEnd={Colors.primary[700]}
              label={remainingKcal.toLocaleString()}
              sublabel="CALORIES LEFT"
            />
          </View>

          {/* Calorie Stats Triad Breakdown */}
          <View style={styles.calRow}>
            <View style={styles.calItem}>
              <Text style={[styles.calVal, { color: Colors.primary[700] }]}>{eatenKcal.toLocaleString()}</Text>
              <Text style={styles.calLabel}>Consumed</Text>
            </View>
            <View style={styles.calDivider} />
            <View style={styles.calItem}>
              <Text style={[styles.calVal, { color: Colors.energy[600] }]}>{burnedKcal.toLocaleString()}</Text>
              <Text style={styles.calLabel}>Burned</Text>
            </View>
            <View style={styles.calDivider} />
            <View style={styles.calItem}>
              <Text style={[styles.calVal, { color: Colors.neutral[800] }]}>{targetKcal.toLocaleString()}</Text>
              <Text style={styles.calLabel}>Daily Target</Text>
            </View>
          </View>

          {/* Proactive Ria Coach Advice Pill (HealthifyMe Smart style) */}
          <View style={styles.coachInsightPill}>
            <View style={styles.coachIconCircle}>
              <Icon name="Sparkles" size={13} color={Colors.primary[700]} strokeWidth={2.4} />
            </View>
            <Text style={styles.coachInsightText}>{getCoachInsight()}</Text>
          </View>

          {/* Maintenance Calories Auto-Prediction & Quick Edit Bar */}
          <TouchableOpacity
            style={styles.maintenanceStrip}
            onPress={() => setMaintenanceModalVisible(true)}
            activeOpacity={0.8}
            testID="home-maintenance-edit-btn"
          >
            <View style={styles.maintenanceLeft}>
              <View style={styles.maintenanceIconWrap}>
                <Icon name="Flame" size={15} color={Colors.primary[600]} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.maintenanceTitleRow}>
                  <Text style={styles.maintenanceTitle}>Maintenance Calories (TDEE)</Text>
                  <View style={[styles.maintenancePill, isCustomMaintenance && styles.maintenancePillCustom]}>
                    <Text style={[styles.maintenancePillText, isCustomMaintenance && styles.maintenancePillTextCustom]}>
                      {isCustomMaintenance ? 'EDITED' : 'AUTO'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.maintenanceSub}>
                  {maintenanceKcal.toLocaleString()} kcal/day • {profile?.currentWeight || 71} kg, {profile?.height || 173} cm
                </Text>
              </View>
            </View>
            <View style={styles.maintenanceEditChip}>
              <Icon name="Edit2" size={12} color={Colors.primary[700]} strokeWidth={2.3} />
              <Text style={styles.maintenanceEditText}>Edit</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* 4-Macro Bento Grid (Protein, Carbs, Fats, Fiber) */}
        <Card style={styles.macroCard}>
          <View style={styles.macroHeaderRow}>
            <View>
              <Text style={styles.macroTitle}>Macronutrients & Fiber</Text>
              <Text style={styles.macroSubtitle}>Daily metabolic breakdown (100% Free)</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/food-search')} activeOpacity={0.7}>
              <Text style={styles.macroAddLink}>+ Log Food</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.macroBentoGrid}>
            {[
              { label: 'Protein', current: proteinCurrent, goal: proteinGoal, color: Colors.primary[600], unit: 'g' },
              { label: 'Carbs', current: carbsCurrent, goal: carbsGoal, color: Colors.energy[500], unit: 'g' },
              { label: 'Fats', current: fatsCurrent, goal: fatsGoal, color: Colors.secondary[500], unit: 'g' },
              { label: 'Fiber', current: fiberCurrent, goal: fiberGoal, color: Colors.accent, unit: 'g' },
            ].map((m) => {
              const ratio = Math.min(1, m.current / (m.goal || 1));
              return (
                <View key={m.label} style={styles.macroBentoItem}>
                  <View style={styles.macroLabelRow}>
                    <Text style={styles.macroLabel}>{m.label}</Text>
                    <Text style={styles.macroValue}>
                      {m.current}
                      <Text style={styles.macroGoal}>/{m.goal}{m.unit}</Text>
                    </Text>
                  </View>
                  <ProgressBar progress={ratio} color={m.color} height={6} />
                </View>
              );
            })}
          </View>
        </Card>

        {/* Intermittent Fasting Live Bento Widget (HealthifySmart Pro equivalent) */}
        <TouchableOpacity
          style={styles.fastingWidget}
          onPress={() => router.push('/fasting')}
          activeOpacity={0.85}
        >
          <View style={styles.fastingIconWrap}>
            <Icon name="Timer" size={20} color={Colors.warning} strokeWidth={2.3} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.fastingTitle}>16:8 Intermittent Fasting</Text>
              <View style={styles.fastingActivePill}>
                <Text style={styles.fastingActiveText}>PRO FEATURE • FREE</Text>
              </View>
            </View>
            <Text style={styles.fastingSub}>Live countdown • Fat burning & autophagy stages</Text>
          </View>
          <View style={styles.fastingActionArrow}>
            <Icon name="ChevronRight" size={16} color={Colors.neutral[500]} />
          </View>
        </TouchableOpacity>

        {/* HealthifyMe Signature Meal Targets Breakdown (Breakfast, Lunch, Snacks, Dinner) */}
        <View style={styles.mealsSectionHeader}>
          <SectionHeader
            title="Today's Meal Buckets"
            subtitle="Individual calorie targets & logged foods"
          />
        </View>

        <View style={styles.mealBucketsList}>
          {MEAL_BUCKETS.map((bucket) => {
            const group = mealMap[bucket.id];
            const consumed = group?.totalCalories || 0;
            const target = Math.round(targetKcal * bucket.ratio);
            const ratio = Math.min(1, consumed / (target || 1));
            const entries = group?.entries || [];

            return (
              <Card key={bucket.id} style={styles.mealBucketCard}>
                {/* Header with Icon, Name, Target kcal, and + Add Button */}
                <View style={styles.mealBucketHeader}>
                  <View style={styles.mealBucketTitleWrap}>
                    <View style={styles.mealIconBadge}>
                      <Icon name={bucket.icon} size={16} color={Colors.primary[700]} strokeWidth={2.2} />
                    </View>
                    <View>
                      <Text style={styles.mealBucketName}>{bucket.label}</Text>
                      <Text style={styles.mealBucketHint}>{bucket.timeHint}</Text>
                    </View>
                  </View>

                  <View style={styles.mealBucketRight}>
                    <Text style={styles.mealBucketKcal}>
                      <Text style={styles.mealBucketKcalBold}>{consumed}</Text> / {target} kcal
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push(`/food-search?meal=${bucket.id}`)}
                      style={styles.addFoodPill}
                      activeOpacity={0.8}
                    >
                      <Icon name="Plus" size={13} color={Colors.primary[700]} strokeWidth={2.5} />
                      <Text style={styles.addFoodPillText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Mini Meal Progress Bar */}
                <View style={{ marginVertical: 6 }}>
                  <ProgressBar
                    progress={ratio}
                    color={ratio > 1 ? Colors.warning : Colors.primary[600]}
                    height={4}
                  />
                </View>

                {/* Logged Foods List or Empty State Placeholder */}
                {entries.length === 0 ? (
                  <TouchableOpacity
                    onPress={() => router.push(`/food-search?meal=${bucket.id}`)}
                    style={styles.emptyBucketRow}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptyBucketText}>
                      Recommended ~{target} kcal • Tap + to log {bucket.label.toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.bucketEntriesList}>
                    {entries.map((entry, eIdx) => (
                      <View key={entry._id || eIdx} style={styles.bucketEntryRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bucketEntryName} numberOfLines={1}>{entry.foodName || 'Item'}</Text>
                          <Text style={styles.bucketEntrySub}>
                            {entry.servingUnit === 'g' || entry.servingUnit === 'grams' || entry.servingUnit === 'ml'
                              ? `${Math.round((entry.quantity || 1) * (entry.servingSize || 1) * 10) / 10} ${entry.servingUnit === 'ml' ? 'ml' : 'g'}`
                              : `${entry.quantity || 1} ${entry.servingUnit || 'serving'}`} • {entry.protein || 0}g protein
                          </Text>
                        </View>
                        <View style={styles.bucketEntryRight}>
                          <Text style={styles.bucketEntryCalories}>{entry.calories || 0} kcal</Text>
                          {group?._id && entry._id && (
                            <TouchableOpacity
                              onPress={() => handleDeleteFoodEntry(group._id, entry._id)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.deleteFoodBtn}
                            >
                              <Icon name="Trash2" size={13} color={Colors.neutral[400]} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        {/* Quick Tools Bento Grid */}
        <View style={styles.quickToolsSection}>
          <SectionHeader title="Daily Shortcuts" subtitle="Fast tracking & smart tools" />
          <View style={styles.grid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(action.route)}
                style={[
                  styles.gridItem,
                  {
                    backgroundColor: action.color,
                    borderColor: action.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.gridIconBox, { backgroundColor: `${action.iconColor}14` }]}>
                  <Icon name={action.icon} size={18} color={action.iconColor} strokeWidth={2.2} />
                </View>
                <Text style={styles.gridText} numberOfLines={1}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Hydration & Daily Activity Widgets */}
        <View style={styles.metricsRow}>
          <MetricCard
            title="Hydration"
            value={(waterMl / 1000).toFixed(1)}
            unit="L"
            subtitle={`Goal: ${((profile?.waterTarget || 2500) / 1000).toFixed(1)}L`}
            icon="Droplets"
            iconColor={Colors.secondary[600]}
            progress={Math.min(1, waterMl / (profile?.waterTarget || 2500))}
            badge="+250ml"
            onPress={handleWaterAdd}
            style={{ flex: 1 }}
          />

          <View style={styles.metricColumn}>
            <MetricCard
              title="Steps"
              value={(analytics?.activity?.steps || 0).toLocaleString()}
              subtitle={`Goal: ${analytics?.activity?.targetSteps || profile?.stepTarget || 8000}`}
              icon="Footprints"
              iconColor={Colors.primary[600]}
            />
            <MetricCard
              title="Sleep"
              value={analytics?.sleep?.hours || 0}
              unit="hrs"
              subtitle={`Quality: ${analytics?.sleep?.quality || 'Good'}`}
              icon="Moon"
              iconColor={Colors.neutral[700]}
            />
          </View>
        </View>
      </ScrollView>

      <MaintenanceCaloriesModal
        visible={maintenanceModalVisible}
        onClose={() => setMaintenanceModalVisible(false)}
      />

      <CalendarModal
        visible={showCalendarModal}
        selectedDate={selectedDate}
        onSelectDate={(d) => {
          setSelectedDate(d);
          setShowCalendarModal(false);
        }}
        onClose={() => setShowCalendarModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorWrap: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingVertical: Spacing.xs,
  },
  scrollContainer: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
    gap: Spacing.base,
  },
  heroCard: {
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCardTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  heroCardSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  scoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scoreText: {
    fontSize: Typography.sizes['2xs'],
    fontWeight: Typography.weights.bold,
    letterSpacing: Typography.tracking.wider,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  calItem: {
    alignItems: 'center',
    flex: 1,
  },
  calDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  calVal: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extrabold,
    letterSpacing: Typography.tracking.tight,
  },
  calLabel: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: Typography.tracking.wide,
  },
  coachInsightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  coachIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachInsightText: {
    fontSize: 12,
    color: Colors.primary[900],
    fontWeight: Typography.weights.medium,
    flex: 1,
    lineHeight: 17,
  },
  maintenanceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.sm,
  },
  maintenanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  maintenanceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maintenanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  maintenanceTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  maintenancePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  maintenancePillCustom: {
    backgroundColor: '#FEF3C7',
  },
  maintenancePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
  },
  maintenancePillTextCustom: {
    color: '#B45309',
  },
  maintenanceSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  maintenanceEditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  maintenanceEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  macroCard: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  macroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  macroTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  macroSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  macroAddLink: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  macroBentoGrid: {
    gap: Spacing.sm,
  },
  macroBentoItem: {
    gap: 4,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  macroValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  macroGoal: {
    fontWeight: Typography.weights.normal,
    color: Colors.textMuted,
  },
  fastingWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFBEB',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...Shadows.sm,
  },
  fastingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastingTitle: {
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.bold,
    color: '#92400E',
  },
  fastingActivePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fastingActiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  fastingSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  fastingActionArrow: {
    paddingLeft: Spacing.xs,
  },
  mealsSectionHeader: {
    marginTop: Spacing.xs,
  },
  mealBucketsList: {
    gap: Spacing.sm,
  },
  mealBucketCard: {
    padding: Spacing.md,
    gap: 6,
  },
  mealBucketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealBucketTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealBucketName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  mealBucketHint: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  mealBucketRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealBucketKcal: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  mealBucketKcalBold: {
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  addFoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  addFoodPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  emptyBucketRow: {
    paddingVertical: Spacing.xs,
  },
  emptyBucketText: {
    fontSize: 11,
    color: Colors.neutral[400],
    fontStyle: 'italic',
  },
  bucketEntriesList: {
    gap: 6,
    marginTop: 4,
  },
  bucketEntryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bucketEntryName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  bucketEntrySub: {
    fontSize: 10,
    color: Colors.neutral[500],
    marginTop: 1,
  },
  bucketEntryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bucketEntryCalories: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.neutral[700],
  },
  deleteFoodBtn: {
    padding: 2,
  },
  quickToolsSection: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridItem: {
    width: '31%',
    flexGrow: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  gridIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: Typography.tracking.wide,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricColumn: {
    flex: 1,
    gap: Spacing.sm,
  },
});
