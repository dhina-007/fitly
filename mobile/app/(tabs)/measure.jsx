import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';
import { Card, AppHeader, Icon, BottomSheet, Input, Button, DateSelector, LifetimeWeightChart, TopHeader } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { healthService } from '../../services/health.service';
import { useDateStore } from '../../store/dateStore';
import { predictMaintenanceCalories } from '../../utils/calorieCalculator';
import api from '../../services/api';

export default function MeasureScreen() {
  const queryClient = useQueryClient();
  const { profile, user, setProfile } = useAuthStore();
  const { selectedDate } = useDateStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target Weight editing state
  const [targetWeightModalVisible, setTargetWeightModalVisible] = useState(false);
  const [targetWeightInput, setTargetWeightInput] = useState('');
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);

  // Live profile query
  const { data: profileResponse } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await api.get('/auth/profile');
      return res.data?.data;
    },
  });

  // Lifetime weight logs query
  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['weightLogsLifetime', selectedDate],
    queryFn: async () => {
      const res = await api.get('/weight?range=lifetime');
      return res.data?.data || [];
    },
  });

  const weightLogs = logsResponse || [];
  const selectedLog = weightLogs.find(l => l.date === selectedDate);
  const activeProfile = profileResponse || profile || user;
  const currentWeight = selectedLog?.weight || activeProfile?.currentWeight || (weightLogs[weightLogs.length - 1]?.weight) || 0;
  const targetWeight = activeProfile?.targetWeight || 0;

  // Maintenance Calories prediction (Mifflin-St Jeor + user override)
  const predictedMeta = predictMaintenanceCalories({
    weight: currentWeight || 71,
    height: activeProfile?.height || 173,
    age: activeProfile?.age || 26,
    gender: activeProfile?.gender || 'male',
    activityLevel: activeProfile?.activityLevel || 'moderately_active',
    fitnessGoal: activeProfile?.fitnessGoal || 'maintenance',
  });
  const maintenanceCalories =
    activeProfile?.isCustomMaintenance && activeProfile?.tdee
      ? activeProfile.tdee
      : predictedMeta?.maintenanceCalories || activeProfile?.tdee || 0;
  const weightDelta = targetWeight > 0 && currentWeight > 0 ? Math.abs(currentWeight - targetWeight).toFixed(1) : null;
  const isLoss = currentWeight > targetWeight;

  // Sorted Lifetime Logs for Timeline History
  const sortedLifetimeLogs = useMemo(() => {
    if (!weightLogs || weightLogs.length === 0) return [];
    const sortedDesc = [...weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sortedDesc.map((item, idx) => {
      const prev = sortedDesc[idx + 1];
      let deltaText = null;
      let isDown = false;
      if (prev && prev.weight) {
        const diff = (item.weight - prev.weight).toFixed(1);
        if (parseFloat(diff) < 0) {
          deltaText = `↓ ${Math.abs(diff)} kg`;
          isDown = true;
        } else if (parseFloat(diff) > 0) {
          deltaText = `↑ ${diff} kg`;
          isDown = false;
        } else {
          deltaText = `0.0 kg`;
          isDown = true;
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = item.date === todayStr;
      const d = new Date(item.date);
      const formattedDate = isToday
        ? 'Today, ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return {
        ...item,
        formattedDate,
        deltaText,
        isDown,
        isToday,
      };
    });
  }, [weightLogs]);

  const handleSaveTargetWeight = async () => {
    const parsed = parseFloat(targetWeightInput);
    if (!parsed || isNaN(parsed) || parsed < 20 || parsed > 300) {
      Alert.alert('Invalid Target Weight', 'Please enter a realistic weight between 20 kg and 300 kg.');
      return;
    }
    setIsUpdatingTarget(true);
    try {
      const res = await api.put('/auth/profile', { targetWeight: parsed });
      const updatedUser = res.data?.data;
      if (updatedUser) {
        setProfile(updatedUser);
      }
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['weightLogsLifetime']);
      queryClient.invalidateQueries(['dashboardAnalytics']);
      setTargetWeightModalVisible(false);
      useAppStore.getState().showToast(`Target weight updated to ${parsed} kg`, 'success');
      if (Platform.OS !== 'web') {
        Alert.alert('Target Weight Saved', `Your goal has been updated to ${parsed} kg.`);
      }
    } catch (err) {
      useAppStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to update target weight', 'error');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update target weight');
      }
    } finally {
      setIsUpdatingTarget(false);
    }
  };

  const pickImage = async (useCamera = false) => {
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    };

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync(options);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    }
  };

  const handleSave = async () => {
    if (!weightInput) {
      Alert.alert('Error', 'Please enter your weight');
      return;
    }
    setIsSubmitting(true);
    try {
      await healthService.logWeight(weightInput, selectedDate, imageBase64);
      queryClient.invalidateQueries(['weightLogsLifetime']);
      queryClient.invalidateQueries(['dashboardAnalytics']);
      queryClient.invalidateQueries(['userProfile']);
      try {
        const profRes = await api.get('/auth/profile');
        if (profRes.data?.success && profRes.data?.data) {
          setProfile(profRes.data.data);
        }
      } catch {}
      setModalVisible(false);
      setWeightInput('');
      setImageUri(null);
      setImageBase64(null);
      useAppStore.getState().showToast('Weight recorded successfully', 'success');
    } catch (error) {
      useAppStore.getState().showToast('Failed to log weight', 'error');
      if (Platform.OS !== 'web') Alert.alert('Error', 'Failed to log weight');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <TopHeader title="Weight tracker" />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Date Selector Row */}
        <View style={styles.topControlRow}>
          <DateSelector />
          <TouchableOpacity
            style={styles.setGoalShortcut}
            onPress={() => {
              setTargetWeightInput(targetWeight > 0 ? String(targetWeight) : '');
              setTargetWeightModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Icon name="Target" size={13} color={Colors.energy[700]} strokeWidth={2.4} />
            <Text style={styles.setGoalShortcutText}>Edit Goal</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Redesigned Unified Hero Weight Card (No Truncation) */}
        <Card style={styles.heroOverviewCard}>
          <View style={styles.heroGridRow}>
            {/* Current Weight Column */}
            <View style={styles.heroCol}>
              <View style={styles.heroLabelRow}>
                <Icon name="Scale" size={14} color={Colors.primary[600]} />
                <Text style={styles.heroMicroLabel}>CURRENT WEIGHT</Text>
              </View>
              <View style={styles.heroNumRow}>
                <Text style={styles.heroNum}>{currentWeight ? `${currentWeight}` : '--'}</Text>
                <Text style={styles.heroUnit}>kg</Text>
              </View>
              <Text style={styles.heroSubText}>
                {selectedLog ? 'Recorded today' : 'Tap below to record'}
              </Text>
            </View>

            <View style={styles.heroDivider} />

            {/* Target Goal Column */}
            <View style={styles.heroCol}>
              <View style={styles.heroLabelRow}>
                <Icon name="Target" size={14} color={Colors.energy[600]} />
                <Text style={styles.heroMicroLabel}>TARGET GOAL</Text>
              </View>
              <View style={styles.heroNumRow}>
                <Text style={[styles.heroNum, { color: Colors.energy[600] }]}>
                  {targetWeight ? `${targetWeight}` : '--'}
                </Text>
                <Text style={styles.heroUnit}>kg</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setTargetWeightInput(targetWeight > 0 ? String(targetWeight) : '');
                  setTargetWeightModalVisible(true);
                }}
                style={styles.editGoalPill}
                activeOpacity={0.8}
              >
                <Icon name="Edit3" size={11} color={Colors.energy[700]} />
                <Text style={styles.editGoalPillText}>Edit Goal</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Target Progress Bar & Remaining Delta */}
          <View style={styles.goalDeltaBanner}>
            <View style={styles.deltaInfoRow}>
              <Text style={styles.deltaLabel}>Goal Progress</Text>
              <Text style={styles.deltaValue}>
                {targetWeight > 0
                  ? weightDelta
                    ? `${weightDelta} kg to ${isLoss ? 'lose' : 'gain'}`
                    : 'Goal Reached! 🎯'
                  : 'Tap Edit Goal to set target'}
              </Text>
            </View>
          </View>
        </Card>

        {/* 2. Main Prominent Update Weight Button (Cleanly in Flow, No Overlap) */}
        <View style={styles.mainActionWrap}>
          <Button
            variant="primary"
            title={selectedLog ? "Update Today's Weight" : "Record Weight for Today"}
            icon={selectedLog ? "Edit2" : "Plus"}
            onPress={() => {
              setWeightInput(selectedLog ? String(selectedLog.weight) : (currentWeight ? String(currentWeight) : ''));
              setModalVisible(true);
            }}
            style={styles.mainActionBtn}
          />
        </View>

        {/* 3. Lifetime Target Weight Graph */}
        <LifetimeWeightChart
          logs={weightLogs}
          targetWeight={targetWeight}
        />

        {/* 4. Lifetime Weight History Timeline List (Directly below graph) */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyTitle}>Lifetime Weight History</Text>
              <Text style={styles.historySubtitle}>
                {sortedLifetimeLogs.length} total recorded entries
              </Text>
            </View>
          </View>

          {sortedLifetimeLogs.length === 0 ? (
            <Card variant="flat" style={styles.emptyHistoryCard}>
              <Icon name="Calendar" size={24} color={Colors.textMuted} />
              <Text style={styles.emptyHistoryTitle}>No weight history yet</Text>
              <Text style={styles.emptyHistorySub}>Record your weight to build your lifetime log.</Text>
            </Card>
          ) : (
            <View style={styles.timelineList}>
              {sortedLifetimeLogs.map((item, index) => (
                <View key={item._id || index} style={styles.timelineRow}>
                  {/* Timeline Connecting Node & Continuous Vertical Line */}
                  <View style={styles.timelineCol}>
                    <View style={[styles.timelineNode, item.isToday && styles.timelineNodeToday]} />
                    {index < sortedLifetimeLogs.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Timeline Entry Card */}
                  <TouchableOpacity
                    onPress={() => {
                      setWeightInput(String(item.weight));
                      setModalVisible(true);
                    }}
                    style={styles.timelineCard}
                    activeOpacity={0.7}
                  >
                    <View style={styles.timelineCardHeader}>
                      <View>
                        <Text style={styles.timelineDate}>{item.formattedDate}</Text>
                        <View style={styles.timelineWeightRow}>
                          <Text style={styles.timelineWeight}>{item.weight}</Text>
                          <Text style={styles.timelineUnit}>kg</Text>
                        </View>
                      </View>

                      <View style={styles.timelineBadgesRow}>
                        {item.deltaText && (
                          <View style={[styles.deltaBadge, { backgroundColor: item.isDown ? Colors.success + '18' : Colors.warning + '18' }]}>
                            <Text style={[styles.deltaBadgeText, { color: item.isDown ? Colors.success : Colors.warning }]}>
                              {item.deltaText}
                            </Text>
                          </View>
                        )}

                        {item.bmi ? (
                          <View style={styles.bmiBadge}>
                            <Text style={styles.bmiBadgeText}>BMI {item.bmi}</Text>
                          </View>
                        ) : null}

                        {item.imageUrl ? (
                          <View style={styles.photoTagBadge}>
                            <Icon name="Camera" size={11} color={Colors.primary[700]} />
                          </View>
                        ) : null}
                      </View>
                    </View>
                    {item.notes ? (
                      <Text style={styles.timelineNotes} numberOfLines={2}>{item.notes}</Text>
                    ) : null}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 5. Daily Calorie Burn Guidance */}
        <Card style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <View style={styles.flameIconBox}>
              <Icon name="Flame" size={18} color={Colors.energy[600]} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.suggestionTitle}>Daily Calorie Burn</Text>
              <Text style={styles.suggestionSubtitle}>Calories your body burns daily</Text>
            </View>
            <View style={styles.kcalBadge}>
              <Text style={styles.kcalBadgeText}>{maintenanceCalories} kcal/day</Text>
            </View>
          </View>

          <Text style={styles.suggestionText}>
            Based on your recorded weight of <Text style={styles.boldText}>{currentWeight || 0} kg</Text>, 
            your maintenance expenditure is approximately <Text style={styles.boldText}>{maintenanceCalories} kcal/day</Text>. 
            For steady fat loss, target a deficit of 300-500 kcal daily.
          </Text>
        </Card>

        {/* 6. Today's Progress Photo (Cleanly framed, No overlapping buttons) */}
        {selectedLog?.imageUrl && (
          <Card style={styles.photoPreviewCard}>
            <View style={styles.photoCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="Camera" size={16} color={Colors.primary[600]} />
                <Text style={styles.photoCardTitle}>Today's Progress Photo</Text>
              </View>
              <Text style={styles.photoCardDate}>{selectedLog.date}</Text>
            </View>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: `http://localhost:3000${selectedLog.imageUrl}` }}
                style={styles.progressImage}
                resizeMode="cover"
              />
            </View>
          </Card>
        )}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>

      {/* Log/Update Weight BottomSheet Modal */}
      <BottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedLog ? "Update Weight" : "Record Weight"}
        subtitle="Keep your fitness journey on track"
        height={Platform.OS === 'ios' ? '70%' : '76%'}
      >
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Input
            label="Weight (kg)"
            value={weightInput}
            onChangeText={setWeightInput}
            placeholder="e.g. 74.5"
            keyboardType="decimal-pad"
            leftIcon={<Icon name="Scale" size={18} color={Colors.primary[600]} />}
          />

          <Text style={styles.photoSectionLabel}>Progress Photo (Optional)</Text>

          <View style={styles.photoActionsRow}>
            <TouchableOpacity
              style={styles.photoActionCard}
              onPress={() => pickImage(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.photoIconBox, { backgroundColor: Colors.primary[50] }]}>
                <Icon name="Camera" size={20} color={Colors.primary[600]} strokeWidth={2.2} />
              </View>
              <Text style={styles.photoActionTitle}>Take Photo</Text>
              <Text style={styles.photoActionSubtitle}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoActionCard}
              onPress={() => pickImage(false)}
              activeOpacity={0.8}
            >
              <View style={[styles.photoIconBox, { backgroundColor: Colors.secondary[50] }]}>
                <Icon name="Image" size={20} color={Colors.secondary[600]} strokeWidth={2.2} />
              </View>
              <Text style={styles.photoActionTitle}>Upload File</Text>
              <Text style={styles.photoActionSubtitle}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => {
                  setImageUri(null);
                  setImageBase64(null);
                }}
              >
                <Icon name="X" size={14} color="#FFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          <Button
            variant="primary"
            title={selectedLog ? "Update Weight" : "Save Weight"}
            onPress={handleSave}
            loading={isSubmitting}
            style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}
          />
        </ScrollView>
      </BottomSheet>

      {/* Target Weight BottomSheet Modal */}
      <BottomSheet
        visible={targetWeightModalVisible}
        onClose={() => setTargetWeightModalVisible(false)}
        title="Set Target Weight"
        subtitle="Configure your weight goal & caloric targets"
        height={480}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.targetModalContent}>
          <Text style={styles.targetHelperText}>
            Enter your desired target body weight in kg. We'll automatically compute your recommended caloric deficit/surplus and daily maintenance baseline.
          </Text>

          <Input
            label="Target Weight (kg)"
            value={targetWeightInput}
            onChangeText={setTargetWeightInput}
            placeholder="e.g. 68.0"
            keyboardType="decimal-pad"
            leftIcon={<Icon name="Target" size={18} color={Colors.energy[600]} />}
          />

          {/* Quick Preset Buttons */}
          <View style={styles.presetsBox}>
            <Text style={styles.presetsTitle}>Quick Goal Presets (vs {currentWeight || 70} kg):</Text>
            <View style={styles.presetsRow}>
              {[-2, -5, -10, 2, 5].map((delta) => {
                const calculated = Math.max(20, Math.round(((currentWeight || 70) + delta) * 10) / 10);
                return (
                  <TouchableOpacity
                    key={delta}
                    onPress={() => setTargetWeightInput(String(calculated))}
                    style={styles.presetChip}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.presetChipText}>{delta > 0 ? `+${delta}` : delta} kg</Text>
                    <Text style={styles.presetChipSub}>{calculated} kg</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Button
            variant="primary"
            title="Save Target Weight"
            onPress={handleSaveTargetWeight}
            loading={isUpdatingTarget}
            style={{ marginTop: Spacing.md }}
          />
        </ScrollView>
      </BottomSheet>
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
  scrollContainer: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setGoalShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.energy[50],
    borderWidth: 1,
    borderColor: Colors.energy[200],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  setGoalShortcutText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.energy[800],
  },
  heroOverviewCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  heroGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  heroDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.xs,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroMicroLabel: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    letterSpacing: Typography.tracking.wider,
  },
  heroNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  heroNum: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  heroUnit: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  heroSubText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  editGoalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.energy[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.energy[200],
  },
  editGoalPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.energy[700],
  },
  goalDeltaBanner: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  deltaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deltaLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  deltaValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  mainActionWrap: {
    marginTop: -2,
  },
  mainActionBtn: {
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  suggestionCard: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flameIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.energy[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  suggestionSubtitle: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
  },
  kcalBadge: {
    backgroundColor: Colors.energy[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.energy[200],
  },
  kcalBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.energy[700],
  },
  suggestionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  photoPreviewCard: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  photoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoCardTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  photoCardDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  progressImage: {
    width: '100%',
    height: '100%',
  },
  historySection: {
    gap: Spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
  },
  historyTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  historySubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  emptyHistoryCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyHistoryTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  emptyHistorySub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  timelineList: {
    gap: Spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.sm,
  },
  timelineCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 12,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.neutral[300],
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 2,
  },
  timelineNodeToday: {
    backgroundColor: Colors.primary[600],
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginTop: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  timelineWeightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  timelineWeight: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
  },
  timelineUnit: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  timelineNotes: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  timelineBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  deltaBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  bmiBadge: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  bmiBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  photoTagBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  photoSectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: Typography.tracking.wider,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  photoActionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
    ...Shadows.sm,
  },
  photoIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  photoActionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  photoActionSubtitle: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textMuted,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetModalContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  targetHelperText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  presetsBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  presetsTitle: {
    fontSize: Typography.sizes['2xs'],
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: Typography.tracking.wider,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    backgroundColor: Colors.energy[50],
    borderWidth: 1,
    borderColor: Colors.energy[200],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.energy[800],
  },
  presetChipSub: {
    fontSize: 9,
    color: Colors.energy[600],
  },
});
