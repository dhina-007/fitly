import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';
import { Card, AppHeader, Icon, Button, SectionHeader, BottomSheet, WorkoutListItem, TopHeader } from '../../components/ui';
import { healthService } from '../../services/health.service';

export default function WorkoutScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [previewWorkout, setPreviewWorkout] = useState(null);

  // 1. Fetch available structured workouts from backend
  const { data: workouts = [], isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['workoutsList', selectedFilter],
    queryFn: () => healthService.getWorkouts({ category: selectedFilter !== 'All' ? selectedFilter : undefined }),
  });

  // 2. Fetch coach recommendation
  const { data: recommendationData, isLoading: isLoadingRec } = useQuery({
    queryKey: ['workoutRecommendation'],
    queryFn: () => healthService.getWorkoutRecommendation(),
  });

  // 3. Fetch user workout logs and weekly stats
  const { data: logsResponse, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['workoutLogs', '30d'],
    queryFn: () => healthService.getWorkoutLogs('30d'),
  });

  const workoutLogs = logsResponse?.data || [];
  const weeklyStats = logsResponse?.weeklyStats || {
    sessionsCount: 0,
    totalMinutes: 0,
    totalCalories: 0,
    totalVolumeKg: 0,
    daysTrainedCount: 0,
  };

  const recommendedWorkout = recommendationData?.workout;
  const recommendationReason = recommendationData?.rationale;
  const userGoal = recommendationData?.userGoal || 'weight_loss';

  // Format goal display
  const goalLabel = useMemo(() => {
    const map = {
      weight_loss: 'Fat Loss & Conditioning',
      muscle_building: 'Hypertrophy & Strength',
      weight_gain: 'Muscle Mass Building',
      general_fitness: 'Functional General Fitness',
      improved_activity: 'Cardio & Joint Health',
    };
    return map[userGoal] || 'Fitness Progression';
  }, [userGoal]);

  // Start a specific workout routine
  const handleStartWorkout = (workout) => {
    setPreviewWorkout(null);
    router.push({
      pathname: '/workout-active',
      params: {
        workoutId: workout._id,
        workoutName: workout.name,
        category: workout.category,
        duration: workout.duration,
        exercisesData: JSON.stringify(workout.exercises || []),
      },
    });
  };

  // Start an empty custom workout
  const handleStartCustomWorkout = () => {
    router.push({
      pathname: '/workout-active',
      params: {
        workoutName: 'Custom Strength Session',
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Pinned Unified Top Header */}
      <TopHeader title="Workouts" />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 1. Weekly Consistency Strip & Training Volume */}
        <Card style={styles.consistencyCard}>
          <View style={styles.consistencyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="Activity" size={17} color={Colors.primary[600]} strokeWidth={2.4} />
              <Text style={styles.consistencyTitle}>Weekly Consistency</Text>
            </View>
            <View style={styles.consistencyBadge}>
              <Text style={styles.consistencyBadgeText}>
                {weeklyStats.sessionsCount} session{weeklyStats.sessionsCount !== 1 ? 's' : ''} this week
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SESSIONS</Text>
              <Text style={styles.statVal}>{weeklyStats.sessionsCount}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statVal}>{weeklyStats.totalMinutes} min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>BURNED</Text>
              <Text style={[styles.statVal, { color: Colors.energy[600] }]}>
                {weeklyStats.totalCalories} kcal
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>VOLUME</Text>
              <Text style={[styles.statVal, { color: Colors.primary[700] }]}>
                {weeklyStats.totalVolumeKg > 0 ? `${(weeklyStats.totalVolumeKg / 1000).toFixed(1)}t` : '0 kg'}
              </Text>
            </View>
          </View>
        </Card>

        {/* 2. Today's Coach Recommendation Hero Card */}
        {recommendedWorkout && (
          <Card variant="dark" style={styles.recommendationCard}>
            <View style={styles.recHeaderRow}>
              <View style={styles.coachBadge}>
                <Icon name="Sparkles" size={13} color={Colors.energy[400]} strokeWidth={2.2} />
                <Text style={styles.coachBadgeText}>TODAY'S COACH PLAN</Text>
              </View>
              <View style={styles.goalPill}>
                <Text style={styles.goalPillText}>{goalLabel}</Text>
              </View>
            </View>

            <Text style={styles.recTitle}>{recommendedWorkout.name}</Text>
            <Text style={styles.recSubtitle}>
              {recommendedWorkout.exercises?.length || 0} Exercises • {recommendedWorkout.duration} mins • ~{recommendedWorkout.totalCalories} kcal
            </Text>

            {recommendationReason ? (
              <View style={styles.rationaleBox}>
                <Icon name="Info" size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.rationaleText} numberOfLines={2}>
                  {recommendationReason}
                </Text>
              </View>
            ) : null}

            {/* Quick Equipment Tags */}
            <View style={styles.equipRow}>
              {(recommendedWorkout.equipment || ['Bodyweight']).map((eq, i) => (
                <View key={i} style={styles.equipChip}>
                  <Text style={styles.equipChipText}>{eq}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.recActionsRow}>
              <TouchableOpacity
                onPress={() => setPreviewWorkout(recommendedWorkout)}
                style={styles.previewBtn}
                activeOpacity={0.8}
              >
                <Icon name="Eye" size={15} color={Colors.white} />
                <Text style={styles.previewBtnText}>Preview Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStartWorkout(recommendedWorkout)}
                style={styles.startHeroBtn}
                activeOpacity={0.8}
              >
                <Icon name="Play" size={15} color={Colors.white} />
                <Text style={styles.startHeroBtnText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* 3. Quick Empty / Custom Session Launcher */}
        <TouchableOpacity
          onPress={handleStartCustomWorkout}
          style={styles.customSessionBanner}
          activeOpacity={0.8}
        >
          <View style={styles.customBannerIcon}>
            <Icon name="Dumbbell" size={20} color={Colors.primary[600]} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customBannerTitle}>Start Free-Form Workout</Text>
            <Text style={styles.customBannerSub}>Log your own sets, reps, weights, and automated rest</Text>
          </View>
          <Icon name="ChevronRight" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* 4. Category Filter Chips */}
        <View style={styles.filtersSection}>
          <SectionHeader
            title="Training Programs"
            subtitle="Coach-curated routines by training style"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {['All', 'Strength', 'Cardio', 'Home', 'Mobility'].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 5. Workout Routines List */}
        {isLoadingWorkouts ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={Colors.primary[600]} />
            <Text style={styles.loaderText}>Loading workout library...</Text>
          </View>
        ) : workouts.length === 0 ? (
          <Card variant="flat" style={styles.emptyCard}>
            <Icon name="Dumbbell" size={30} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No workouts found for this filter</Text>
            <Text style={styles.emptySub}>Try selecting 'All' to browse all training programs.</Text>
          </Card>
        ) : (
          <View style={styles.routinesList}>
            {workouts.map((workout) => (
              <WorkoutListItem
                key={workout._id}
                title={workout.name}
                subtitle={`${workout.exercises?.length || 0} Exercises • ${workout.difficulty || 'All levels'}`}
                duration={`${workout.duration} mins`}
                category={workout.category?.replace('_', ' ').toUpperCase()}
                caloriesBurned={workout.totalCalories}
                icon={workout.category === 'hiit' ? 'Flame' : workout.category === 'mobility' ? 'Activity' : 'Dumbbell'}
                onPress={() => setPreviewWorkout(workout)}
                onStart={() => handleStartWorkout(workout)}
              />
            ))}
          </View>
        )}

        {/* 6. Recent Training Activity History */}
        <View style={styles.historySection}>
          <SectionHeader
            title="Recent Training Logs"
            subtitle={`${workoutLogs.length} total completed sessions`}
          />

          {isLoadingLogs ? (
            <ActivityIndicator size="small" color={Colors.primary[600]} />
          ) : workoutLogs.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Icon name="Calendar" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No workouts logged yet</Text>
              <Text style={styles.emptySub}>
                Start today's recommended plan or a free-form session above to build your training history.
              </Text>
            </Card>
          ) : (
            <View style={styles.historyList}>
              {workoutLogs.slice(0, 5).map((log) => {
                const totalSets = (log.exercises || []).reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
                return (
                  <Card key={log._id} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <View>
                        <Text style={styles.historyTitle}>{log.workoutName}</Text>
                        <Text style={styles.historyDate}>{log.date}</Text>
                      </View>
                      <View style={styles.historyBadge}>
                        <Icon name="CheckCircle" size={13} color={Colors.success} strokeWidth={2.4} />
                        <Text style={styles.historyBadgeText}>COMPLETED</Text>
                      </View>
                    </View>

                    <View style={styles.historyStatsRow}>
                      <View style={styles.historyStatItem}>
                        <Icon name="Clock" size={12} color={Colors.textMuted} />
                        <Text style={styles.historyStatText}>{log.durationMinutes} mins</Text>
                      </View>
                      <View style={styles.historyStatItem}>
                        <Icon name="Flame" size={12} color={Colors.energy[600]} />
                        <Text style={styles.historyStatText}>{log.caloriesBurned} kcal</Text>
                      </View>
                      <View style={styles.historyStatItem}>
                        <Icon name="Layers" size={12} color={Colors.primary[600]} />
                        <Text style={styles.historyStatText}>{totalSets} sets</Text>
                      </View>
                    </View>

                    {log.notes ? (
                      <Text style={styles.historyNotes} numberOfLines={1}>
                        {log.notes}
                      </Text>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* Routine Detail & Preview BottomSheet Modal */}
      <BottomSheet
        visible={!!previewWorkout}
        onClose={() => setPreviewWorkout(null)}
        title={previewWorkout?.name || 'Workout Details'}
        subtitle={`${previewWorkout?.duration || 0} mins • ${previewWorkout?.exercises?.length || 0} exercises`}
        height="85%"
      >
        {previewWorkout && (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Meta Tags */}
            <View style={styles.previewMetaRow}>
              <View style={styles.previewMetaPill}>
                <Text style={styles.previewMetaPillText}>
                  LEVEL: {(previewWorkout.difficulty || 'All').toUpperCase()}
                </Text>
              </View>
              <View style={[styles.previewMetaPill, { backgroundColor: Colors.energy[50], borderColor: Colors.energy[200] }]}>
                <Text style={[styles.previewMetaPillText, { color: Colors.energy[700] }]}>
                  EST. {previewWorkout.totalCalories} KCAL
                </Text>
              </View>
            </View>

            <Text style={styles.previewDesc}>{previewWorkout.description}</Text>

            {/* Warm-Up Guidance */}
            <Card style={styles.warmupCard}>
              <View style={styles.warmupHeader}>
                <Icon name="Zap" size={16} color={Colors.warning} strokeWidth={2.4} />
                <Text style={styles.warmupTitle}>Coach Dynamic Warm-up (3–5 Mins)</Text>
              </View>
              <Text style={styles.warmupText}>
                Perform arm circles, bodyweight squats, cat-cow, and light leg swings to elevate core temperature and lubricate joints before loading.
              </Text>
            </Card>

            {/* Exercise List */}
            <Text style={styles.exerciseSectionHeading}>Planned Working Sets</Text>
            <View style={styles.previewExercisesList}>
              {(previewWorkout.exercises || []).map((ex, idx) => {
                const exDoc = ex.exercise || {};
                const muscleText = (exDoc.muscleGroups || []).join(', ');
                return (
                  <View key={ex._id || idx} style={styles.previewExerciseRow}>
                    <View style={styles.previewExNumBox}>
                      <Text style={styles.previewExNum}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewExName}>{ex.exerciseName}</Text>
                      {muscleText ? (
                        <Text style={styles.previewExMuscles}>{muscleText}</Text>
                      ) : null}
                      <Text style={styles.previewExDetails}>
                        {ex.sets} sets × {ex.reps ? `${ex.reps} reps` : `${ex.duration}s`} • {ex.restSeconds || 60}s rest
                      </Text>
                      {ex.notes ? (
                        <Text style={styles.previewExNotes}>{ex.notes}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Stop Exercise Safety Guidance */}
            <View style={styles.safetyCallout}>
              <Icon name="AlertCircle" size={16} color={Colors.neutral[500]} />
              <Text style={styles.safetyText}>
                Safety first: Pause or terminate the session immediately if you feel acute joint pain, dizziness, or lightheadedness.
              </Text>
            </View>

            {/* Launch Button */}
            <Button
              title="Begin This Workout"
              onPress={() => handleStartWorkout(previewWorkout)}
              variant="primary"
              icon="Play"
              style={{ marginTop: Spacing.base, marginBottom: Spacing.xl }}
            />
          </ScrollView>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  consistencyCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  consistencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consistencyTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  consistencyBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  consistencyBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: Typography.sizes['2xs'],
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.borderLight,
  },
  recommendationCard: {
    padding: Spacing.lg,
    gap: Spacing.xs,
    ...Shadows.md,
  },
  recHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  coachBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.energy[400],
    letterSpacing: 0.8,
  },
  goalPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  goalPillText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: Typography.weights.medium,
  },
  recTitle: {
    color: Colors.white,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    letterSpacing: Typography.tracking.tight,
    marginTop: 4,
  },
  recSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  rationaleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.xs,
  },
  rationaleText: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  equipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginVertical: Spacing.xs,
  },
  equipChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  equipChipText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: Typography.weights.medium,
  },
  recActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  previewBtnText: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  startHeroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary[600],
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  startHeroBtnText: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  customSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  customBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBannerTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  customBannerSub: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
    marginTop: 2,
  },
  filtersSection: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  filtersScroll: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  filterText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: Typography.weights.bold,
  },
  loaderWrap: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  routinesList: {
    gap: Spacing.xs,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  emptySub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
  },
  historySection: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  historyList: {
    gap: Spacing.sm,
  },
  historyCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  historyDate: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
    marginTop: 1,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  historyBadgeText: {
    fontSize: 9,
    fontWeight: Typography.weights.extrabold,
    color: Colors.success,
    letterSpacing: 0.5,
  },
  historyStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  historyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyStatText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  historyNotes: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  previewMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  previewMetaPill: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  previewMetaPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  previewDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  warmupCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    padding: Spacing.md,
    gap: 6,
    marginBottom: Spacing.md,
  },
  warmupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warmupTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#92400E',
  },
  warmupText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
  exerciseSectionHeading: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  previewExercisesList: {
    gap: Spacing.sm,
  },
  previewExerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  previewExNumBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  previewExNum: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  previewExName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  previewExMuscles: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.primary[700],
    fontWeight: Typography.weights.semibold,
    marginTop: 1,
  },
  previewExDetails: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
    marginTop: 2,
  },
  previewExNotes: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  safetyCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: Spacing.md,
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
