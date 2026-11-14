import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants';
import { Card, AppHeader, Icon, Button, BottomSheet } from '../components/ui';
import { healthService } from '../services/health.service';
import { useDateStore } from '../store/dateStore';
import { useAppStore } from '../store/appStore';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { selectedDate } = useDateStore();

  const workoutName = params.workoutName || 'Active Workout Session';
  const workoutCategory = params.category || 'strength';

  // Fetch user profile for accurate body weight calculation
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await healthService.getProfile?.() || {};
      return res;
    },
  });

  // 1. Initialize Exercises from params or fallback
  const initialExercises = useMemo(() => {
    if (params.exercisesData) {
      try {
        const parsed = JSON.parse(params.exercisesData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => {
            const exDoc = item.exercise || {};
            const numSets = Number(item.sets) || 3;
            const targetReps = item.reps ? String(item.reps) : '10';
            const targetWeight = item.weight ? String(item.weight) : '0';

            const setsArr = [];
            for (let s = 1; s <= numSets; s++) {
              setsArr.push({
                setNum: s,
                weight: targetWeight,
                reps: targetReps,
                completed: false,
              });
            }

            return {
              id: `ex-${idx}-${Date.now()}`,
              exerciseId: exDoc._id || item._id,
              name: item.exerciseName || exDoc.name || 'Exercise',
              bodyPart: (exDoc.muscleGroups || []).join(', ') || 'Full Body',
              equipment: (exDoc.equipment || []).join(', ') || 'Bodyweight',
              instructions: exDoc.instructions || [],
              notes: item.notes || '',
              restSeconds: item.restSeconds || 60,
              sets: setsArr,
            };
          });
        }
      } catch (e) {
        console.warn('Failed to parse exercisesData:', e);
      }
    }

    // Default custom session exercises
    return [
      {
        id: '1',
        name: 'Barbell Back Squat',
        bodyPart: 'Quads, Glutes',
        equipment: 'Barbell',
        instructions: ['Brace core, descend until thighs parallel to floor, drive up through mid-foot.'],
        restSeconds: 90,
        sets: [
          { setNum: 1, weight: '60', reps: '10', completed: false },
          { setNum: 2, weight: '65', reps: '8', completed: false },
          { setNum: 3, weight: '70', reps: '6', completed: false },
        ],
      },
      {
        id: '2',
        name: 'Push-ups',
        bodyPart: 'Chest, Triceps, Core',
        equipment: 'Bodyweight',
        instructions: ['Hands shoulder-width, body in a rigid plank, lower chest 2 inches from floor.'],
        restSeconds: 60,
        sets: [
          { setNum: 1, weight: '0', reps: '12', completed: false },
          { setNum: 2, weight: '0', reps: '12', completed: false },
          { setNum: 3, weight: '0', reps: '10', completed: false },
        ],
      },
    ];
  }, [params.exercisesData]);

  const [exercises, setExercises] = useState(initialExercises);

  // 2. Elapsed Stopwatch Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 3. Automated Rest Timer
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (restTimerActive && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((s) => s - 1);
      }, 1000);
    } else if (restTimerSeconds === 0) {
      setRestTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [restTimerActive, restTimerSeconds]);

  // 4. Modals State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formGuideExercise, setFormGuideExercise] = useState(null);
  const [substitutionTargetIndex, setSubstitutionTargetIndex] = useState(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');

  // 5. Progress Calculation
  const { totalSets, completedSets, progressPercent, totalVolumeKg } = useMemo(() => {
    let total = 0;
    let completed = 0;
    let volume = 0;

    exercises.forEach((ex) => {
      (ex.sets || []).forEach((s) => {
        total++;
        if (s.completed) {
          completed++;
          const wt = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps, 10) || 0;
          if (wt > 0 && r > 0) {
            volume += wt * r;
          }
        }
      });
    });

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      totalSets: total,
      completedSets: completed,
      progressPercent: pct,
      totalVolumeKg: volume,
    };
  }, [exercises]);

  // Set Actions
  const toggleSet = (exIdx, setIdx) => {
    const updated = [...exercises];
    const targetSet = updated[exIdx].sets[setIdx];
    targetSet.completed = !targetSet.completed;
    setExercises(updated);

    if (targetSet.completed) {
      const restTime = updated[exIdx].restSeconds || 60;
      setRestTimerSeconds(restTime);
      setRestTimerActive(true);
    }
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    const updated = [...exercises];
    updated[exIdx].sets[setIdx][field] = value;
    setExercises(updated);
  };

  const addSet = (exIdx) => {
    const updated = [...exercises];
    const currentSets = updated[exIdx].sets;
    const lastSet = currentSets[currentSets.length - 1];
    const newSetNum = currentSets.length + 1;

    updated[exIdx].sets.push({
      setNum: newSetNum,
      weight: lastSet ? lastSet.weight : '0',
      reps: lastSet ? lastSet.reps : '10',
      completed: false,
    });
    setExercises(updated);
  };

  const removeSet = (exIdx, setIdx) => {
    const updated = [...exercises];
    if (updated[exIdx].sets.length <= 1) return;
    updated[exIdx].sets.splice(setIdx, 1);
    // Renumber remaining sets
    updated[exIdx].sets.forEach((s, idx) => {
      s.setNum = idx + 1;
    });
    setExercises(updated);
  };

  // Exercise Actions
  const handleSubstituteExercise = (newExercise) => {
    if (substitutionTargetIndex === null) return;
    const updated = [...exercises];
    const target = updated[substitutionTargetIndex];

    updated[substitutionTargetIndex] = {
      ...target,
      name: newExercise.name,
      bodyPart: newExercise.bodyPart,
      equipment: newExercise.equipment,
      instructions: newExercise.instructions,
    };
    setExercises(updated);
    setSubstitutionTargetIndex(null);
  };

  const handleAddCustomExercise = () => {
    if (!customExerciseName.trim()) return;
    setExercises((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: customExerciseName.trim(),
        bodyPart: 'Target Muscle',
        equipment: 'Dumbbells / Barbell',
        instructions: ['Maintain proper spine alignment and controlled range of motion.'],
        restSeconds: 60,
        sets: [
          { setNum: 1, weight: '20', reps: '10', completed: false },
          { setNum: 2, weight: '20', reps: '10', completed: false },
          { setNum: 3, weight: '20', reps: '8', completed: false },
        ],
      },
    ]);
    setCustomExerciseName('');
    setShowAddExerciseModal(false);
  };

  // Calorie Burn Calculation via MET formula
  const calculatedCaloriesBurned = useMemo(() => {
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const bodyWeightKg = profile?.currentWeight || 70;

    let met = 5.5;
    const cat = workoutCategory.toLowerCase();
    if (cat.includes('hiit') || cat.includes('cardio')) {
      met = 8.0;
    } else if (cat.includes('mobility')) {
      met = 3.2;
    } else if (cat.includes('strength') || cat.includes('muscle')) {
      met = 6.0;
    }

    return Math.round(((met * 3.5 * bodyWeightKg) / 200) * durationMinutes);
  }, [elapsedSeconds, workoutCategory, profile]);

  // Finish Workout Submission
  const handleSaveAndFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const activeDate = selectedDate || new Date().toISOString().split('T')[0];
      const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

      const payload = {
        date: activeDate,
        workoutId: params.workoutId || null,
        workoutName,
        durationMinutes,
        caloriesBurned: calculatedCaloriesBurned,
        notes: completionNotes || (totalVolumeKg > 0 ? `Total volume lifted: ${totalVolumeKg.toLocaleString()} kg` : ''),
        exercises: exercises.map((ex) => ({
          exerciseName: ex.name,
          sets: ex.sets.map((s) => ({
            setNumber: s.setNum,
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
            completed: !!s.completed,
          })),
        })),
      };

      await healthService.logWorkout(payload);
      await healthService.logActivity(
        Math.round(durationMinutes * 95),
        calculatedCaloriesBurned,
        activeDate
      );

      queryClient.invalidateQueries(['dashboardAnalytics']);
      queryClient.invalidateQueries(['workoutLogs']);
      queryClient.invalidateQueries(['workoutRecommendation']);
      queryClient.invalidateQueries(['communities']);
      queryClient.invalidateQueries(['feedPosts']);

      setShowCompletionModal(false);
      useAppStore.getState().showToast(
        `Workout saved! ${durationMinutes} min • ${calculatedCaloriesBurned} kcal burned`,
        'success'
      );
      if (Platform.OS === 'web') {
        router.replace('/(tabs)/workout');
      } else {
        Alert.alert(
          'Workout Saved!',
          `Fantastic effort! ${durationMinutes} minutes completed with ${calculatedCaloriesBurned} kcal burned.`,
          [{ text: 'Great!', onPress: () => router.replace('/(tabs)/workout') }]
        );
      }
    } catch (err) {
      useAppStore.getState().showToast(err.message || 'Failed to save workout log', 'error');
      if (Platform.OS !== 'web') {
        Alert.alert('Save Error', err.message || 'Failed to save workout log');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web' && elapsedSeconds > 30) {
      Alert.alert(
        'Exit Active Workout?',
        'Your current timer and uncompleted sets will not be recorded.',
        [
          { text: 'Keep Training', style: 'cancel' },
          { text: 'Leave Session', style: 'destructive', onPress: () => router.replace('/(tabs)/workout') },
        ]
      );
    } else {
      router.replace('/(tabs)/workout');
    }
  };

  // Pre-curated substitutes for common exercises
  const commonSubstitutes = [
    {
      name: 'Goblet Squat',
      bodyPart: 'Quads, Glutes, Core',
      equipment: 'Dumbbell / Kettlebell',
      instructions: ['Hold weight at chest, sit deep between hips with upright torso. Low impact on lower back.'],
    },
    {
      name: 'Bodyweight Box / Chair Squat',
      bodyPart: 'Quads, Glutes',
      equipment: 'Bodyweight, Chair',
      instructions: ['Controlled descent to chair, pause without rocking, stand up powerfully.'],
    },
    {
      name: 'Knee Push-ups (Low Impact)',
      bodyPart: 'Chest, Triceps',
      equipment: 'Bodyweight',
      instructions: ['Kneeling plank position reduces bodyweight load by ~45% while preserving chest activation.'],
    },
    {
      name: 'Dumbbell Floor Press',
      bodyPart: 'Chest, Triceps',
      equipment: 'Dumbbells',
      instructions: ['Lying on floor stops elbows at 90°, protecting shoulders from deep hyperextension.'],
    },
    {
      name: 'Dumbbell Single-Arm Row',
      bodyPart: 'Lats, Upper Back',
      equipment: 'Dumbbell, Bench',
      instructions: ['Brace with one hand on bench to de-load the lumbar spine.'],
    },
    {
      name: 'Low-Impact Step Burpees',
      bodyPart: 'Full Body, Cardio',
      equipment: 'Bodyweight',
      instructions: ['Step back into plank without jumping. Safe on knees, ankles, and spinal discs.'],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header with Stopwatch and Finish Action */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.iconBtn}
          activeOpacity={0.7}
          testID="active-workout-back-btn"
        >
          <Icon name="ArrowLeft" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Stopwatch Display */}
        <View style={styles.timerDisplayWrap}>
          <View style={styles.timerRow}>
            <View style={[styles.timerLiveDot, isPaused && styles.timerPausedDot]} />
            <Text style={styles.stopwatchText}>{formatTimer(elapsedSeconds)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsPaused(!isPaused)}
            style={styles.pauseResumeBtn}
            activeOpacity={0.7}
          >
            <Icon
              name={isPaused ? 'Play' : 'Pause'}
              size={12}
              color={isPaused ? Colors.success : Colors.warning}
              strokeWidth={2.4}
            />
            <Text style={[styles.pauseResumeText, { color: isPaused ? Colors.success : Colors.warning }]}>
              {isPaused ? 'RESUME' : 'PAUSE'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setShowCompletionModal(true)}
          style={styles.finishBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.finishBtnText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Session Progress Header Card */}
      <View style={styles.sessionHeaderWrap}>
        <View style={styles.sessionTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionName} numberOfLines={1}>{workoutName}</Text>
            <Text style={styles.sessionSub}>
              {completedSets} of {totalSets} sets done • {progressPercent}%
            </Text>
          </View>
          <View style={styles.volumeBadge}>
            <Text style={styles.volumeBadgeLabel}>VOLUME</Text>
            <Text style={styles.volumeBadgeVal}>{totalVolumeKg.toLocaleString()} kg</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Main Exercises List */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Coach Form & Safety Reminder */}
        <View style={styles.safetyCard}>
          <Icon name="Shield" size={15} color={Colors.primary[700]} strokeWidth={2.2} />
          <Text style={styles.safetyNoticeText}>
            Coach Cue: Prioritize controlled eccentric tempo over heavy weight. Stop if experiencing acute joint pain.
          </Text>
        </View>

        {exercises.map((ex, exIdx) => (
          <Card key={ex.id} style={styles.exerciseCard}>
            {/* Exercise Header */}
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <View style={styles.tagsRow}>
                  {ex.bodyPart ? (
                    <View style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{ex.bodyPart}</Text>
                    </View>
                  ) : null}
                  {ex.equipment ? (
                    <View style={styles.equipTag}>
                      <Text style={styles.equipTagText}>{ex.equipment}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Utility Actions: Form Tips & Substitute */}
              <View style={styles.exActionButtons}>
                <TouchableOpacity
                  onPress={() => setFormGuideExercise(ex)}
                  style={styles.smallActionBtn}
                  activeOpacity={0.7}
                >
                  <Icon name="HelpCircle" size={14} color={Colors.primary[700]} />
                  <Text style={styles.smallActionBtnText}>Tips</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSubstitutionTargetIndex(exIdx)}
                  style={styles.smallActionBtn}
                  activeOpacity={0.7}
                >
                  <Icon name="RefreshCw" size={13} color={Colors.textSecondary} />
                  <Text style={styles.smallActionBtnText}>Swap</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Table Column Headers */}
            <View style={styles.tableHeader}>
              <Text style={[styles.colHeader, { width: 44 }]}>SET</Text>
              <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>KG</Text>
              <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>REPS</Text>
              <Text style={[styles.colHeader, { width: 52, textAlign: 'center' }]}>DONE</Text>
            </View>

            {/* Sets Rows */}
            <View style={styles.setsContainer}>
              {ex.sets.map((s, setIdx) => (
                <View
                  key={setIdx}
                  style={[styles.setRow, s.completed && styles.setRowCompleted]}
                >
                  <View style={styles.setNumBox}>
                    <Text style={[styles.setNumber, s.completed && { color: Colors.success }]}>
                      {s.setNum}
                    </Text>
                  </View>

                  {/* Weight Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={String(s.weight)}
                      onChangeText={(val) => updateSet(exIdx, setIdx, 'weight', val)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      style={[styles.setInput, s.completed && styles.setInputCompleted]}
                    />
                  </View>

                  {/* Reps Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={String(s.reps)}
                      onChangeText={(val) => updateSet(exIdx, setIdx, 'reps', val)}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      style={[styles.setInput, s.completed && styles.setInputCompleted]}
                    />
                  </View>

                  {/* Done Checkbox */}
                  <TouchableOpacity
                    onPress={() => toggleSet(exIdx, setIdx)}
                    style={styles.doneBtnContainer}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.doneBtn, s.completed && styles.doneBtnActive]}>
                      {s.completed ? (
                        <Icon name="Check" size={16} color={Colors.white} strokeWidth={3} />
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  {/* Delete Set option (if set count > 1) */}
                  {ex.sets.length > 1 && !s.completed ? (
                    <TouchableOpacity
                      onPress={() => removeSet(exIdx, setIdx)}
                      style={styles.deleteSetBtn}
                      activeOpacity={0.7}
                    >
                      <Icon name="X" size={13} color={Colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Add Set Button */}
            <TouchableOpacity
              onPress={() => addSet(exIdx)}
              style={styles.addSetBtn}
              activeOpacity={0.7}
            >
              <Icon name="Plus" size={15} color={Colors.primary[600]} strokeWidth={2.4} />
              <Text style={styles.addSetBtnText}>Add Set</Text>
            </TouchableOpacity>
          </Card>
        ))}

        {/* Add Another Exercise to Session */}
        <TouchableOpacity
          onPress={() => setShowAddExerciseModal(true)}
          style={styles.addExerciseCard}
          activeOpacity={0.8}
        >
          <Icon name="PlusCircle" size={18} color={Colors.primary[600]} strokeWidth={2.4} />
          <Text style={styles.addExerciseText}>Add Exercise to Workout</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>

      {/* Floating Rest Timer Bar */}
      {restTimerActive && restTimerSeconds > 0 && (
        <View style={styles.timerBar}>
          <View style={styles.timerInfo}>
            <Icon name="Timer" size={18} color={Colors.white} strokeWidth={2.4} />
            <Text style={styles.timerText}>Rest Timer</Text>
          </View>

          <Text style={styles.timerValue}>{restTimerSeconds}s</Text>

          <View style={styles.timerActionsRow}>
            <TouchableOpacity
              onPress={() => setRestTimerSeconds((s) => s + 30)}
              style={styles.timerSmallBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.timerSmallBtnText}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setRestTimerSeconds(0);
                setRestTimerActive(false);
              }}
              style={styles.timerSmallBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.timerSmallBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Form Tips Modal */}
      <Modal
        visible={!!formGuideExercise}
        transparent
        animationType="fade"
        onRequestClose={() => setFormGuideExercise(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFormGuideExercise(null)}>
          <Pressable style={styles.formGuideCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{formGuideExercise?.name}</Text>
                <Text style={styles.modalSubtitle}>Technique & Form Guidance</Text>
              </View>
              <TouchableOpacity onPress={() => setFormGuideExercise(null)}>
                <Icon name="X" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {(formGuideExercise?.instructions || []).map((step, idx) => (
                <View key={idx} style={styles.instructionStep}>
                  <Text style={styles.stepNum}>{idx + 1}.</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </ScrollView>

            <Button
              title="Got It"
              onPress={() => setFormGuideExercise(null)}
              variant="primary"
              size="sm"
              style={{ marginTop: Spacing.md }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Exercise Substitution Modal */}
      <Modal
        visible={substitutionTargetIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSubstitutionTargetIndex(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSubstitutionTargetIndex(null)}>
          <Pressable style={styles.substitutionCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Substitute Exercise</Text>
                <Text style={styles.modalSubtitle}>Select an accessible alternative or regression</Text>
              </View>
              <TouchableOpacity onPress={() => setSubstitutionTargetIndex(null)}>
                <Icon name="X" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {commonSubstitutes.map((sub, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSubstituteExercise(sub)}
                  style={styles.subItem}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subItemName}>{sub.name}</Text>
                    <Text style={styles.subItemMeta}>{sub.bodyPart} • {sub.equipment}</Text>
                    <Text style={styles.subItemDesc}>{sub.instructions[0]}</Text>
                  </View>
                  <Icon name="ChevronRight" size={16} color={Colors.primary[600]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Custom Exercise Modal */}
      <Modal
        visible={showAddExerciseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddExerciseModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAddExerciseModal(false)}>
          <Pressable style={styles.addExerciseModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <TouchableOpacity onPress={() => setShowAddExerciseModal(false)}>
                <Icon name="X" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={customExerciseName}
              onChangeText={setCustomExerciseName}
              placeholder="e.g. Incline Dumbbell Press"
              placeholderTextColor={Colors.textMuted}
              style={styles.customExInput}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowAddExerciseModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Add to Workout"
                variant="primary"
                onPress={handleAddCustomExercise}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Completion Summary BottomSheet Modal */}
      <BottomSheet
        visible={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title="Session Summary"
        subtitle="Review what you accomplished today"
        height="80%"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Trophy Header */}
          <View style={styles.summaryTrophyBox}>
            <View style={styles.trophyIconWrap}>
              <Icon name="Award" size={32} color={Colors.primary[600]} strokeWidth={2.4} />
            </View>
            <Text style={styles.summaryCongrats}>Outstanding Effort!</Text>
            <Text style={styles.summarySessionName}>{workoutName}</Text>
          </View>

          {/* Metric Grid */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>DURATION</Text>
              <Text style={styles.summaryBoxVal}>{formatTimer(elapsedSeconds)}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>EST. BURN</Text>
              <Text style={[styles.summaryBoxVal, { color: Colors.energy[600] }]}>
                {calculatedCaloriesBurned} kcal
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>SETS COMPLETED</Text>
              <Text style={styles.summaryBoxVal}>{completedSets} of {totalSets}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>TOTAL VOLUME</Text>
              <Text style={[styles.summaryBoxVal, { color: Colors.primary[700] }]}>
                {totalVolumeKg.toLocaleString()} kg
              </Text>
            </View>
          </View>

          {/* User Notes */}
          <View style={styles.notesWrap}>
            <Text style={styles.notesLabel}>Session Notes (Optional)</Text>
            <TextInput
              value={completionNotes}
              onChangeText={setCompletionNotes}
              placeholder="e.g. Good pump, hit PR on back squat, felt energetic."
              placeholderTextColor={Colors.textMuted}
              style={styles.notesInput}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save Button */}
          <Button
            title="Save to Activity & Journal"
            onPress={handleSaveAndFinish}
            variant="primary"
            loading={isSubmitting}
            style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}
          />
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDisplayWrap: {
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  timerPausedDot: {
    backgroundColor: Colors.warning,
  },
  stopwatchText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  pauseResumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  pauseResumeText: {
    fontSize: 9,
    fontWeight: Typography.weights.extrabold,
    letterSpacing: 0.8,
  },
  finishBtn: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  finishBtnText: {
    color: Colors.white,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.xs,
  },
  sessionHeaderWrap: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sessionSub: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
    marginTop: 1,
  },
  volumeBadge: {
    alignItems: 'flex-end',
  },
  volumeBadgeLabel: {
    fontSize: 8,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  volumeBadgeVal: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extrabold,
    color: Colors.primary[700],
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
  },
  scrollContainer: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary[50],
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  safetyNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.primary[800],
    lineHeight: 16,
  },
  exerciseCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  muscleTag: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  muscleTagText: {
    fontSize: 10,
    color: Colors.primary[700],
    fontWeight: Typography.weights.semibold,
  },
  equipTag: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  equipTagText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  exActionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  smallActionBtnText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.xs,
    marginTop: 4,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  setsContainer: {
    gap: 6,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  setRowCompleted: {
    backgroundColor: Colors.success + '12',
  },
  setNumBox: {
    width: 44,
    alignItems: 'center',
  },
  setNumber: {
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  setInput: {
    textAlign: 'center',
    fontWeight: Typography.weights.bold,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
  },
  setInputCompleted: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: Colors.success,
  },
  doneBtnContainer: {
    width: 52,
    alignItems: 'center',
  },
  doneBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnActive: {
    backgroundColor: Colors.success,
  },
  deleteSetBtn: {
    padding: 4,
    marginLeft: 2,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary[300],
    backgroundColor: Colors.primary[50],
    marginTop: 4,
  },
  addSetBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  addExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderLight,
  },
  addExerciseText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[600],
  },
  timerBar: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.neutral[900],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.lg,
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    color: Colors.white,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.xs,
  },
  timerValue: {
    color: Colors.energy[400],
    fontWeight: Typography.weights.extrabold,
    fontSize: Typography.sizes.lg,
  },
  timerActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  timerSmallBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  timerSmallBtnText: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  formGuideCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  substitutionCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  addExerciseModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  instructionStep: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  stepNum: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
    width: 18,
  },
  stepText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  subItemName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subItemMeta: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.primary[700],
    fontWeight: Typography.weights.semibold,
    marginTop: 2,
  },
  subItemDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  customExInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceHighlight,
  },
  summaryTrophyBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  trophyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary[200],
    marginBottom: Spacing.sm,
  },
  summaryCongrats: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
  },
  summarySessionName: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  summaryBox: {
    width: '48%',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryBoxLabel: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  summaryBoxVal: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  notesWrap: {
    gap: 6,
    marginTop: Spacing.xs,
  },
  notesLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceHighlight,
    minHeight: 64,
    textAlignVertical: 'top',
  },
});
